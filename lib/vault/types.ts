/**
 * Vault vocabulary shared by the browser store and the server repository.
 * Type-only, so the client bundle never pulls in the server modules.
 */

export type DocumentProvenance =
  | "uploaded"
  | "legacy_backend"
  | "synthetic"
  | "metadata_only"
  | "generated_output";

export type VaultDocType =
  | "FORM_16"
  | "ANNUAL_INFO_STATEMENT"
  | "FORM_26AS"
  | "BANK_STATEMENT"
  | "CHALLAN_280"
  | "ITR_V"
  | "OTHER";
