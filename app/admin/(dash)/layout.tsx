import { Suspense } from "react";
import { count, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { signOut } from "@/lib/actions/auth";
import { AdminShell } from "@/components/admin/shell";

// Session-gated chrome; pages stream inside the boundary below and check the session themselves.
export const instant = false;

export default async function DashboardLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireUser();
  const [{ value: unread }] = await db
    .select({ value: count() })
    .from(schema.inquiries)
    .where(eq(schema.inquiries.status, "new"));

  return (
    <AdminShell user={{ name: user.name, email: user.email, role: user.role }} unread={unread} signOut={signOut}>
      <Suspense
        fallback={
          <div className="space-y-4" aria-label="Memuat">
            <div className="skeleton h-9 w-56 rounded-lg" />
            <div className="skeleton h-40 rounded-2xl" />
          </div>
        }
      >
        {children}
      </Suspense>
    </AdminShell>
  );
}
