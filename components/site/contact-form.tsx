"use client";

import { useActionState, useEffect, useRef } from "react";
import { submitInquiry, type ContactState } from "@/lib/actions/inquiries";
import type { Dictionary } from "@/lib/dictionaries";

const field =
  "w-full border-0 border-b-2 border-line bg-transparent px-0 py-3 text-lg text-ink placeholder:text-muted/60 focus:border-ink focus:outline-none focus:ring-0 aria-[invalid=true]:border-danger";

export function ContactForm({ t }: { t: Dictionary["contact"] }) {
  const [state, action, pending] = useActionState<ContactState, FormData>(submitInquiry, { status: "idle" });
  const typeRef = useRef<HTMLSelectElement>(null);
  const invalid = (name: string) => (state.status === "error" && state.fields?.includes(name) ? true : undefined);

  useEffect(() => {
    const type = new URLSearchParams(window.location.search).get("type");
    if (type && typeRef.current && Object.keys(t.types).includes(type)) typeRef.current.value = type;
  }, [t.types]);

  if (state.status === "success") {
    return (
      <div role="status" className="border-l-4 border-scale py-6 pl-6">
        <p className="font-serif text-4xl leading-tight text-ink">{t.success}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-8" noValidate>
      {/* Honeypot for bots; hidden from people and assistive tech. */}
      <div aria-hidden className="absolute -left-[9999px]">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-muted">{t.name}</span>
          <input name="name" required autoComplete="name" className={field} aria-invalid={invalid("name")} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-muted">{t.email}</span>
          <input name="email" type="email" required autoComplete="email" className={field} aria-invalid={invalid("email")} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-muted">{t.company}</span>
          <input name="company" autoComplete="organization" className={field} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-muted">{t.type}</span>
          <select ref={typeRef} name="type" defaultValue="project" className={field}>
            {Object.entries(t.types).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block">
        <span className="text-sm font-semibold text-muted">{t.message}</span>
        <textarea name="message" required rows={5} className={`${field} resize-y`} aria-invalid={invalid("message")} />
      </label>

      {state.status === "error" && (
        <p role="alert" className="font-medium text-danger">
          {t.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-ink px-8 py-4 text-lg font-bold text-paper transition-colors hover:bg-ink-deep disabled:opacity-60"
      >
        {pending ? t.sending : t.submit}
      </button>
    </form>
  );
}
