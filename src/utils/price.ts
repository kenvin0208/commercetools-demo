import { DEFAULT_CURRENCY, DEFAULT_LOCALE } from "@/src/constants";

export function formatPrice(
  centAmount: number,
  currencyCode = DEFAULT_CURRENCY,
  locale = DEFAULT_LOCALE
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
  }).format(centAmount / 100);
}
