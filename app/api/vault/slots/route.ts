import { NextResponse, type NextRequest } from "next/server";
import { userFromRequest } from "@/lib/server/session";
import { deleteSlot, putSlot, slotStatuses } from "@/lib/server/vault";
import { slotSpec } from "@/lib/harness/tasks";
import { issueText, validateDob, validateIdentifier, validateMoney } from "@/lib/validation";
import { formatRupees } from "@/lib/harness/interview";

/**
 * The isolated write path (plan §3.3 step 4): the browser sends a value here, never to the
 * model. The slot spec decides how it is validated and masked; the response carries only
 * the mask, which is what the next `/api/agent/stream` turn passes along.
 */
export async function GET(request: NextRequest) {
  const user = userFromRequest(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  return NextResponse.json({ slots: slotStatuses(user.id) });
}

export async function PUT(request: NextRequest) {
  const user = userFromRequest(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  let body: { slotId?: unknown; value?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "malformed" }, { status: 400 });
  }
  if (typeof body.slotId !== "string" || typeof body.value !== "string") return NextResponse.json({ error: "missing" }, { status: 400 });
  const spec = slotSpec(body.slotId);
  if (!spec) return NextResponse.json({ error: "unknown_slot" }, { status: 400 });

  let value = body.value.trim();
  let masked = value;
  let choice: string | undefined;
  switch (spec.input.kind) {
    case "identifier": {
      const result = validateIdentifier(spec.input.format, value);
      if (!result.ok) return NextResponse.json({ error: "invalid", message: issueText(spec.input.format, result.issue) }, { status: 422 });
      value = result.value;
      masked = result.masked;
      break;
    }
    case "money": {
      const result = validateMoney(value, { min: spec.input.min, max: spec.input.max });
      if (!result.ok) return NextResponse.json({ error: "invalid", message: issueText("money", result.issue) }, { status: 422 });
      value = String(result.value);
      masked = formatRupees(result.value);
      break;
    }
    case "date": {
      const result = validateDob(value);
      if (!result.ok) return NextResponse.json({ error: "invalid", message: issueText("dob", result.issue) }, { status: 422 });
      break;
    }
    case "yesno": {
      if (value !== "yes" && value !== "no") return NextResponse.json({ error: "invalid", message: "Answer yes or no." }, { status: 422 });
      masked = value === "yes" ? "Yes" : "No";
      choice = value;
      break;
    }
    case "select": {
      const option = spec.input.options.find((o) => o.value === value);
      if (!option) return NextResponse.json({ error: "invalid", message: "Pick one of the options." }, { status: 422 });
      masked = option.label;
      choice = option.value;
      break;
    }
    case "text": {
      if (!value) return NextResponse.json({ error: "invalid", message: "It cannot be empty." }, { status: 422 });
      value = value.slice(0, spec.input.maxLength ?? 400);
      masked = spec.secret ? (value.length > 2 ? `${value.slice(0, 1)}${"•".repeat(Math.min(6, value.length - 2))}${value.slice(-1)}` : "••") : value.length > 40 ? `${value.slice(0, 40)}…` : value;
      break;
    }
    case "upload":
      return NextResponse.json({ error: "use_documents" }, { status: 400 });
  }
  const status = putSlot(user.id, spec.id, value, { masked, source: "user", actor: "user" });
  return NextResponse.json({ slot: status, masked, choice });
}

export async function DELETE(request: NextRequest) {
  const user = userFromRequest(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const slotId = request.nextUrl.searchParams.get("slotId");
  if (!slotId) return NextResponse.json({ error: "missing" }, { status: 400 });
  deleteSlot(user.id, slotId);
  return NextResponse.json({ deleted: true });
}
