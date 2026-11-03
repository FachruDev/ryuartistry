"use client";

import { useActionState } from "react";
import { changePassword, updateProfile } from "@/lib/actions/account";
import type { FormState } from "@/lib/forms";
import { Field, FormMessage, Input, SubmitButton } from "./ui";

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const [state, action] = useActionState<FormState, FormData>(updateProfile, {});
  return (
    <form action={action} className="space-y-4">
      <Field label="Nama">
        <Input name="name" defaultValue={name} required minLength={2} maxLength={80} autoComplete="name" />
      </Field>
      <Field label="Email" hint="Email dipakai untuk masuk; minta admin bila perlu diganti.">
        <Input value={email} readOnly disabled />
      </Field>
      <FormMessage error={state.error} ok={state.ok} />
      <SubmitButton>Simpan</SubmitButton>
    </form>
  );
}

export function PasswordForm({ email }: { email: string }) {
  const [state, action] = useActionState<FormState, FormData>(changePassword, {});
  return (
    <form action={action} className="space-y-4">
      {/* A username field lets password managers attach the new password to the right account. */}
      <input type="text" name="username" value={email} autoComplete="username" hidden readOnly />
      <Field label="Password sekarang">
        <Input name="currentPassword" type="password" required autoComplete="current-password" />
      </Field>
      <Field label="Password baru" hint="Minimal 12 karakter. Kalimat pendek yang mudah diingat lebih kuat daripada kata acak yang pendek.">
        <Input name="newPassword" type="password" required minLength={12} maxLength={128} autoComplete="new-password" />
      </Field>
      <Field label="Ulangi password baru">
        <Input name="confirmPassword" type="password" required minLength={12} maxLength={128} autoComplete="new-password" />
      </Field>
      <FormMessage error={state.error} ok={state.ok} />
      <SubmitButton pendingLabel="Mengganti…">Ganti password</SubmitButton>
      {state.ok && <p className="text-sm text-muted">Password diganti. Semua perangkat lain sudah dikeluarkan.</p>}
    </form>
  );
}
