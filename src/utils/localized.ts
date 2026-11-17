import { DEFAULT_LOCALE } from "@/src/constants";

export function getLocalizedValue(
  values?: Record<string, string>,
  locale = DEFAULT_LOCALE
): string {
  if (!values) {
    return "";
  }

  if (values[locale]) {
    return values[locale];
  }

  return Object.values(values)[0] ?? "";
}
