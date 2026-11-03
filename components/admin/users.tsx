"use client";

import { useActionState, useState, useTransition } from "react";
import { Key } from "@phosphor-icons/react";
import {
  createUser,
  resetUserPassword,
  revokeUserSessions,
  setUserDisabled,
  setUserRole,
  type CreateUserState,
  type Role,
} from "@/lib/actions/users";
import { CopyButton } from "./ai-connect";
import { Field, FormMessage, Input, Select, SubmitButton, buttonClass } from "./ui";

/** The one-time password box shown after creating an account or resetting a password. */
function OneTimePassword({ email, password, note }: { email: string; password: string; note: string }) {
  return (
    <div role="status" className="space-y-2 rounded-xl border border-success/40 bg-success/10 p-4 text-sm">
      <p className="font-semibold text-text">{note}</p>
      <p className="text-muted">
        Kirim ke <strong className="text-text">{email}</strong> lewat jalur pribadi. Password ini hanya tampil sekali; minta pengguna menggantinya di halaman Akun.
      </p>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded bg-paper-raised px-2 py-1.5 text-[15px] tracking-wide">{password}</code>
        <CopyButton value={password} />
      </div>
    </div>
  );
}

export function CreateUserForm() {
  const [state, action] = useActionState<CreateUserState, FormData>(createUser, {});
  return (
    <div className="space-y-4">
      {state.created && (
        <OneTimePassword email={state.created.email} password={state.created.password} note={`Akun ${state.created.name} sudah dibuat.`} />
      )}
      <form action={action} className="grid gap-3 sm:grid-cols-[1fr_1fr_10rem_auto] sm:items-end">
        <Field label="Nama">
          <Input name="name" required minLength={2} maxLength={80} autoComplete="off" />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" required autoComplete="off" />
        </Field>
        <Field label="Role">
          <Select name="role" defaultValue="editor">
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </Select>
        </Field>
        <SubmitButton pendingLabel="Membuat…">Tambah</SubmitButton>
      </form>
      <FormMessage error={state.error} />
    </div>
  );
}

type Row = { id: string; name: string; email: string; role: string; disabled: boolean };

/** Role, reset, sign-out, and on/off controls for someone else's account. */
export function UserActions({ user, canDemote }: { user: Row; canDemote: boolean }) {
  const [pending, start] = useTransition();
  const [password, setPassword] = useState<string>();
  const [error, setError] = useState<string>();

  const run = (fn: () => Promise<unknown>, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setError(undefined);
    start(async () => {
      try {
        await fn();
      } catch {
        setError("Perubahan ditolak. Pastikan masih ada admin aktif lain.");
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          aria-label={`Role ${user.name}`}
          value={user.role}
          disabled={pending || user.disabled || (user.role === "admin" && !canDemote)}
          onChange={(e) => {
            const role = e.target.value as Role;
            run(() => setUserRole(user.id, role), `Ubah role ${user.name} menjadi ${role === "admin" ? "Admin" : "Editor"}?`);
          }}
          className="w-auto!"
        >
          <option value="editor">Editor</option>
          <option value="admin">Admin</option>
        </Select>
        <button
          type="button"
          disabled={pending}
          className={buttonClass("ghost")}
          onClick={() =>
            run(async () => {
              const result = await resetUserPassword(user.id);
              if (result.error) setError(result.error);
              else setPassword(result.password);
            }, `Buat password baru untuk ${user.name}? Password lama langsung tidak berlaku dan semua sesinya diputus.`)
          }
        >
          <Key size={16} /> Reset password
        </button>
        {!user.disabled && (
          <button
            type="button"
            disabled={pending}
            className={buttonClass("ghost")}
            onClick={() => run(() => revokeUserSessions(user.id), `Keluarkan ${user.name} dari semua perangkat?`)}
          >
            Putus sesi
          </button>
        )}
        <button
          type="button"
          disabled={pending || (!user.disabled && user.role === "admin" && !canDemote)}
          className={buttonClass(user.disabled ? "ghost" : "danger")}
          onClick={() =>
            run(
              () => setUserDisabled(user.id, !user.disabled),
              user.disabled
                ? `Aktifkan lagi akun ${user.name}?`
                : `Nonaktifkan ${user.name}? Ia langsung keluar dari semua perangkat dan token AI miliknya dicabut.`,
            )
          }
        >
          {user.disabled ? "Aktifkan" : "Nonaktifkan"}
        </button>
      </div>
      {password && <OneTimePassword email={user.email} password={password} note={`Password baru untuk ${user.name}.`} />}
      {error && <FormMessage error={error} />}
    </div>
  );
}
