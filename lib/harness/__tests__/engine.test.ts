import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetDbForTests } from "../../server/db";
import { createUser, setOnboarding } from "../../server/auth";
import { forgetDataKeys, putSlot, resetVaultForTests, slotStatuses } from "../../server/vault";
import { createOnboardingProfile } from "../../onboarding";
import { runTurn, type TurnInput } from "../engine";
import type { RunEvent } from "../events";
import { getRun } from "../runs";
import { getFiledReturn } from "../returns";
import { recall } from "../memory";
import { completeConnect } from "../../server/digilocker";

/** Drive the engine offline (no key) and collect the events of one turn. */
async function turn(input: TurnInput): Promise<RunEvent[]> {
  const events: RunEvent[] = [];
  for await (const event of runTurn(input)) events.push(event);
  return events;
}

const ANSWERS: Record<string, { value: string; masked: string; choice?: string }> = {
  employment_type: { value: "salaried", masked: "A salaried job", choice: "salaried" },
  form16_available: { value: "no", masked: "No", choice: "no" },
  gross_salary: { value: "1400000", masked: "₹14,00,000" },
  tds_192: { value: "110000", masked: "₹1,10,000" },
  has_interest: { value: "yes", masked: "Yes", choice: "yes" },
  savings_interest: { value: "6500", masked: "₹6,500" },
  has_pf: { value: "yes", masked: "Yes", choice: "yes" },
  pf_contribution: { value: "43200", masked: "₹43,200" },
  pays_rent: { value: "no", masked: "No", choice: "no" },
  has_insurance: { value: "no", masked: "No", choice: "no" },
  full_name: { value: "Asha Verma", masked: "A••••a" },
  pan: { value: "DEMPV4417K", masked: "DEXXXXXX7K" },
  dob: { value: "1997-05-14", masked: "1997-05-14" },
  aadhaar: { value: "234567890124", masked: "XXXX XXXX 0124" },
  mobile: { value: "9876543210", masked: "XXXXXX3210" },
  email: { value: "asha@example.in", masked: "as…@example.in" },
  bank_account: { value: "123456789012", masked: "XXXXXXXX9012" },
  ifsc: { value: "SBIN0001234", masked: "SBIN0001234" },
  regime_choice: { value: "cheaper", masked: "Pick the cheaper one for me", choice: "cheaper" },
};

