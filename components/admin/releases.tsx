"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CloudArrowUp, Trash } from "@phosphor-icons/react";
import type { Release } from "@/lib/db/schema";
import type { FormState } from "@/lib/forms";
import { deleteBuild, finishBuildUpload, startBuildUpload } from "@/lib/actions/releases";
import { MAX_BUILD_BYTES, PLATFORMS, extensionOk, formatBytes, platformInfo, type Platform } from "@/lib/release-platforms";
import { LocalizedField } from "./localized-field";
import { Field, FormMessage, Input, Select, SubmitButton, buttonClass } from "./ui";

type Action = (prev: FormState, form: FormData) => Promise<FormState>;

const toDateInput = (date: Date) => new Date(date.getTime() + 7 * 3600_000).toISOString().slice(0, 10);

export function ReleaseForm({ action, release }: { action: Action; release?: Release }) {
  const [state, formAction] = useActionState(action, {});
  const errors = state.fieldErrors ?? {};
  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Versi" error={errors.version} hint="Contoh 2.0.1">
          <Input name="version" defaultValue={release?.version} required placeholder="1.0.0" />
        </Field>
        <Field label="Tanggal rilis">
          <Input name="releasedAt" type="date" defaultValue={toDateInput(release?.releasedAt ?? new Date())} />
        </Field>
        <Field label="Status" hint="Draf tidak tampil di situs">
          <Select name="status" defaultValue={release?.status ?? "draft"}>
            <option value="draft">Draf</option>
            <option value="published">Terbit</option>
          </Select>
        </Field>
      </div>
      <LocalizedField
        name="changelog"
        label="Catatan perubahan"
        hint="Satu perubahan per baris. Tampil sebagai daftar di halaman karya."
        multiline
        rows={5}
        defaultValue={release?.changelog}
      />
      <FormMessage error={state.error} ok={state.ok} />
      <SubmitButton>{release ? "Simpan rilis" : "Buat rilis"}</SubmitButton>
    </form>
  );
}

/** PUT with progress; fetch has no upload progress yet. */
function putWithProgress(url: string, file: File, contentType: string, onProgress: (ratio: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`)));
    xhr.onerror = () => reject(new Error("koneksi terputus atau diblokir (CORS)"));
    xhr.send(file);
  });
}

/** Sends a build straight to storage, then records it. Replaces the existing build for that platform. */
export function BuildUploader({ releaseId, taken }: { releaseId: string; taken: Platform[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [platform, setPlatform] = useState<Platform>(PLATFORMS.find((p) => !taken.includes(p)) ?? "android");
  const [progress, setProgress] = useState<number | null>(null);
  const [phase, setPhase] = useState("");
  const [message, setMessage] = useState<{ error?: string; ok?: string }>({});

  async function upload(file: File) {
    setMessage({});
    if (!extensionOk(platform, file.name)) {
      setMessage({ error: `File ${platformInfo[platform].label} harus berakhiran ${platformInfo[platform].extensions.join(", ")}.` });
      return;
    }
    if (file.size > MAX_BUILD_BYTES) {
      setMessage({ error: `File terlalu besar (${formatBytes(file.size)}). Maksimal ${formatBytes(MAX_BUILD_BYTES)}.` });
      return;
    }
    if (taken.includes(platform) && !window.confirm(`Ganti file ${platformInfo[platform].label} yang sudah ada di rilis ini?`)) return;

    try {
      setPhase("Menyiapkan…");
      setProgress(0);
      const ticket = await startBuildUpload(releaseId, platform, file.name, file.size);
      if ("error" in ticket) throw new Error(ticket.error);
      setPhase("Mengunggah");
      await putWithProgress(ticket.uploadUrl, file, ticket.contentType, setProgress);
      setPhase("Memeriksa file…");
      const done = await finishBuildUpload(ticket.uploadId);
      if ("error" in done) throw new Error(done.error);
      setMessage({
        ok: done.archived.length
          ? `Terunggah. File ${platformInfo[platform].label} versi ${done.archived.join(", ")} diarsipkan (catatannya tetap ada).`
          : "Terunggah.",
      });
      router.refresh();
    } catch (error) {
      setMessage({ error: `Gagal mengunggah: ${error instanceof Error ? error.message : String(error)}` });
    } finally {
      setProgress(null);
      setPhase("");
      if (input.current) input.current.value = "";
    }
  }

  const busy = progress !== null;
  return (
    <div className="space-y-3 rounded-xl border border-dashed border-line bg-paper p-4">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Platform" className="w-40">
          <Select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)} disabled={busy}>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {platformInfo[p].label}
                {taken.includes(p) ? " (ganti)" : ""}
              </option>
            ))}
          </Select>
        </Field>
        <input
          ref={input}
          type="file"
          accept={platformInfo[platform].accept}
          className="sr-only"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
        <button type="button" className={buttonClass("ghost")} disabled={busy} onClick={() => input.current?.click()}>
          <CloudArrowUp size={18} />
          Pilih file {platformInfo[platform].extensions.join(" / ")}
        </button>
        <span className="text-xs text-muted">Maks {formatBytes(MAX_BUILD_BYTES)}</span>
      </div>
      {busy && (
        <div aria-live="polite">
          <div className="flex justify-between text-xs font-semibold text-muted">
            <span>{phase}</span>
            {phase === "Mengunggah" && <span className="tabular-nums">{Math.round(progress * 100)}%</span>}
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-glow transition-[width] duration-300" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      )}
      <FormMessage error={message.error} />
      {message.ok && <p className="text-sm font-medium text-success">{message.ok}</p>}
    </div>
  );
}

export function DeleteBuildButton({ fileId, label }: { fileId: string; label: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      title={`Hapus file ${label}`}
      aria-label={`Hapus file ${label}`}
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`Hapus file ${label} dari rilis ini? Catatan versinya tetap ada.`)) return;
        start(async () => {
          await deleteBuild(fileId);
          router.refresh();
        });
      }}
      className="grid size-8 place-items-center rounded-md text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
    >
      <Trash size={16} />
    </button>
  );
}
