import { saveService } from "@/lib/actions/services";
import { PageHeader } from "@/components/admin/page-header";
import { ServiceForm } from "@/components/admin/forms/simple-forms";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Layanan baru" };
export const instant = false;

export default async function NewServicePage() {
  await requireUser();
  return (
    <>
      <PageHeader title="Layanan baru" back={{ href: "/admin/services", label: "Layanan" }} />
      <ServiceForm action={saveService.bind(null, null)} />
    </>
  );
}
