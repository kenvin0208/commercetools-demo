import "server-only";
import { createHash } from "node:crypto";
import { AccountInputError } from "./validation";

// Local protection for this demo. Deployments with multiple instances should also
// enforce shared limits at the gateway (see docs/customer-account.md).
const attempts = new Map<string, { count: number; expires: number }>();
export function limitAccountAttempts(operation: string, identity: string, maximum = 8) {
  const now = Date.now();
  for (const [key, value] of attempts) if (value.expires <= now) attempts.delete(key);
  const key = createHash("sha256").update(`${operation}:${identity}`).digest("hex");
  const bucket = attempts.get(key) ?? { count: 0, expires: now + 15 * 60 * 1000 };
  if (bucket.count >= maximum || attempts.size >= 10000) throw new AccountInputError("Too many attempts. Please try again in 15 minutes.");
  bucket.count += 1;
  attempts.set(key, bucket);
}
