/**
 * Encryption at rest for stored originals (plan.md §4.2: "Add actual protected
 * storage/key handling and accurate disclosures; do not carry forward an
 * unsupported 'zero-knowledge' claim for a service that decrypts documents
 * for processing").
 *
 * AES-256-GCM with a per-document random IV. The key comes from
 * WAPSI_VAULT_KEY (32 bytes, base64). Without it the service refuses to store
 * bytes rather than storing them in the clear — the honest failure the plan
 * asks for. `keyId` is recorded with every blob so a rotation can tell which
 * key decrypts what.
 */

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import type { EncryptedBytes } from "./repository";

export interface VaultKey {
  id: string;
  bytes: Buffer;
}

export function loadVaultKey(env: Record<string, string | undefined> = process.env): VaultKey | null {
  const raw = env.WAPSI_VAULT_KEY;
  if (!raw) return null;
  let bytes: Buffer;
  try {
    bytes = Buffer.from(raw, "base64");
  } catch {
    return null;
  }
  if (bytes.length !== 32) return null;
  return { id: createHash("sha256").update(bytes).digest("hex").slice(0, 16), bytes };
}

export function encryptBytes(plain: Uint8Array, key: VaultKey): EncryptedBytes {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key.bytes, iv);
  const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()]);
  return { iv, authTag: cipher.getAuthTag(), ciphertext, keyId: key.id };
}

export function decryptBytes(blob: EncryptedBytes, key: VaultKey): Uint8Array {
  if (blob.keyId !== key.id) throw new Error("vault key mismatch");
  const decipher = createDecipheriv("aes-256-gcm", key.bytes, Buffer.from(blob.iv));
  decipher.setAuthTag(Buffer.from(blob.authTag));
  return Buffer.concat([decipher.update(Buffer.from(blob.ciphertext)), decipher.final()]);
}

export function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}
