import { desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { MediaGrid } from "./media-grid";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Media" };
export const instant = false;

export default async function MediaPage() {
  await requireUser();
  const items = await db.select().from(schema.media).orderBy(desc(schema.media.createdAt));
  return (
    <>
      <PageHeader title="Media" description="Semua gambar yang dipakai di situs. Isi teks alternatif agar gambar mudah diakses." />
      <MediaGrid items={items} />
    </>
  );
}
