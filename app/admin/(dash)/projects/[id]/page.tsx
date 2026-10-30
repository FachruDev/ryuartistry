import { notFound } from "next/navigation";
import { asc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { deleteProject, saveProject } from "@/lib/actions/projects";
import { PageHeader } from "@/components/admin/page-header";
import { DeleteButton } from "@/components/admin/delete-button";
import { ProjectForm } from "@/components/admin/forms/project-form";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Edit karya" };
export const instant = false;

export default async function EditProjectPage({ params }: PageProps<"/admin/projects/[id]">) {
  await requireUser();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const project = await db.query.projects.findFirst({
    where: eq(schema.projects.id, id),
    with: { cover: true },
  });
  if (!project) notFound();

  const [categories, galleryRows] = await Promise.all([
    db.select().from(schema.categories).where(eq(schema.categories.kind, "project")).orderBy(asc(schema.categories.sortOrder)),
    project.gallery.length
      ? db.select().from(schema.media).where(inArray(schema.media.id, project.gallery))
      : Promise.resolve([]),
  ]);
  const gallery = project.gallery.map((gid) => galleryRows.find((m) => m.id === gid)).filter((m) => m !== undefined);

  return (
    <>
      <PageHeader
        title={project.title.id || project.title.en}
        back={{ href: "/admin/projects", label: "Karya" }}
        actions={
          <>
            {project.status === "published" && (
              <a href={`/id/work/${project.slug}`} target="_blank" className="text-sm text-muted underline-offset-4 hover:underline">
                Lihat di situs
              </a>
            )}
            <DeleteButton action={deleteProject.bind(null, project.id)} confirmText="Hapus karya ini secara permanen?" />
          </>
        }
      />
      <ProjectForm
        action={saveProject.bind(null, project.id)}
        project={project}
        gallery={gallery}
        categories={categories}
      />
    </>
  );
}
