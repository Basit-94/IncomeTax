import { describe, expect, it } from "vitest";
import type { Pool } from "pg";
import { PostgresRunStore } from "../store";
import type { Run } from "../types";

/** A pool that records SQL instead of talking to Postgres — enough to pin the UPDATE's shape. */
function recordingPool() {
  const calls: { sql: string; params: unknown[] }[] = [];
  const pool = {
    query: async (sql: string, params: unknown[] = []) => {
      calls.push({ sql, params });
      return { rows: [], rowCount: 0 };
    },
  } as unknown as Pool;
  return { pool, calls };
}

const run: Run = {
  id: "run_1", ownerPan: "DEMPS4417K", ownerKind: "demo", assessmentYear: "2026-27",
  task: "prepare_salaried_return", title: "I got a job", status: "waiting_for_input", lang: "en",
  knowledgeRelease: "2026-09-05.2",
  state: { steps: [], answers: {}, sources: [], usage: { toolCalls: 0, modelCalls: 0, tokens: 0 } },
  createdAt: "2026-09-05T12:00:00.000Z", updatedAt: "2026-09-05T12:00:00.000Z",
};

describe("PostgresRunStore.saveRun — persists everything the runtime mutates after creation", () => {
  it("writes task and knowledge_release, not only status/state/title (regression: a classified run re-read as 'explain')", async () => {
    const { pool, calls } = recordingPool();
    const store = new PostgresRunStore(pool, () => "2026-09-05T12:00:01.000Z");
    await store.saveRun(run);
    const update = calls.find((c) => /UPDATE agent_runs/.test(c.sql))!;
    expect(update).toBeDefined();
    expect(update.sql).toMatch(/\btask = \$\d/);
    expect(update.sql).toMatch(/\bknowledge_release = \$\d/);
    expect(update.sql).toMatch(/\bstatus = \$\d/);
    expect(update.sql).toMatch(/\bstate = \$\d::jsonb/);
    expect(update.params).toContain("prepare_salaried_return");
    expect(update.params).toContain("2026-09-05.2");
    expect(update.params).toContain("waiting_for_input");
  });
});
