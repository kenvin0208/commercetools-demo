"use client";
import { signOutAction } from "@/src/lib/account/actions";
import { Button } from "@/src/components/ui/Button";
export default function AccountError({ reset }: { reset: () => void }) {
  return <div className="mx-auto max-w-xl px-6 py-16 text-center"><h2 className="text-2xl font-bold">Unable to load your account</h2><p className="my-5 text-slate-500">The account service may be temporarily unavailable, or your session may have expired.</p><div className="flex justify-center gap-4"><Button onClick={reset}>Try again</Button><form action={signOutAction}><Button type="submit" variant="secondary">Sign in again</Button></form></div></div>;
}
