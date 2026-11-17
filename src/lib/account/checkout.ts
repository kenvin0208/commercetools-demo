import type { Customer, BaseAddress } from "@commercetools/platform-sdk";

export function customerCartFields(customer: Customer, fallbackCountry: string) {
  const shipping = customer.addresses.find(address => address.id === customer.defaultShippingAddressId) ?? customer.addresses[0];
  const billing = customer.addresses.find(address => address.id === customer.defaultBillingAddressId) ?? shipping;
  const fallback: BaseAddress = { country: fallbackCountry, firstName: customer.firstName, lastName: customer.lastName, email: customer.email };
  return {
    customerId: customer.id,
    customerEmail: customer.email,
    country: shipping?.country ?? fallbackCountry,
    shippingAddress: shipping ? { ...shipping, id: undefined, email: customer.email } : fallback,
    billingAddress: billing ? { ...billing, id: undefined, email: customer.email } : fallback,
  };
}
