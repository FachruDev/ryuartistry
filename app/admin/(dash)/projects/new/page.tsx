import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { saveProject } from "@/lib/actions/projects";
import { PageHeader } from "@/components/admin/page-header";
import { ProjectForm } from "@/components/admin/forms/project-form";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Karya baru" };
export const instant = false;

export default async function NewProjectPage() {
  await requireUser();
  const categories = await db
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.kind, "project"))
    .orderBy(asc(schema.categories.sortOrder));

  return (
    <>
      <PageHeader title="Karya baru" back={{ href: "/admin/projects", label: "Karya" }} />
      <ProjectForm action={saveProject.bind(null, null)} categories={categories} />
    </>
  );
}
