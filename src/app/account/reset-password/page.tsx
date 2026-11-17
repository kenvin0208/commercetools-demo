import Link from "next/link";
import type { Metadata } from "next";
import { resetPasswordAction } from "@/src/lib/account/actions";
import { AccountForm } from "@/src/components/account/AccountForm";
import { NewPasswordFields } from "@/src/components/account/Fields";
import { AuthShell } from "@/src/components/account/AuthShell";

export const metadata: Metadata = { referrer: "no-referrer", robots: { index: false, follow: false } };
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <AuthShell title="Choose a new password" description="Use a password of at least 8 characters that you don’t use elsewhere.">
    {typeof token === "string" && token.length > 0 && token.length <= 1024 ? <AccountForm action={resetPasswordAction} submitLabel="Reset password"><input type="hidden" name="token" value={token} /><NewPasswordFields /></AccountForm> : <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">This link is missing a valid reset token.</p>}
    <Link href="/account/forgot-password" className="mt-8 inline-block text-sm font-semibold underline underline-offset-4">Request a new reset link</Link>
  </AuthShell>;
}
