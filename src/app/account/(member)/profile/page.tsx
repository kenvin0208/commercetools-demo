import Link from "next/link";
import { requireCustomer } from "@/src/lib/account/session";
import { updateProfileAction } from "@/src/lib/account/actions";
import { AccountForm } from "@/src/components/account/AccountForm";
import { Field, NameFields } from "@/src/components/account/Fields";
import { AddressSummary } from "@/src/components/account/AddressSummary";

export default async function ProfilePage() {
  const customer = await requireCustomer();
  const address = customer.addresses.find(address => address.id === customer.defaultShippingAddressId);
  return <><h2 className="text-2xl font-bold">Personal information</h2><p className="mb-8 mt-2 text-sm text-slate-500">Keep your profile up to date.</p>
    <AccountForm action={updateProfileAction} submitLabel="Save changes" className="max-w-2xl space-y-5">
      <input type="hidden" name="version" value={customer.version} />
      <NameFields firstName={customer.firstName} lastName={customer.lastName} />
      <Field label="Email address" type="email" value={customer.email} readOnly />
      <Field label="Date of birth" name="dateOfBirth" type="date" autoComplete="bday" max={new Date().toISOString().slice(0, 10)} defaultValue={customer.dateOfBirth} />
    </AccountForm>
    <section className="mt-10 border-t border-slate-100 pt-6"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h3 className="font-bold">Default shipping address</h3><Link href="/account/addresses" className="text-sm font-semibold underline underline-offset-4">Manage addresses</Link></div><AddressSummary address={address} /></section>
  </>;
}
