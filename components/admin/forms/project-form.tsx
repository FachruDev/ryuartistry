"use client";

import { useActionState } from "react";
import type { Category, Media, Project } from "@/lib/db/schema";
import { linksToText, type FormState } from "@/lib/forms";
import { LocalizedField } from "../localized-field";
import { LocalizedRichText } from "../rich-text";
import { GalleryPicker, MediaPicker } from "../media-picker";
import { Checkbox, Field, FormMessage, Input, Select, SubmitButton, Textarea } from "../ui";

type Props = {
  action: (prev: FormState, form: FormData) => Promise<FormState>;
  project?: Project & { cover: Media | null };
  gallery?: Media[];
  categories: Category[];
};

export function ProjectForm({ action, project, gallery, categories }: Props) {
  const [state, formAction] = useActionState(action, {});
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} data-save-form className="grid gap-8 xl:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <LocalizedField name="title" label="Judul" defaultValue={project?.title} error={errors.title} />
        <Field label="Slug" hint="Bagian URL. Kosongkan untuk dibuat otomatis dari judul." error={errors.slug}>
          <Input name="slug" defaultValue={project?.slug} placeholder="nama-proyek" />
        </Field>
        <LocalizedField name="summary" label="Ringkasan" multiline defaultValue={project?.summary} hint="Satu atau dua kalimat untuk kartu karya." />
        <LocalizedRichText name="body" label="Studi kasus" defaultValue={project?.body} />
        <GalleryPicker name="gallery" label="Galeri" defaultValue={gallery} />
      </div>

      <aside className="space-y-5 xl:sticky xl:top-8 xl:self-start">
        <div className="space-y-4 rounded-lg border border-line bg-paper-raised p-4">
          <Field label="Status">
            <Select name="status" defaultValue={project?.status ?? "draft"}>
              <option value="draft">Draf</option>
              <option value="published">Terbit</option>
            </Select>
          </Field>
          <Checkbox name="featured" label="Tampilkan di beranda" defaultChecked={project?.featured} />
          <FormMessage error={state.error} ok={state.ok} />
          <SubmitButton className="w-full">{project ? "Simpan perubahan" : "Buat karya"}</SubmitButton>
          <p className="text-center text-xs text-muted">atau tekan Ctrl + S</p>
        </div>
        <MediaPicker name="coverId" label="Gambar sampul" defaultValue={project?.cover} />
        <Field label="Kategori">
          <Select name="categoryId" defaultValue={project?.categoryId ?? ""}>
            <option value="">Tanpa kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name.id}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Klien">
          <Input name="client" defaultValue={project?.client ?? ""} />
        </Field>
        <Field label="Tahun">
          <Input name="year" type="number" min={2000} max={2100} defaultValue={project?.year ?? ""} />
        </Field>
        <Field label="Teknologi" hint="Pisahkan dengan koma, contoh: Unity, Next.js, GPT">
          <Input name="techStack" defaultValue={project?.techStack.join(", ")} />
        </Field>
        <Field label="Tag" hint="Pisahkan dengan koma">
          <Input name="tags" defaultValue={project?.tags.join(", ")} />
        </Field>
        <Field label="Tautan" hint="Satu per baris: Label | https://…">
          <Textarea name="links" rows={3} defaultValue={linksToText(project?.links ?? [])} placeholder="Live site | https://example.com" />
        </Field>
        <Field label="Urutan" hint="Angka kecil tampil lebih dulu">
          <Input name="sortOrder" type="number" defaultValue={project?.sortOrder ?? 0} />
        </Field>
      </aside>
    </form>
  );
}
