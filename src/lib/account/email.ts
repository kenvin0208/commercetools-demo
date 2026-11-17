import "server-only";
import { createHash } from "node:crypto";

export function resetEmailConfiguration() {
  const { RESEND_API_KEY: apiKey, RESEND_FROM_EMAIL: from, APP_URL: appUrl } = process.env;
  if (!apiKey || !from || !appUrl) throw new Error("Password reset email is not configured.");
  const origin = new URL(appUrl);
  if (origin.username || origin.password || !["http:", "https:"].includes(origin.protocol) || (process.env.NODE_ENV === "production" && origin.protocol !== "https:")) {
    throw new Error("Invalid application URL.");
  }
  return { apiKey, from, origin: origin.origin };
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const { apiKey, from, origin } = resetEmailConfiguration();
  const link = new URL("/account/reset-password", origin);
  link.searchParams.set("token", token);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json",
      "Idempotency-Key": `reset-${createHash("sha256").update(token).digest("hex")}` },
    body: JSON.stringify({ from, to: [email], subject: "Reset your NamNX password",
      text: `You requested a password reset for your NamNX account.\n\nChoose a new password: ${link.toString()}\n\nThis link expires in 30 minutes and can only be used once. If you did not request this email, you can ignore it.`,
    }),
    cache: "no-store", signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error("Password reset email delivery failed.");
}
