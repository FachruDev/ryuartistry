import Link from "next/link";
import { Suspense } from "react";
import { count, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { signOut } from "@/lib/actions/auth";
import { AdminNav } from "@/components/admin/nav";

// Session-gated chrome; pages stream inside the boundary below and check the session themselves.
export const instant = false;

export default async function DashboardLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireUser();
  const [{ value: unread }] = await db
    .select({ value: count() })
    .from(schema.inquiries)
    .where(eq(schema.inquiries.status, "new"));

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="flex flex-col bg-ink text-paper lg:sticky lg:top-0 lg:h-screen">
        <div className="flex items-center justify-between px-5 py-5 lg:block">
          <Link href="/admin" className="display text-2xl text-paper">
            ryuartistry
          </Link>
          <p className="hidden text-xs text-paper/60 lg:mt-1 lg:block">Content studio</p>
        </div>
        <AdminNav unread={unread} />
        <div className="flex items-center justify-between gap-4 border-t border-paper/10 px-5 py-3 text-sm lg:mt-auto lg:block lg:py-4">
          <div className="min-w-0">
            <p className="truncate font-semibold">{user.name}</p>
            <p className="hidden truncate text-paper/60 lg:block">{user.email}</p>
          </div>
          <div className="flex shrink-0 gap-3 lg:mt-3">
            <a href="/" target="_blank" className="text-paper/80 underline-offset-4 hover:underline">
              Lihat situs
            </a>
            <form action={signOut}>
              <button className="text-paper/80 underline-offset-4 hover:underline">Keluar</button>
            </form>
          </div>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-8 sm:px-8 lg:px-12">
        <Suspense fallback={<p className="text-muted">Memuat…</p>}>{children}</Suspense>
      </main>
    </div>
  );
}
