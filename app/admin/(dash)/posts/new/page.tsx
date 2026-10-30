import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { savePost } from "@/lib/actions/posts";
import { PageHeader } from "@/components/admin/page-header";
import { PostForm } from "@/components/admin/forms/post-form";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Catatan baru" };
export const instant = false;

export default async function NewPostPage() {
  await requireUser();
  const categories = await db
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.kind, "post"))
    .orderBy(asc(schema.categories.sortOrder));

  return (
    <>
      <PageHeader title="Catatan baru" back={{ href: "/admin/posts", label: "Lab" }} />
      <PostForm action={savePost.bind(null, null)} categories={categories} />
    </>
  );
}
