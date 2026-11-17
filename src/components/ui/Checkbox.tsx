import type { InputHTMLAttributes } from "react";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function Checkbox({ className = "", ...props }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      className={`h-4 w-4 rounded border-slate-300 text-slate-900 accent-slate-900 focus:ring-2 focus:ring-slate-300 ${className}`}
      {...props}
    />
  );
}
