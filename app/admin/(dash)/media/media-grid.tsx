"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Media } from "@/lib/db/schema";
import { deleteMedia, updateMediaAlt } from "@/lib/actions/media";
import { UploadButton } from "@/components/admin/media-picker";
import { EmptyState } from "@/components/admin/page-header";
import { buttonClass, inputClass } from "@/components/admin/ui";

export function MediaGrid({ items }: { items: Media[] }) {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <UploadButton onUploaded={() => router.refresh()} />
      {items.length === 0 ? (
        <EmptyState>Belum ada media. Unggah gambar untuk dipakai di karya, Lab, dan profil tim.</EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {items.map((m) => (
            <MediaCard key={m.id} media={m} />
          ))}
        </ul>
      )}
    </div>
  );
}

function MediaCard({ media }: { media: Media }) {
  const [alt, setAlt] = useState(media.alt);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const dirty = alt.id !== media.alt.id || alt.en !== media.alt.en;

  return (
    <li className="overflow-hidden rounded-lg border border-line bg-paper-raised">
      {/* eslint-disable-next-line @next/next/no-img-element -- admin preview */}
      <img src={media.url} alt={alt.id || alt.en || ""} className="aspect-[4/3] w-full bg-line object-cover" />
      <div className="space-y-2 p-3">
        <p className="truncate text-xs text-muted" title={media.key}>
          {media.width && media.height ? `${media.width}×${media.height}, ` : ""}
          {Math.round(media.size / 1024)} KB
        </p>
        <input
          className={inputClass}
          placeholder="Teks alternatif (ID)"
          aria-label="Teks alternatif bahasa Indonesia"
          value={alt.id}
          onChange={(e) => {
            setSaved(false);
            setAlt({ ...alt, id: e.target.value });
          }}
        />
        <input
          className={inputClass}
          placeholder="Alt text (EN)"
          aria-label="Alt text in English"
          value={alt.en}
          onChange={(e) => {
            setSaved(false);
            setAlt({ ...alt, en: e.target.value });
          }}
        />
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            className={buttonClass("ghost")}
            disabled={!dirty || pending}
            onClick={() =>
              startTransition(async () => {
                await updateMediaAlt(media.id, alt);
                setSaved(true);
              })
            }
          >
            {pending ? "Menyimpan…" : saved && !dirty ? "Tersimpan" : "Simpan alt"}
          </button>
          <button
            type="button"
            className="text-sm text-danger hover:underline"
            disabled={pending}
            onClick={() => {
              if (window.confirm("Hapus gambar ini? Gambar akan hilang dari semua konten yang memakainya.")) {
                startTransition(() => deleteMedia(media.id));
              }
            }}
          >
            Hapus
          </button>
        </div>
      </div>
    </li>
  );
}