describe("engine (offline planner)", () => {
  const savedKey = process.env.GEMINI_API_KEY;
  const savedFlag = process.env.AGENT_REQUIRE_CONFIRMATION;

  beforeEach(() => {
    resetDbForTests();
    resetVaultForTests();
    forgetDataKeys();
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    if (savedKey !== undefined) process.env.GEMINI_API_KEY = savedKey;
    if (savedFlag === undefined) delete process.env.AGENT_REQUIRE_CONFIRMATION;
    else process.env.AGENT_REQUIRE_CONFIRMATION = savedFlag;
  });

  async function fileReturnFlow(userId: string, username: string, profile: TurnInput["profile"]) {
    const base = { userId, username, profile, lang: "en" as const };
    const first = await turn({ ...base, text: "I got a job with a 14 lakh package and I need to file my taxes. What is the best play here?" });
    const start = first.find((e) => e.type === "run.start");
    if (!start || start.type !== "run.start") throw new Error("no run.start");
    expect(start.offline).toBe(true);
    expect(first.find((e) => e.type === "plan")).toBeTruthy();
    let events = first;
    const all: RunEvent[] = [...first];
    const asked: string[] = [];
    for (let i = 0; i < 40; i++) {
      const ask = [...events].reverse().find((e) => e.type === "ask");
      const confirm = events.find((e) => e.type === "card" && e.card.type === "confirm");
      const done = events.find((e) => e.type === "run.done");
      if (confirm || (done && done.type === "run.done" && done.status === "complete")) break;
      if (!ask || ask.type !== "ask") throw new Error(`turn ${i}: nothing to answer; last events ${events.slice(-3).map((e) => e.type).join(",")}`);
      const answer = ANSWERS[ask.slotId];
      if (!answer) throw new Error(`no scripted answer for ${ask.slotId}`);
      asked.push(ask.slotId);
      // The browser writes the value to the vault first, then passes only the mask.
      putSlot(userId, ask.slotId, answer.value, { masked: answer.masked, source: "user" });
      events = await turn({ ...base, runId: start.runId, answer: { askId: ask.askId, slotId: ask.slotId, masked: answer.masked, choice: answer.choice } });
      all.push(...events);
    }
    return { runId: start.runId, events, all, asked };
  }

  it("interviews, computes through the engine, waits for confirmation, files, and remembers", async () => {
    process.env.AGENT_REQUIRE_CONFIRMATION = "true";
    const user = createUser("asha", "secret1");
    const profile = createOnboardingProfile({ lang: "en", intent: "plan_new_job", profession: "salaried", ageBand: "under_30", residency: "resident", incomeSources: ["salary", "interest"], incomeBand: "12_to_25", holdings: ["pf"], filingHistory: "never", filedBy: "self", helpLevel: "do_it" }, "en")!;
    setOnboarding(user.id, profile);
    const { runId, events, all, asked } = await fileReturnFlow(user.id, user.username, profile);
    // No Form 16: the upload was never asked; freelance slots were skipped for a salaried person.
    expect(asked).not.toContain("form16");
    expect(asked).not.toContain("freelance_income");
    expect(asked[0]).toBe("employment_type");
    const confirm = events.find((e) => e.type === "card" && e.card.type === "confirm");
    expect(confirm).toBeTruthy();
    const review = events.find((e) => e.type === "card" && e.card.type === "review");
    expect(review).toBeTruthy();
    expect(getFiledReturn(user.id)).toBeNull();
    // Values never appear in the events the route would persist and stream.
    const streamed = JSON.stringify(all);
    for (const secret of ["234567890124", "DEMPV4417K", "9876543210", "123456789012", "asha@example.in"]) expect(streamed).not.toContain(secret);
    expect(streamed).toContain("XXXX XXXX 0124");

    const filed = await turn({ userId: user.id, username: user.username, profile, lang: "en", runId, confirm: { cardId: "confirm-file", action: "file_return" } });
    const outputs = filed.filter((e) => e.type === "output");
    expect(outputs.map((e) => (e.type === "output" ? e.kind : ""))).toEqual(["itr-json", "itr-v"]);
    expect(filed.find((e) => e.type === "run.done")).toMatchObject({ status: "complete" });
    const record = getFiledReturn(user.id)!;
    expect(record.ackNumber.startsWith("DEMO")).toBe(true);
    expect(record.form).toBe("ITR-1");
    expect(record.person.pan).toBe("DEMPV4417K");
    expect(record.breakdown.refundOrDue).toBeGreaterThan(0);
    expect(getRun(user.id, runId)?.status).toBe("complete");
    const memories = recall(user.id).map((m) => m.key);
    expect(memories).toEqual(expect.arrayContaining(["employment", "has_pf", "regime_used_ay_2026_27", "filed_ay_2026_27"]));

    // A later chat reuses the vault: identity is not asked again.
    const again = await fileReturnFlow(user.id, user.username, profile);
    expect(again.asked).not.toContain("pan");
    expect(again.asked).not.toContain("aadhaar");
    expect(again.asked).not.toContain("gross_salary");
  });

  it("files without a click when the confirmation flag is off (plan D3)", async () => {
    process.env.AGENT_REQUIRE_CONFIRMATION = "false";
    const user = createUser("ravi", "secret1");
    const { events } = await fileReturnFlow(user.id, user.username, null);
    expect(events.find((e) => e.type === "card" && e.card.type === "confirm")).toBeUndefined();
    expect(events.filter((e) => e.type === "output")).toHaveLength(2);
    expect(getFiledReturn(user.id)).not.toBeNull();
  });

  it("pulls identity from a linked DigiLocker instead of asking", async () => {
    process.env.AGENT_REQUIRE_CONFIRMATION = "true";
    const user = createUser("meera", "secret1");
    completeConnect(user.id, "mock-x");
    const { asked, all } = await fileReturnFlow(user.id, user.username, null);
    for (const slot of ["pan", "aadhaar", "full_name", "dob"]) expect(asked).not.toContain(slot);
    expect(slotStatuses(user.id).pan.source).toBe("digilocker");
    expect(all.some((e) => e.type === "card" && e.card.type === "document" && e.card.source === "digilocker")).toBe(true);
  });

  it("answers a business question with the presumptive scheme and a notice with a draft", async () => {
    const user = createUser("dev", "secret1");
    const base = { userId: user.id, username: user.username, profile: null, lang: "en" as const };
    const first = await turn({ ...base, text: "I have a small business with 40 lakh revenue. What are the best tax benefits I could get?" });
    const start = first.find((e) => e.type === "run.start")!;
    if (start.type !== "run.start") throw new Error();
    let events = first;
    const script: Record<string, { value: string; masked: string; choice?: string }> = {
      business_type: { value: "profession", masked: "Profession", choice: "profession" },
      revenue: { value: "4000000", masked: "₹40,00,000" },
      digital_share: { value: "yes", masked: "Yes", choice: "yes" },
      gst_registered: { value: "no", masked: "No", choice: "no" },
    };
    for (let i = 0; i < 10; i++) {
      const ask = [...events].reverse().find((e) => e.type === "ask");
      if (!ask || ask.type !== "ask") break;
      const a = script[ask.slotId]!;
      putSlot(user.id, ask.slotId, a.value, { masked: a.masked, source: "user" });
      events = await turn({ ...base, runId: start.runId, answer: { askId: ask.askId, slotId: ask.slotId, masked: a.masked, choice: a.choice } });
    }
    const result = events.find((e) => e.type === "tool.result" && e.name === "presumptive_income");
    expect(result && result.type === "tool.result" ? result.summary : "").toContain("44ADA");
    expect(events.find((e) => e.type === "run.done")).toMatchObject({ status: "complete" });

    const notice = await turn({ ...base, text: "I got a letter from the income tax department and I am not sure what it means." });
    const nStart = notice.find((e) => e.type === "run.start")!;
    if (nStart.type !== "run.start") throw new Error();
    const firstAsk = [...notice].reverse().find((e) => e.type === "ask");
    expect(firstAsk && firstAsk.type === "ask" ? firstAsk.slotId : "").toBe("notice_kind");
  });
});
