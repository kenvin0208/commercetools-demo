import Link from "next/link";
import { redirect } from "next/navigation";
import { currentCustomer } from "@/src/lib/account/session";
import { signInAction } from "@/src/lib/account/actions";
import { safeReturnTo } from "@/src/lib/account/validation";
import { AccountForm } from "@/src/components/account/AccountForm";
import { Field } from "@/src/components/account/Fields";
import { AuthShell } from "@/src/components/account/AuthShell";

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const returnTo = safeReturnTo(params.returnTo);
  if (await currentCustomer()) redirect(returnTo);
  return <AuthShell title="Welcome back" description="Sign in to your NamNX account.">
    {(params.registered || params.reset || params.changed) && <p role="status" className="mb-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{params.registered ? "Your account is ready. Please sign in." : "Your password has been updated. Please sign in again."}</p>}
    <AccountForm action={signInAction} submitLabel="Sign in">
      <input type="hidden" name="returnTo" value={returnTo} />
      <Field label="Email address" type="email" name="email" autoComplete="email" maxLength={254} required />
      <Field label="Password" type="password" name="password" autoComplete="current-password" maxLength={128} required />
      <Link href="/account/forgot-password" className="block text-sm font-medium underline underline-offset-4">Forgot your password?</Link>
    </AccountForm>
    <p className="mt-8 text-sm text-slate-500">New here? <Link href="/account/register" className="font-semibold text-slate-900 underline underline-offset-4">Create an account</Link></p>
  </AuthShell>;
}
