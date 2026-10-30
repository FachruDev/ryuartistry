import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { deleteService, saveService } from "@/lib/actions/services";
import { PageHeader } from "@/components/admin/page-header";
import { DeleteButton } from "@/components/admin/delete-button";
import { ServiceForm } from "@/components/admin/forms/simple-forms";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Edit layanan" };
export const instant = false;

export default async function EditServicePage({ params }: PageProps<"/admin/services/[id]">) {
  await requireUser();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [service] = await db.select().from(schema.services).where(eq(schema.services.id, id));
  if (!service) notFound();

  return (
    <>
      <PageHeader
        title={service.title.id || service.title.en}
        back={{ href: "/admin/services", label: "Layanan" }}
        actions={<DeleteButton action={deleteService.bind(null, service.id)} confirmText="Hapus layanan ini?" />}
      />
      <ServiceForm action={saveService.bind(null, service.id)} service={service} />
    </>
  );
}
