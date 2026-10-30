"use client";

import { useActionState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Check } from "@phosphor-icons/react";
import { submitInquiry, type ContactState } from "@/lib/actions/inquiries";
import type { Dictionary } from "@/lib/dictionaries";
import { ArrowIcon } from "./ui";

const field =
  "w-full rounded-2xl bg-paper px-5 py-4 text-lg text-ink ring-1 ring-line outline-none transition-shadow duration-300 placeholder:text-muted/60 focus:ring-2 focus:ring-ink aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-danger";
const label = "text-sm font-semibold text-muted";

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
        className="flex flex-col items-center gap-6 py-10 text-center"
      >
        <span className="grid size-16 place-items-center rounded-full bg-mint text-on-pastel">
          <Check weight="bold" className="size-7" />
        </span>
        <p className="display max-w-[18ch] text-[clamp(2rem,4vw,3rem)] text-ink">{t.success}</p>
      </motion.div>
    );
  }

  return (
    <form action={action} className="space-y-6" noValidate>
      {/* Honeypot for bots; hidden from people and assistive tech. */}
      <div aria-hidden className="absolute -left-[9999px]">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <fieldset ref={typeRef}>
        <legend className={`mb-3 ${label}`}>{t.type}</legend>
        <div className="flex flex-wrap gap-2">
          {Object.entries(t.types).map(([value, text], i) => (
            <label key={value} className="cursor-pointer">
              <input type="radio" name="type" value={value} defaultChecked={i === 0} className="peer sr-only" />
              <span className="inline-flex rounded-full bg-paper px-4 py-2.5 text-[15px] font-semibold text-muted ring-1 ring-line transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:text-ink peer-checked:bg-ink peer-checked:text-paper peer-checked:ring-ink peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
                {text}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className={label}>{t.name}</span>
          <input name="name" required autoComplete="name" className={field} aria-invalid={invalid("name")} />
        </label>
        <label className="block space-y-2">
          <span className={label}>{t.email}</span>
          <input name="email" type="email" required autoComplete="email" className={field} aria-invalid={invalid("email")} />
        </label>
      </div>
      <label className="block space-y-2">
        <span className={label}>{t.company}</span>
        <input name="company" autoComplete="organization" className={field} />
      </label>
      <label className="block space-y-2">
        <span className={label}>{t.message}</span>
        <textarea name="message" required rows={5} className={`${field} resize-y`} aria-invalid={invalid("message")} />
      </label>

      {state.status === "error" && (
        <p role="alert" className="rounded-2xl bg-peach px-4 py-3 font-medium text-on-pastel">
          {t.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="group inline-flex items-center gap-2.5 rounded-full bg-ink px-7 py-4 text-base font-semibold text-paper transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-16px_rgb(31_37_80/0.55)] active:scale-[0.97] disabled:opacity-60"
      >
        {pending ? t.sending : t.submit}
        <ArrowIcon className="size-4 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:translate-x-1" />
      </button>
    </form>
  );
}
