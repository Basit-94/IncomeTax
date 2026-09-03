import { describe, expect, it } from "vitest";
import { validateEnvironment } from "../env";

describe("env validation", () => {
  it("passes validation in non-production with defaults", () => {
    const result = validateEnvironment(false);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("fails in production when VAULT_MASTER_KEY is missing", () => {
    const saved = process.env.VAULT_MASTER_KEY;
    const savedGen = process.env.VAULT_ALLOW_GENERATED_KEY;
    try {
      delete process.env.VAULT_MASTER_KEY;
      delete process.env.VAULT_ALLOW_GENERATED_KEY;
      const result = validateEnvironment(true);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("VAULT_MASTER_KEY is not set");
    } finally {
      if (saved) process.env.VAULT_MASTER_KEY = saved;
      if (savedGen) process.env.VAULT_ALLOW_GENERATED_KEY = savedGen;
    }
  });

  it("passes in production when valid 64-hex VAULT_MASTER_KEY is provided", () => {
    const saved = process.env.VAULT_MASTER_KEY;
    try {
      process.env.VAULT_MASTER_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
      const result = validateEnvironment(true);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    } finally {
      if (saved) process.env.VAULT_MASTER_KEY = saved;
      else delete process.env.VAULT_MASTER_KEY;
    }
  });
});
