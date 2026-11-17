import { requireCustomer } from "@/src/lib/account/session";
import { addressAction, saveAddressAction } from "@/src/lib/account/actions";
import { AccountForm } from "@/src/components/account/AccountForm";
import { AddressFields } from "@/src/components/account/Fields";
import { AddressSummary } from "@/src/components/account/AddressSummary";
import { Button } from "@/src/components/ui/Button";

export default async function AddressesPage() {
  const customer = await requireCustomer();
  return <><h2 className="text-2xl font-bold">Address book</h2><p className="mb-8 mt-2 text-sm text-slate-500">Manage your delivery and billing addresses.</p>
    <div className="grid gap-5 xl:grid-cols-2">{customer.addresses.map(address => <section key={address.id} className="rounded-2xl border border-slate-200 p-5">
      <div className="mb-3 flex flex-wrap gap-2">{address.id === customer.defaultShippingAddressId && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">Default shipping</span>}{address.id === customer.defaultBillingAddressId && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">Default billing</span>}</div>
      <AddressSummary address={address} />
      <details className="mt-5"><summary className="cursor-pointer text-sm font-semibold underline underline-offset-4">Edit address</summary><AccountForm action={saveAddressAction} submitLabel="Save address" className="mt-4 space-y-4"><input type="hidden" name="version" value={customer.version} /><input type="hidden" name="addressId" value={address.id} /><AddressFields address={address} /></AccountForm></details>
      <AccountForm action={addressAction} className="mt-4 space-y-3"><input type="hidden" name="version" value={customer.version} /><input type="hidden" name="addressId" value={address.id} /><div className="flex flex-wrap gap-2">
        {address.id !== customer.defaultShippingAddressId && <Button type="submit" name="operation" value="setDefaultShippingAddress" variant="secondary" size="sm">Use for shipping</Button>}
        {address.id !== customer.defaultBillingAddressId && <Button type="submit" name="operation" value="setDefaultBillingAddress" variant="secondary" size="sm">Use for billing</Button>}
      </div></AccountForm>
      <AccountForm action={addressAction} className="mt-3 space-y-3" confirmMessage="Remove this address from your account?"><input type="hidden" name="version" value={customer.version} /><input type="hidden" name="addressId" value={address.id} /><input type="hidden" name="operation" value="removeAddress" /><Button type="submit" variant="danger" size="sm">Remove address</Button></AccountForm>
    </section>)}</div>
    {customer.addresses.length === 0 && <p className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">Your address book is empty. Add your first address below.</p>}
    <details className="mt-8 rounded-2xl border border-dashed border-slate-300 p-5" open={customer.addresses.length === 0}><summary className="cursor-pointer font-semibold">+ Add a new address</summary><AccountForm key={customer.addresses.length} action={saveAddressAction} submitLabel="Add address" className="mt-6 max-w-2xl space-y-5"><input type="hidden" name="version" value={customer.version} /><AddressFields address={{ firstName: customer.firstName, lastName: customer.lastName }} /></AccountForm></details>
  </>;
}
