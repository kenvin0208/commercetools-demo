"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const links = [["/account/profile", "Personal information"], ["/account/addresses", "Address book"], ["/account/password", "Change password"], ["/account/wishlist", "My wishlist"], ["/account/orders", "My orders"]];
export function AccountNavigation() {
  const pathname = usePathname();
  return <nav aria-label="Account" className="flex flex-wrap gap-2 lg:flex-col">{links.map(([href, label]) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>{label}</Link>;
  })}</nav>;
}
