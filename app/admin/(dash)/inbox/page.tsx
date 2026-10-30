import Link from "next/link";
import { desc, eq, ne } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { deleteInquiry, setInquiryStatus } from "@/lib/actions/inquiries";
import { EmptyState, PageHeader } from "@/components/admin/page-header";
import { DeleteButton } from "@/components/admin/delete-button";
import { SubmitButton } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Inbox" };
export const instant = false;

const typeLabel = { project: "Proyek baru", collab: "Kolaborasi", career: "Karier", other: "Lainnya" } as const;

export default async function InboxPage({ searchParams }: PageProps<"/admin/inbox">) {
  await requireUser();
  const { view } = await searchParams;
  const archived = view === "archived";
  const rows = await db
    .select()
    .from(schema.inquiries)
    .where(archived ? eq(schema.inquiries.status, "archived") : ne(schema.inquiries.status, "archived"))
    .orderBy(desc(schema.inquiries.createdAt));

  const fmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });

  return (
    <>
      <PageHeader title="Inbox" description="Pesan dari form kontak di situs." />
      <div className="mb-4 flex gap-2 text-sm">
        <Link
          href="/admin/inbox"
          aria-current={!archived ? "page" : undefined}
          className={`rounded-md px-3 py-1.5 font-semibold ${!archived ? "bg-ink text-paper" : "text-muted hover:text-text"}`}
        >
          Masuk
        </Link>
        <Link
          href="/admin/inbox?view=archived"
          aria-current={archived ? "page" : undefined}
          className={`rounded-md px-3 py-1.5 font-semibold ${archived ? "bg-ink text-paper" : "text-muted hover:text-text"}`}
        >
          Arsip
        </Link>
      </div>
      {rows.length === 0 ? (
        <EmptyState>{archived ? "Arsip kosong." : "Belum ada pesan masuk."}</EmptyState>
      ) : (
        <ul className="space-y-3">
          {rows.map((m) => (
            <li key={m.id} className="rounded-lg border border-line bg-paper-raised">
              <details open={m.status === "new"}>
                <summary className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
                  {m.status === "new" && <span className="size-2 rounded-full bg-scale" aria-label="Belum dibaca" />}
                  <span className="font-semibold">{m.name}</span>
                  <span className="text-sm text-muted">{m.email}</span>
                  <span className="rounded-full bg-line px-2 py-0.5 text-xs font-semibold text-muted">{typeLabel[m.type]}</span>
                  <span className="ml-auto text-sm text-muted">{fmt.format(m.createdAt)}</span>
                </summary>
                <div className="space-y-4 border-t border-line px-4 py-4">
                  {m.company && <p className="text-sm text-muted">Perusahaan: {m.company}</p>}
                  <p className="whitespace-pre-wrap leading-relaxed">{m.message}</p>
                  <div className="flex flex-wrap gap-2">
                    <a href={`mailto:${m.email}`} className="inline-flex items-center rounded-md bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-ink-deep">
                      Balas via email
                    </a>
                    {m.status === "new" && (
                      <form action={setInquiryStatus.bind(null, m.id, "read")}>
                        <SubmitButton variant="ghost" pendingLabel="…">Tandai dibaca</SubmitButton>
                      </form>
                    )}
                    <form action={setInquiryStatus.bind(null, m.id, archived ? "read" : "archived")}>
                      <SubmitButton variant="ghost" pendingLabel="…">{archived ? "Kembalikan" : "Arsipkan"}</SubmitButton>
                    </form>
                    <DeleteButton action={deleteInquiry.bind(null, m.id)} confirmText="Hapus pesan ini secara permanen?" />
                  </div>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
