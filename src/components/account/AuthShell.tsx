import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-16">
    <div className="grid overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm lg:grid-cols-[0.8fr_1.2fr]">
      <aside className="bg-slate-900 p-8 text-white lg:p-12">
        <Link href="/" className="text-xl font-black">NamNX</Link>
        <p className="mt-12 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Your personal space</p>
        <h2 className="mt-4 text-4xl font-bold leading-tight">A little more<br />made for you.</h2>
        <p className="mt-5 max-w-sm leading-7 text-slate-300">Keep your favorites close, manage your details, and follow every order in one place.</p>
        <ul className="mt-8 space-y-4 text-sm text-slate-200"><li>♡ Save the things you love</li><li>⌂ Keep your addresses ready</li><li>↗ Follow your orders</li></ul>
      </aside>
      <section className="p-6 sm:p-10 lg:p-12"><h1 className="text-3xl font-bold tracking-tight">{title}</h1><p className="mb-8 mt-3 text-sm leading-6 text-slate-500">{description}</p>{children}</section>
    </div>
  </div>;
}
