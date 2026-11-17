import type { TypedMoney } from "@commercetools/platform-sdk";
export function orderMoney(money: TypedMoney) {
  const amount = money.type === "highPrecision" ? money.preciseAmount / 10 ** money.fractionDigits : money.centAmount / 10 ** money.fractionDigits;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: money.currencyCode }).format(amount);
}
export function orderDate(date: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(date));
}
export function OrderStatus({ value }: { value?: string }) {
  const label = value ? value.replace(/([a-z])([A-Z])/g, "$1 $2") : "Not available";
  const tone = value === "Paid" || value === "Shipped" || value === "Complete" ? "bg-emerald-50 text-emerald-800" : value === "Cancelled" || value === "Failed" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-700";
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{label}</span>;
}
