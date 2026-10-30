import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { deleteJob, saveJob } from "@/lib/actions/jobs";
import { PageHeader } from "@/components/admin/page-header";
import { DeleteButton } from "@/components/admin/delete-button";
import { JobForm } from "@/components/admin/forms/simple-forms";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Edit lowongan" };
export const instant = false;

export default async function EditJobPage({ params }: PageProps<"/admin/jobs/[id]">) {
  await requireUser();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [job] = await db.select().from(schema.jobs).where(eq(schema.jobs.id, id));
  if (!job) notFound();

  return (
    <>
      <PageHeader
        title={job.title.id || job.title.en}
        back={{ href: "/admin/jobs", label: "Karier" }}
        actions={<DeleteButton action={deleteJob.bind(null, job.id)} confirmText="Hapus lowongan ini?" />}
      />
      <JobForm action={saveJob.bind(null, job.id)} job={job} />
    </>
  );
}
