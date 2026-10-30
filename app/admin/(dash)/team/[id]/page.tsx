import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { deleteTeamMember, saveTeamMember } from "@/lib/actions/team";
import { PageHeader } from "@/components/admin/page-header";
import { DeleteButton } from "@/components/admin/delete-button";
import { TeamForm } from "@/components/admin/forms/simple-forms";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Edit anggota" };
export const instant = false;

export default async function EditTeamMemberPage({ params }: PageProps<"/admin/team/[id]">) {
  await requireUser();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const member = await db.query.teamMembers.findFirst({
    where: eq(schema.teamMembers.id, id),
    with: { photo: true },
  });
  if (!member) notFound();

  return (
    <>
      <PageHeader
        title={member.name}
        back={{ href: "/admin/team", label: "Tim" }}
        actions={<DeleteButton action={deleteTeamMember.bind(null, member.id)} confirmText="Hapus anggota ini dari tim?" />}
      />
      <TeamForm action={saveTeamMember.bind(null, member.id)} member={member} />
    </>
  );
}
