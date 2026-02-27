import crypto from "crypto";
import { config } from "../config";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

/**
 * Derive a 32-byte key from the config encryption key using SHA-256.
 */
function deriveKey(): Buffer {
  return crypto.createHash("sha256").update(config.encryption.key).digest();
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a string in the format: iv:authTag:ciphertext (all base64).
 */
export function encrypt(text: string): string {
  const key = deriveKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
}

/**
 * Decrypt a string encrypted with encrypt().
 * Expects format: iv:authTag:ciphertext (all base64).
 */
export function decrypt(encryptedText: string): string {
  const key = deriveKey();
  const parts = encryptedText.split(":");

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted text format");
  }

  const iv = Buffer.from(parts[0], "base64");
  const authTag = Buffer.from(parts[1], "base64");
  const ciphertext = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Mask an API key for safe display.
 * Shows the last 4 characters, masks the rest.
 */
export function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 4) {
    return "****";
  }
  return `${"*".repeat(Math.min(apiKey.length - 4, 20))}${apiKey.slice(-4)}`;
}
