import { asc, count, gt, max } from "drizzle-orm";
import { ShieldCheck } from "@phosphor-icons/react/ssr";
import { requireAdmin } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/admin/cards";
import { CreateUserForm, UserActions } from "@/components/admin/users";

export const metadata = { title: "Pengguna" };
export const instant = false;

const dateTime = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });

export default async function UsersPage() {
  const me = await requireAdmin();
  const [users, sessions] = await Promise.all([
    db.select().from(schema.user).orderBy(asc(schema.user.createdAt)),
    db
      .select({ userId: schema.session.userId, active: count(), lastSeen: max(schema.session.updatedAt) })
      .from(schema.session)
      .where(gt(schema.session.expiresAt, new Date()))
      .groupBy(schema.session.userId),
  ]);
  const byUser = new Map(sessions.map((s) => [s.userId, s]));
  const activeAdmins = users.filter((u) => u.role === "admin" && !u.disabledAt).length;

  return (
    <>
      <PageHeader title="Pengguna" description="Siapa saja yang bisa masuk ke CMS. Hanya admin yang melihat halaman ini." />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <Card title="Tambah pengguna" description="Password awal dibuat acak dan tampil sekali untuk Anda kirimkan.">
            <CreateUserForm />
          </Card>

          <Card title="Semua pengguna" description={`${users.filter((u) => !u.disabledAt).length} aktif dari ${users.length} akun.`}>
            <ul className="divide-y divide-line">
              {users.map((u) => {
                const s = byUser.get(u.id);
                const self = u.id === me.id;
                return (
                  <li key={u.id} className="space-y-3 py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`font-semibold ${u.disabledAt ? "text-muted line-through" : ""}`}>{u.name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${u.role === "admin" ? "bg-wisteria/60 text-on-pastel" : "bg-line text-muted"}`}>
                        {u.role === "admin" ? "Admin" : "Editor"}
                      </span>
                      {u.disabledAt && <span className="rounded-full bg-danger/15 px-2 py-0.5 text-xs font-semibold text-danger">Nonaktif</span>}
                      {self && <span className="rounded-full bg-mizu/60 px-2 py-0.5 text-xs font-semibold text-on-pastel">Anda</span>}
                    </div>
                    <p className="text-sm text-muted">
                      {u.email} · dibuat {dateTime.format(u.createdAt)} ·{" "}
                      {u.disabledAt
                        ? `dinonaktifkan ${dateTime.format(u.disabledAt)}`
                        : s
                          ? `${s.active} sesi aktif, terakhir ${dateTime.format(s.lastSeen!)}`
                          : "tidak ada sesi aktif"}
                    </p>
                    {self ? (
                      <p className="text-sm text-muted">Ubah nama dan password Anda sendiri di halaman Akun.</p>
                    ) : (
                      <UserActions
                        user={{ id: u.id, name: u.name, email: u.email, role: u.role, disabled: Boolean(u.disabledAt) }}
                        canDemote={activeAdmins > 1}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>

        <Card title="Aturan akses">
          <ul className="space-y-2.5 text-sm text-ink/80">
            {[
              "Admin: semua konten, pengguna, token Asisten AI, dan persetujuan connector Claude.",
              "Editor: semua konten, media, inbox, dan pengaturan situs.",
              "Menonaktifkan akun langsung memutus semua sesinya dan mencabut token AI yang ia buat.",
              "Reset password membuat password acak baru dan memutus semua sesi.",
              "Selalu ada minimal satu admin aktif; admin tidak bisa menurunkan atau menonaktifkan dirinya sendiri.",
              "Login dikunci 15 menit setelah 5 percobaan gagal per email, atau 20 per jaringan.",
            ].map((line) => (
              <li key={line} className="flex gap-2">
                <ShieldCheck size={16} weight="fill" className="mt-0.5 shrink-0 text-success" />
                {line}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
