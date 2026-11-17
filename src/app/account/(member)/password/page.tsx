import { requireCustomer } from "@/src/lib/account/session";
import { changePasswordAction } from "@/src/lib/account/actions";
import { AccountForm } from "@/src/components/account/AccountForm";
import { Field, NewPasswordFields } from "@/src/components/account/Fields";

export default async function PasswordPage() {
  const customer = await requireCustomer();
  return <><h2 className="text-2xl font-bold">Change password</h2><p className="mb-8 mt-2 text-sm text-slate-500">You’ll sign in again after changing your password.</p><AccountForm action={changePasswordAction} submitLabel="Update password" className="max-w-lg space-y-5">
    <input type="hidden" name="version" value={customer.version} />
    <input type="hidden" name="username" value={customer.email} autoComplete="username" />
    <Field label="Current password" name="currentPassword" type="password" autoComplete="current-password" maxLength={128} required />
    <NewPasswordFields />
  </AccountForm></>;
}
