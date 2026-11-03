import { desc, eq, gt, and } from "drizzle-orm";
import { userAgent } from "next/server";
import { requireUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { signOutOtherSessions } from "@/lib/actions/account";
import { PageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/admin/cards";
import { PasswordForm, ProfileForm } from "@/components/admin/account-forms";
import { SubmitButton } from "@/components/admin/ui";

export const metadata = { title: "Akun" };
export const instant = false;

const dateTime = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });

function deviceLabel(ua: string | null) {
  if (!ua) return "Perangkat tidak dikenal";
  const parsed = userAgent({ headers: new Headers({ "user-agent": ua }) });
  return [parsed.browser.name, parsed.os.name].filter(Boolean).join(" di ") || "Perangkat tidak dikenal";
}

export default async function AccountPage() {
  const user = await requireUser();
  const sessions = await db
    .select()
    .from(schema.session)
    .where(and(eq(schema.session.userId, user.id), gt(schema.session.expiresAt, new Date())))
    .orderBy(desc(schema.session.updatedAt));

  return (
    <>
      <PageHeader title="Akun" description={`Masuk sebagai ${user.email} (${user.role === "admin" ? "Admin" : "Editor"}).`} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Profil">
          <ProfileForm name={user.name} email={user.email} />
        </Card>
        <Card title="Password" description="Mengganti password juga mengeluarkan semua perangkat lain.">
          <PasswordForm email={user.email} />
        </Card>
        <Card
          title="Sesi aktif"
          description={`${sessions.length} perangkat sedang masuk dengan akun ini.`}
          className="lg:col-span-2"
          action={
            sessions.length > 1 ? (
              <form action={signOutOtherSessions}>
                <SubmitButton variant="ghost" pendingLabel="Mengeluarkan…">
                  Keluar dari perangkat lain
                </SubmitButton>
              </form>
            ) : undefined
          }
        >
          <ul className="divide-y divide-line">
            {sessions.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="font-semibold">
                    {deviceLabel(s.userAgent)}
                    {s.id === user.sessionId && <span className="ml-2 rounded-full bg-mizu/60 px-2 py-0.5 text-xs font-semibold text-on-pastel">Perangkat ini</span>}
                  </p>
                  <p className="text-sm text-muted">
                    Masuk {dateTime.format(s.createdAt)} · aktif terakhir {dateTime.format(s.updatedAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
