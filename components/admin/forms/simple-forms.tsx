"use client";

import { useActionState } from "react";
import type { Media, Service, SiteSettings, TeamMember } from "@/lib/db/schema";
import { linksToText, type FormState } from "@/lib/forms";
import { LocalizedField } from "../localized-field";
import { MediaPicker } from "../media-picker";
import { Field, FormMessage, Input, Select, SubmitButton, Textarea } from "../ui";

type Action = (prev: FormState, form: FormData) => Promise<FormState>;

export function ServiceForm({ action, service }: { action: Action; service?: Service }) {
  const [state, formAction] = useActionState(action, {});
  const errors = state.fieldErrors ?? {};
  return (
    <form action={formAction} className="max-w-3xl space-y-6">
      <LocalizedField name="title" label="Nama layanan" defaultValue={service?.title} error={errors.title} />
      <LocalizedField name="description" label="Deskripsi" multiline defaultValue={service?.description} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Slug" error={errors.slug} hint="Kosongkan untuk otomatis">
          <Input name="slug" defaultValue={service?.slug} />
        </Field>
        <Field label="Disiplin" hint="Menentukan ikon di situs">
          <Select name="icon" defaultValue={service?.icon ?? "creative"}>
            <option value="ai">AI</option>
            <option value="game">Game</option>
            <option value="software">Software</option>
            <option value="creative">Kreatif</option>
          </Select>
        </Field>
        <Field label="Urutan">
          <Input name="sortOrder" type="number" defaultValue={service?.sortOrder ?? 0} />
        </Field>
      </div>
      <FormMessage error={state.error} ok={state.ok} />
      <SubmitButton>{service ? "Simpan perubahan" : "Buat layanan"}</SubmitButton>
    </form>
  );
}

export function TeamForm({ action, member }: { action: Action; member?: TeamMember & { photo: Media | null } }) {
  const [state, formAction] = useActionState(action, {});
  const errors = state.fieldErrors ?? {};
  return (
    <form action={formAction} className="max-w-3xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <Field label="Nama" error={errors.name}>
          <Input name="name" defaultValue={member?.name} required />
        </Field>
        <Field label="Urutan">
          <Input name="sortOrder" type="number" defaultValue={member?.sortOrder ?? 0} />
        </Field>
      </div>
      <LocalizedField name="role" label="Peran" defaultValue={member?.role} />
      <LocalizedField name="bio" label="Bio singkat" multiline defaultValue={member?.bio} />
      <MediaPicker name="photoId" label="Foto" defaultValue={member?.photo} />
      <Field label="Tautan sosial" hint="Satu per baris: Label | https://…">
        <Textarea name="socials" rows={3} defaultValue={linksToText(member?.socials ?? [])} placeholder="LinkedIn | https://linkedin.com/in/…" />
      </Field>
      <FormMessage error={state.error} ok={state.ok} />
      <SubmitButton>{member ? "Simpan perubahan" : "Tambah anggota"}</SubmitButton>
    </form>
  );
}

export function SettingsForm({ action, settings }: { action: Action; settings?: SiteSettings }) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form action={formAction} className="max-w-3xl space-y-6">
      <LocalizedField name="tagline" label="Tagline" defaultValue={settings?.tagline} hint="Dipakai sebagai deskripsi SEO dan di footer." />
      <LocalizedField
        name="heroTitle"
        label="Judul hero"
        defaultValue={settings?.heroTitle}
        hint="Kosongkan untuk memakai judul bawaan."
      />
      <LocalizedField name="heroSubtitle" label="Subjudul hero" multiline defaultValue={settings?.heroSubtitle} />
      <Field label="Email kontak">
        <Input name="contactEmail" type="email" defaultValue={settings?.contactEmail ?? ""} />
      </Field>
      <Field label="Tautan sosial" hint="Satu per baris: Label | https://…">
        <Textarea name="socials" rows={4} defaultValue={linksToText(settings?.socials ?? [])} placeholder="Instagram | https://instagram.com/ryuartistry" />
      </Field>
      <FormMessage error={state.error} ok={state.ok} />
      <SubmitButton>Simpan pengaturan</SubmitButton>
    </form>
  );
}
