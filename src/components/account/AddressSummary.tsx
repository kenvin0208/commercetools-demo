import type { BaseAddress } from "@commercetools/platform-sdk";
export function AddressSummary({ address }: { address?: BaseAddress }) {
  if (!address) return <p className="text-sm text-slate-500">No address provided.</p>;
  return <address className="space-y-1 text-sm not-italic leading-6 text-slate-600">
    <p className="font-semibold text-slate-900">{address.firstName} {address.lastName}</p>
    {address.company && <p>{address.company}</p>}
    <p>{address.streetNumber} {address.streetName}</p>
    {address.additionalStreetInfo && <p>{address.additionalStreetInfo}</p>}
    <p>{[address.city, address.state, address.postalCode].filter(Boolean).join(", ")}</p>
    <p>{address.country}</p>{address.phone && <p>{address.phone}</p>}{address.email && <p>{address.email}</p>}
  </address>;
}
