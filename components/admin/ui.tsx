"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps, ReactNode } from "react";
import { buttonClass, inputClass } from "./styles";

export { buttonClass, inputClass };

export function Field({
  label,
  hint,
  error,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="block text-sm font-semibold text-text">{label}</span>
      {children}
      {hint && !error && <span className="block text-xs text-muted">{hint}</span>}
      {error && <span className="block text-xs font-medium text-danger">{error}</span>}
    </label>
  );
}

export function Input(props: ComponentProps<"input">) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Textarea(props: ComponentProps<"textarea">) {
  return <textarea rows={4} {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Select(props: ComponentProps<"select">) {
  return <select {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Checkbox({ label, ...props }: ComponentProps<"input"> & { label: string }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm font-medium text-text">
      <input type="checkbox" {...props} className="size-4 accent-ink" />
      {label}
    </label>
  );
}

export function SubmitButton({
  children,
  pendingLabel = "Menyimpan…",
  variant = "primary",
  ...props
}: ComponentProps<"button"> & { pendingLabel?: string; variant?: "primary" | "danger" | "ghost" }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || props.disabled}
      {...props}
      className={`${buttonClass(variant)} ${props.className ?? ""}`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

export function FormMessage({ error, ok }: { error?: string; ok?: boolean }) {
  if (error) {
    return (
      <p role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
        {error}
      </p>
    );
  }
  if (ok) {
    return (
      <p role="status" className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
        Perubahan tersimpan.
      </p>
    );
  }
  return null;
}
