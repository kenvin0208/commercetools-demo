import Link from "next/link";
import { forgotPasswordAction } from "@/src/lib/account/actions";
import { AccountForm } from "@/src/components/account/AccountForm";
import { Field } from "@/src/components/account/Fields";
import { AuthShell } from "@/src/components/account/AuthShell";

export default function ForgotPasswordPage() {
  return <AuthShell title="Forgot your password?" description="Enter your email and we’ll send you a link to choose a new password. The link expires in 30 minutes.">
    <AccountForm action={forgotPasswordAction} submitLabel="Send reset link"><Field label="Email address" type="email" name="email" autoComplete="email" maxLength={254} required /></AccountForm>
    <Link href="/account/login" className="mt-8 inline-block text-sm font-semibold underline underline-offset-4">Back to sign in</Link>
  </AuthShell>;
}
