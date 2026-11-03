import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, WarningCircle } from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/auth";
import { isKnownRedirect, redirectLabel, validateAuthorizeRequest } from "@/lib/ai/oauth";
import { approveAuthorization, denyAuthorization } from "@/lib/actions/oauth";
import { Field, Input, SubmitButton } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Izinkan akses" };
export const instant = false;

const grants = [
  "Membaca semua konten CMS, inbox, dan statistik trafik",
  "Membuat, mengubah, dan menerbitkan karya, catatan Lab, layanan, dan tim",
  "Mengunggah gambar dan mengubah pengaturan situs",
  "Menghapus konten, setelah Claude meminta izin Anda di percakapan",
];

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-ink-deep px-4 py-10">
      <div className="w-full max-w-md rounded-xl bg-paper p-8 ring-1 ring-line shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]">
        <p className="display text-3xl text-ink">ryuartistry</p>
        {children}
      </div>
    </main>
  );
}

export default async function AuthorizePage({ searchParams }: PageProps<"/admin/authorize">) {
  const user = await requireUser();
  const raw = await searchParams;
  const params = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));

  if (user.role !== "admin") {
    return (
      <Panel>
        <h1 className="mt-6 text-lg font-semibold">Hanya admin yang bisa memberi izin</h1>
        <p className="mt-2 text-sm text-muted">
          Anda masuk sebagai {user.email} (editor). Minta admin CMS untuk menghubungkan aplikasi ini.
        </p>
      </Panel>
    );
  }

  const result = await validateAuthorizeRequest(params);
  if (!("request" in result) || !result.request) {
    return (
      <Panel>
        <h1 className="mt-6 flex items-center gap-2 text-lg font-semibold">
          <WarningCircle size={20} weight="fill" className="text-danger" />
          Permintaan tidak bisa diproses
        </h1>
        <p className="mt-2 text-sm text-muted">{result.error}</p>
        <Link href="/admin/ai" className="mt-6 inline-block text-sm font-semibold underline">
          Kembali ke Asisten AI
        </Link>
      </Panel>
    );
  }

  const { client, redirectUri, codeChallenge, state } = result.request;
  const destination = redirectLabel(redirectUri);
  const known = isKnownRedirect(redirectUri);
  const hidden = {
    client_id: client.id,
    redirect_uri: redirectUri,
    response_type: "code",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
  };

  return (
    <Panel>
      <h1 className="mt-6 text-lg font-semibold">
        Izinkan <span className="text-ink">{client.name}</span> mengakses CMS?
      </h1>
      <p className="mt-1 text-sm text-muted">
        Masuk sebagai {user.name} ({user.email}).
      </p>

      <ul className="mt-5 space-y-2.5 text-sm text-ink/80">
        {grants.map((line) => (
          <li key={line} className="flex gap-2">
            <ShieldCheck size={16} weight="fill" className="mt-0.5 shrink-0 text-success" />
            {line}
          </li>
        ))}
      </ul>

      {known ? (
        <p className="mt-5 flex gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-xs text-text">
          <ShieldCheck size={16} weight="fill" className="shrink-0 text-success" />
          <span>
            Akses dikirim ke <code>{destination}</code>, alamat resmi aplikasi Claude. Bisa dicabut kapan saja di CMS → Asisten AI.
          </span>
        </p>
      ) : (
        <div role="alert" className="mt-5 space-y-1.5 rounded-md border border-danger/40 bg-danger/10 px-3 py-2.5 text-sm text-text">
          <p className="flex items-center gap-2 font-semibold text-danger">
            <WarningCircle size={18} weight="fill" /> Alamat tujuan tidak dikenal
          </p>
          <p>
            Token CMS akan dikirim ke <code className="font-semibold">{destination}</code>, bukan ke Claude. Nama aplikasi di atas ditulis sendiri oleh pendaftar dan bisa dipalsukan.
            Lanjutkan hanya jika Anda sendiri yang memulai koneksi ini.
          </p>
        </div>
      )}

      <form className="mt-6 space-y-4">
        {Object.entries(hidden).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        {!known && (
          <Field label={`Ketik ${destination} untuk melanjutkan`} error={params.confirm ? "Ketik alamat tujuan persis seperti di atas." : undefined}>
            <Input name="acknowledge" autoComplete="off" spellCheck={false} />
          </Field>
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <SubmitButton formAction={denyAuthorization} variant="ghost" pendingLabel="Membatalkan…">
          Tolak
        </SubmitButton>
        <SubmitButton formAction={approveAuthorization} pendingLabel="Menghubungkan…">
          Izinkan akses
        </SubmitButton>
        </div>
      </form>
    </Panel>
  );
}
