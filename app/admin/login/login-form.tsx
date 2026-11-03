"use client";

import { useActionState } from "react";
import { signIn } from "@/lib/actions/auth";
import { Field, FormMessage, Input, SubmitButton } from "@/components/admin/ui";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(signIn, {});
  return (
    <form action={action} className="mt-6 space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      {/* Honeypot for bots; hidden from people and assistive tech. */}
      <div aria-hidden className="absolute -left-[9999px]">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <Field label="Email">
        <Input name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password">
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>
      <FormMessage error={state.error} />
      <SubmitButton pendingLabel="Memeriksa…" className="w-full">
        Masuk
      </SubmitButton>
    </form>
  );
}
