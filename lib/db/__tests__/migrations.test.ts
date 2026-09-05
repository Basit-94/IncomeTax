import { describe, expect, it } from "vitest";
import { MIGRATIONS, validateMigrations } from "../migrations";

describe("migrations (plan §4.1)", () => {
  it("the shipped list is unique, ordered and non-empty", () => {
    expect(validateMigrations()).toEqual([]);
    expect(MIGRATIONS[0].id).toBe("0001_baseline_tax_vault_users");
    // The baseline must be the table lib/db/postgres.ts used to create ad hoc,
    // so an existing database keeps its rows and vault ids.
    expect(MIGRATIONS[0].sql).toContain("CREATE TABLE IF NOT EXISTS tax_vault_users");
    expect(MIGRATIONS[0].sql).toContain("pan VARCHAR(10) UNIQUE NOT NULL");
  });

  it("names the tables the plan requires", () => {
    const all = MIGRATIONS.map((m) => m.sql).join("\n");
    for (const table of [
      "wapsi_sessions",
      "vault_documents",
      "vault_document_bytes",
      "vault_extractions",
      "vault_access_audit",
      "return_snapshots",
      "return_command_log",
      "agent_runs",
      "agent_run_events",
      "agent_outputs",
      "agent_memory",
      "agent_budget_usage",
    ]) {
      expect(all, table).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);
    }
  });

  it("rejects duplicates and out-of-order ids", () => {
    expect(validateMigrations([{ id: "0002_b", sql: "x" }, { id: "0001_a", sql: "x" }])).toContain("0001_a is not after 0002_b");
    expect(validateMigrations([{ id: "0001_a", sql: "x" }, { id: "0001_a", sql: "x" }])).toContain("duplicate id 0001_a");
    expect(validateMigrations([{ id: "0001_a", sql: "  " }])).toContain("0001_a has no SQL");
  });
});
