import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { deletePost, savePost } from "@/lib/actions/posts";
import { PageHeader } from "@/components/admin/page-header";
import { DeleteButton } from "@/components/admin/delete-button";
import { PostForm } from "@/components/admin/forms/post-form";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Edit catatan" };
export const instant = false;

export default async function EditPostPage({ params }: PageProps<"/admin/posts/[id]">) {
  await requireUser();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const [post, categories] = await Promise.all([
    db.query.posts.findFirst({ where: eq(schema.posts.id, id), with: { cover: true } }),
    db.select().from(schema.categories).where(eq(schema.categories.kind, "post")).orderBy(asc(schema.categories.sortOrder)),
  ]);
  if (!post) notFound();

  return (
    <>
      <PageHeader
        title={post.title.id || post.title.en}
        back={{ href: "/admin/posts", label: "Lab" }}
        actions={
          <>
            {post.status === "published" && (
              <a href={`/id/lab/${post.slug}`} target="_blank" className="text-sm text-muted underline-offset-4 hover:underline">
                Lihat di situs
              </a>
            )}
            <DeleteButton action={deletePost.bind(null, post.id)} confirmText="Hapus catatan ini secara permanen?" />
          </>
        }
      />
      <PostForm action={savePost.bind(null, post.id)} post={post} categories={categories} />
    </>
  );
}
