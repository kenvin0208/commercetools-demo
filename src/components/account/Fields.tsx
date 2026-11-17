import type { InputHTMLAttributes } from "react";
import type { BaseAddress } from "@commercetools/platform-sdk";
import { Input } from "@/src/components/ui/Input";

export function Field({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className="block space-y-2 text-sm font-medium text-slate-700"><span>{label}{props.required ? " *" : ""}</span><Input {...props} /></label>;
}

export function NameFields({ firstName, lastName }: { firstName?: string; lastName?: string }) {
  return <div className="grid gap-4 sm:grid-cols-2">
    <Field label="First name" name="firstName" defaultValue={firstName} autoComplete="given-name" maxLength={100} required />
    <Field label="Last name" name="lastName" defaultValue={lastName} autoComplete="family-name" maxLength={100} required />
  </div>;
}

export function AddressFields({ address = {}, includeName = true }: { address?: Partial<BaseAddress>; includeName?: boolean }) {
  return <>
    {includeName && <NameFields firstName={address.firstName} lastName={address.lastName} />}
    <Field label="Street address" name="streetName" defaultValue={address.streetName} autoComplete="address-line1" maxLength={256} required />
    <Field label="Apartment, suite, etc. (optional)" name="additionalStreetInfo" defaultValue={address.additionalStreetInfo} autoComplete="address-line2" maxLength={256} />
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="City" name="city" defaultValue={address.city} autoComplete="address-level2" maxLength={100} required />
      <Field label="State / Province" name="state" defaultValue={address.state} autoComplete="address-level1" maxLength={100} />
      <Field label="Postal code" name="postalCode" defaultValue={address.postalCode} autoComplete="postal-code" maxLength={30} />
      <label className="block space-y-2 text-sm font-medium text-slate-700"><span>Country *</span>
        <select name="country" defaultValue={address.country ?? "US"} autoComplete="country" required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          {["US", "VN", "GB", "DE", "AU", "CA", "FR", "SG", "JP", "NZ", "NL", "IT", "ES", "TH", "MY", "ID", "PH", "KR", "IN", "CN", "HK", "TW", "CH", "SE", "NO", "DK", "BE", "AT", "IE", "PL", "PT", "FI", "AE", "BR", "MX", "ZA", ...(address.country ? [address.country] : [])].filter((country, index, all) => all.indexOf(country) === index).sort((a, b) => new Intl.DisplayNames(["en"], { type: "region" }).of(a)!.localeCompare(new Intl.DisplayNames(["en"], { type: "region" }).of(b)!)).map(country => <option key={country} value={country}>{new Intl.DisplayNames(["en"], { type: "region" }).of(country)}</option>)}
        </select>
      </label>
    </div>
    <Field label="Phone number" type="tel" name="phone" defaultValue={address.phone} autoComplete="tel" maxLength={30} required />
  </>;
}

export function NewPasswordFields({ name = "newPassword" }: { name?: string }) {
  return <>
    <Field label="New password (8–128 characters)" type="password" name={name} autoComplete="new-password" minLength={8} maxLength={128} required />
    <Field label="Confirm password" type="password" name="confirmPassword" autoComplete="new-password" minLength={8} maxLength={128} required />
  </>;
}
