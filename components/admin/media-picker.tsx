"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { Media } from "@/lib/db/schema";
import { listMedia } from "@/lib/actions/media";
import { buttonClass } from "./ui";

/** Uploads one image through the admin media route, measuring it first so layouts can reserve space. */
export async function uploadImage(file: File): Promise<Media> {
  const body = new FormData();
  body.set("file", file);
  try {
    const bitmap = await createImageBitmap(file);
    body.set("width", String(bitmap.width));
    body.set("height", String(bitmap.height));
    bitmap.close();
  } catch {
    // Dimensions are optional; the upload still works without them.
  }
  const res = await fetch("/api/admin/media", { method: "POST", body });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Upload gagal.");
  return data as Media;
}

export function UploadButton({ onUploaded, label = "Unggah gambar" }: { onUploaded: (m: Media[]) => void; label?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onChange = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    const uploaded: Media[] = [];
    for (const file of Array.from(files)) {
      try {
        uploaded.push(await uploadImage(file));
      } catch (e) {
        setError(`${file.name}: ${(e as Error).message}`);
      }
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
    if (uploaded.length) onUploaded(uploaded);
  };

  return (
    <div className="flex items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        multiple
        hidden
        onChange={(e) => onChange(e.target.files)}
      />
      <button type="button" className={buttonClass("ghost")} disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? "Mengunggah…" : label}
      </button>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}

export function MediaLibraryDialog({
  multiple = false,
  onSelect,
  onClose,
}: {
  multiple?: boolean;
  onSelect: (items: Media[]) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [items, setItems] = useState<Media[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [, startTransition] = useTransition();

  useEffect(() => {
    dialogRef.current?.showModal();
    startTransition(async () => setItems(await listMedia()));
  }, []);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : multiple ? [...s, id] : [id]));

  const confirm = () => onSelect(selected.map((id) => items!.find((m) => m.id === id)!).filter(Boolean));

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="m-auto w-[min(960px,calc(100vw-2rem))] rounded-xl bg-paper p-0 text-text backdrop:bg-ink-deep/70"
    >
      <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
        <h2 className="text-lg font-semibold">Pustaka media</h2>
        <UploadButton
          onUploaded={(m) => {
            setItems((prev) => [...m, ...(prev ?? [])]);
            setSelected((s) => (multiple ? [...s, ...m.map((x) => x.id)] : [m[0].id]));
          }}
        />
      </div>
      <div className="max-h-[60vh] overflow-y-auto p-5">
        {items === null ? (
          <p className="text-sm text-muted">Memuat media…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted">Belum ada media. Unggah gambar pertama Anda.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {items.map((m) => {
              const isSelected = selected.includes(m.id);
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => toggle(m.id)}
                    aria-pressed={isSelected}
                    className={`block aspect-square w-full overflow-hidden rounded-md border-2 bg-line/40 ${
                      isSelected ? "border-glow ring-2 ring-glow/40" : "border-transparent"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnails */}
                    <img src={m.url} alt={m.alt.id || m.alt.en || ""} className="size-full object-cover" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="flex justify-end gap-2 border-t border-line px-5 py-4">
        <button type="button" className={buttonClass("ghost")} onClick={() => dialogRef.current?.close()}>
          Batal
        </button>
        <button type="button" className={buttonClass()} disabled={!selected.length} onClick={confirm}>
          {multiple ? `Pilih ${selected.length || ""} gambar` : "Pilih gambar"}
        </button>
      </div>
    </dialog>
  );
}

export function MediaPicker({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: Media | null;
}) {
  const [value, setValue] = useState<Media | null>(defaultValue ?? null);
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-1.5">
      <span className="block text-sm font-semibold">{label}</span>
      <input type="hidden" name={name} value={value?.id ?? ""} />
      <div className="flex items-center gap-4">
        <div className="grid aspect-[4/3] w-40 place-items-center overflow-hidden rounded-md border border-dashed border-line bg-paper-raised">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin preview
            <img src={value.url} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-xs text-muted">Belum ada gambar</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button type="button" className={buttonClass("ghost")} onClick={() => setOpen(true)}>
            {value ? "Ganti gambar" : "Pilih gambar"}
          </button>
          {value && (
            <button type="button" className="text-left text-sm text-danger hover:underline" onClick={() => setValue(null)}>
              Lepas gambar
            </button>
          )}
        </div>
      </div>
      {open && (
        <MediaLibraryDialog
          onClose={() => setOpen(false)}
          onSelect={(items) => {
            setValue(items[0] ?? null);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

export function GalleryPicker({ name, label, defaultValue = [] }: { name: string; label: string; defaultValue?: Media[] }) {
  const [items, setItems] = useState<Media[]>(defaultValue);
  const [open, setOpen] = useState(false);

  const move = (index: number, delta: number) =>
    setItems((list) => {
      const next = [...list];
      const target = index + delta;
      if (target < 0 || target >= next.length) return list;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  return (
    <div className="space-y-1.5">
      <span className="block text-sm font-semibold">{label}</span>
      <input type="hidden" name={name} value={JSON.stringify(items.map((m) => m.id))} />
      {items.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {items.map((m, i) => (
            <li key={m.id} className="overflow-hidden rounded-md border border-line bg-paper-raised">
              {/* eslint-disable-next-line @next/next/no-img-element -- admin preview */}
              <img src={m.url} alt="" className="aspect-[4/3] w-full object-cover" />
              <div className="flex justify-between px-2 py-1 text-xs">
                <span className="flex gap-2">
                  <button type="button" onClick={() => move(i, -1)} aria-label="Geser ke kiri" className="hover:text-glow">
                    ←
                  </button>
                  <button type="button" onClick={() => move(i, 1)} aria-label="Geser ke kanan" className="hover:text-glow">
                    →
                  </button>
                </span>
                <button type="button" className="text-danger hover:underline" onClick={() => setItems((l) => l.filter((x) => x.id !== m.id))}>
                  Hapus
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <button type="button" className={buttonClass("ghost")} onClick={() => setOpen(true)}>
        Tambah gambar
      </button>
      {open && (
        <MediaLibraryDialog
          multiple
          onClose={() => setOpen(false)}
          onSelect={(picked) => {
            setItems((list) => [...list, ...picked.filter((p) => !list.some((x) => x.id === p.id))]);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}
