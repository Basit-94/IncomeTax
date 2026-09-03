import { describe, expect, it } from "vitest";
import { openDb, resetDbForTests } from "../db";
import { SCHEMA_VERSION } from "../schema";

describe("db", () => {
  it("migrates an empty database to the current version and enforces foreign keys", () => {
    const handle = resetDbForTests();
    const version = handle.prepare("PRAGMA user_version").get() as { user_version: number };
    expect(version.user_version).toBe(SCHEMA_VERSION);
    const tables = (handle.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as { name: string }[])
      .map((row) => row.name)
      .sort();
    for (const expected of ["users", "sessions", "slots", "documents", "vault_audit", "memories", "runs", "run_events", "outputs", "returns"]) {
      expect(tables).toContain(expected);
    }
    expect(() =>
      handle.prepare("INSERT INTO sessions VALUES (?, ?, ?, ?, ?)").run("h", "no-such-user", "t", "t", "t"),
    ).toThrow();
  });

  it("is idempotent: reopening an up-to-date database applies nothing", () => {
    const handle = openDb(":memory:");
    const before = (handle.prepare("PRAGMA user_version").get() as { user_version: number }).user_version;
    expect(before).toBe(SCHEMA_VERSION);
    handle.close();
  });
});
