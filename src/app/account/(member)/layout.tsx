import { requireCustomer } from "@/src/lib/account/session";
import { signOutAction } from "@/src/lib/account/actions";
import { AccountNavigation } from "@/src/components/account/AccountNavigation";
import { Button } from "@/src/components/ui/Button";

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const customer = await requireCustomer();
  return <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">My account</p><h1 className="mt-3 text-3xl font-bold tracking-tight">Hello, {customer.firstName || "there"}.</h1><p className="mt-2 text-sm text-slate-500">Make yourself at home.</p></div><form action={signOutAction}><Button type="submit" variant="secondary">Sign out</Button></form></div>
    <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]"><aside><AccountNavigation /></aside><div className="min-w-0 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">{children}</div></div>
  </div>;
}
