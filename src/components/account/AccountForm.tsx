"use client";

import { useActionState, startTransition, type ReactNode } from "react";
import { Button } from "@/src/components/ui/Button";
import type { ActionState } from "@/src/lib/account/validation";

export function AccountForm({ action, children, submitLabel, className = "space-y-5", confirmMessage }: {
  action: (state: ActionState, data: FormData) => Promise<ActionState>;
  children: ReactNode;
  submitLabel?: string;
  className?: string;
  confirmMessage?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className={className} onSubmit={event => {
      event.preventDefault();
      if (confirmMessage && !window.confirm(confirmMessage)) return;
      const submitter = (event.nativeEvent as SubmitEvent).submitter;
      const data = new FormData(event.currentTarget, submitter);
      // Keep entered values when the server returns validation errors. The
      // action attribute still supports submission before hydration.
      startTransition(() => formAction(data));
    }}>
      <fieldset disabled={pending} className="min-w-0 space-y-4 disabled:opacity-60">
        {children}
        {submitLabel && <Button type="submit">{pending ? "Please wait…" : submitLabel}</Button>}
      </fieldset>
      {state.error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{state.error} <a className="underline" href="/account/login" hidden={!state.error.includes("session")}>Sign in</a></p>}
      {state.success && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{state.success}</p>}
    </form>
  );
}
