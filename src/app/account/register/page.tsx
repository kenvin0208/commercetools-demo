import Link from "next/link";
import { redirect } from "next/navigation";
import { currentCustomer } from "@/src/lib/account/session";
import { registerAction } from "@/src/lib/account/actions";
import { AccountForm } from "@/src/components/account/AccountForm";
import { AddressFields, Field, NewPasswordFields } from "@/src/components/account/Fields";
import { AuthShell } from "@/src/components/account/AuthShell";

export default async function RegisterPage() {
  if (await currentCustomer()) redirect("/account/profile");
  return <AuthShell title="Create your account" description="Your details, favorites and orders, all together. Fields marked * are required.">
    <AccountForm action={registerAction} submitLabel="Create account">
      <AddressFields />
      <Field label="Email address" type="email" name="email" autoComplete="email" maxLength={254} required />
      <NewPasswordFields name="password" />
    </AccountForm>
    <p className="mt-8 text-sm text-slate-500">Already a member? <Link href="/account/login" className="font-semibold text-slate-900 underline underline-offset-4">Sign in</Link></p>
  </AuthShell>;
}
