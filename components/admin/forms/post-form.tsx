"use client";

import { useActionState } from "react";
import type { Category, Media, Post } from "@/lib/db/schema";
import type { FormState } from "@/lib/forms";
import { LocalizedField } from "../localized-field";
import { LocalizedRichText } from "../rich-text";
import { MediaPicker } from "../media-picker";
import { Field, FormMessage, Input, Select, SubmitButton } from "../ui";

type Props = {
  action: (prev: FormState, form: FormData) => Promise<FormState>;
  post?: Post & { cover: Media | null };
  categories: Category[];
};

export function PostForm({ action, post, categories }: Props) {
  const [state, formAction] = useActionState(action, {});
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="grid gap-8 xl:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <LocalizedField name="title" label="Judul" defaultValue={post?.title} error={errors.title} />
        <Field label="Slug" hint="Bagian URL. Kosongkan untuk dibuat otomatis dari judul." error={errors.slug}>
          <Input name="slug" defaultValue={post?.slug} placeholder="judul-catatan" />
        </Field>
        <LocalizedField name="excerpt" label="Cuplikan" multiline defaultValue={post?.excerpt} hint="Ditampilkan di daftar Lab dan pratinjau tautan." />
        <LocalizedRichText name="body" label="Isi" defaultValue={post?.body} />
      </div>

      <aside className="space-y-5 xl:sticky xl:top-8 xl:self-start">
        <div className="space-y-4 rounded-lg border border-line bg-paper-raised p-4">
          <Field label="Status">
            <Select name="status" defaultValue={post?.status ?? "draft"}>
              <option value="draft">Draf</option>
              <option value="published">Terbit</option>
            </Select>
          </Field>
          <FormMessage error={state.error} ok={state.ok} />
          <SubmitButton className="w-full">{post ? "Simpan perubahan" : "Buat catatan"}</SubmitButton>
        </div>
        <MediaPicker name="coverId" label="Gambar sampul" defaultValue={post?.cover} />
        <Field label="Kategori">
          <Select name="categoryId" defaultValue={post?.categoryId ?? ""}>
            <option value="">Tanpa kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name.id}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tag" hint="Pisahkan dengan koma">
          <Input name="tags" defaultValue={post?.tags.join(", ")} />
        </Field>
      </aside>
    </form>
  );
}
