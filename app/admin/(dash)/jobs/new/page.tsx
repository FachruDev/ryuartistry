import { saveJob } from "@/lib/actions/jobs";
import { PageHeader } from "@/components/admin/page-header";
import { JobForm } from "@/components/admin/forms/simple-forms";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Lowongan baru" };
export const instant = false;

export default async function NewJobPage() {
  await requireUser();
  return (
    <>
      <PageHeader title="Lowongan baru" back={{ href: "/admin/jobs", label: "Karier" }} />
      <JobForm action={saveJob.bind(null, null)} />
    </>
  );
}
