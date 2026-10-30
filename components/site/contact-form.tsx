"use client";

import { useActionState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { ArrowUpRight, Check } from "@phosphor-icons/react";
import { submitInquiry, type ContactState } from "@/lib/actions/inquiries";
import type { Dictionary } from "@/lib/dictionaries";

const field =
  "w-full rounded-2xl bg-milk px-5 py-4 text-lg text-plum shadow-[inset_3px_3px_8px_rgba(42,30,63,0.08),inset_-3px_-3px_8px_rgba(255,255,255,0.9)] outline-none transition-shadow duration-500 placeholder:text-plum-soft/50 focus:shadow-[inset_3px_3px_8px_rgba(42,30,63,0.08),0_0_0_3px_var(--lilac)] aria-[invalid=true]:shadow-[inset_3px_3px_8px_rgba(42,30,63,0.08),0_0_0_3px_#f3a6bd]";

export function ContactForm({ t }: { t: Dictionary["contact"] }) {
  const [state, action, pending] = useActionState<ContactState, FormData>(submitInquiry, { status: "idle" });
  const typeRef = useRef<HTMLFieldSetElement>(null);
  const invalid = (name: string) => (state.status === "error" && state.fields?.includes(name) ? true : undefined);

  useEffect(() => {
    const type = new URLSearchParams(window.location.search).get("type");
    const input = typeRef.current?.querySelector<HTMLInputElement>(`input[value="${type}"]`);
    if (input) input.checked = true;
  }, []);

  if (state.status === "success") {
    return (
      <motion.div
        role="status"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
        className="flex flex-col items-start gap-6 p-4 sm:p-6"
      >
        <span className="clay grid size-16 place-items-center rounded-full" style={{ ["--clay" as string]: "var(--mint)" }}>
          <Check weight="light" className="size-7 text-plum" />
        </span>
        <p className="display text-[clamp(2rem,4vw,3.2rem)] text-plum">{t.success}</p>
      </motion.div>
    );
  }

  return (
    <form action={action} className="space-y-6 p-2 sm:p-4" noValidate>
      {/* Honeypot for bots; hidden from people and assistive tech. */}
      <div aria-hidden className="absolute -left-[9999px]">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <fieldset ref={typeRef}>
        <legend className="mb-3 text-sm font-semibold text-plum-soft">{t.type}</legend>
        <div className="flex flex-wrap gap-2">
          {Object.entries(t.types).map(([value, label], i) => (
            <label key={value} className="cursor-pointer">
              <input type="radio" name="type" value={value} defaultChecked={i === 0} className="peer sr-only" />
              <span className="inline-flex rounded-full bg-milk px-4 py-2.5 text-[15px] font-semibold text-plum-soft ring-1 ring-plum/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] peer-checked:bg-[var(--lilac)] peer-checked:text-plum peer-checked:ring-transparent peer-focus-visible:outline-2 peer-focus-visible:outline-[var(--berry)]">
                {label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-plum-soft">{t.name}</span>
          <input name="name" required autoComplete="name" className={field} aria-invalid={invalid("name")} />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-plum-soft">{t.email}</span>
          <input name="email" type="email" required autoComplete="email" className={field} aria-invalid={invalid("email")} />
        </label>
      </div>
      <label className="block space-y-2">
        <span className="text-sm font-semibold text-plum-soft">{t.company}</span>
        <input name="company" autoComplete="organization" className={field} />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-semibold text-plum-soft">{t.message}</span>
        <textarea name="message" required rows={5} className={`${field} resize-y`} aria-invalid={invalid("message")} />
      </label>

      {state.status === "error" && (
        <p role="alert" className="rounded-2xl bg-[#ffe1ea] px-4 py-3 font-medium text-plum">
          {t.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="group inline-flex items-center gap-4 rounded-full bg-plum py-2.5 pl-7 pr-2.5 text-lg font-semibold text-milk transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? t.sending : t.submit}
        <span className="grid size-11 place-items-center rounded-full bg-[var(--butter)] text-plum transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-px group-hover:translate-x-0.5 group-hover:scale-105">
          <ArrowUpRight weight="light" className="size-5" />
        </span>
      </button>
    </form>
  );
}
