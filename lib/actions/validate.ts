import type { Localized } from "@/lib/db/schema";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type Errors = Record<string, string>;

/** Shared checks for slug + bilingual title; returns field errors or null. */
export function checkBasics({ slug, title }: { slug?: string; title?: Localized }): Errors | null {
  const errors: Errors = {};
  if (slug !== undefined && !SLUG.test(slug)) {
    errors.slug = "Gunakan huruf kecil, angka, dan tanda hubung (contoh: proyek-baru).";
  }
  if (title && !title.id && !title.en) {
    errors.title = "Isi judul minimal dalam satu bahasa.";
  }
  return Object.keys(errors).length ? errors : null;
}
