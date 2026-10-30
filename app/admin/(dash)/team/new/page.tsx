import { saveTeamMember } from "@/lib/actions/team";
import { PageHeader } from "@/components/admin/page-header";
import { TeamForm } from "@/components/admin/forms/simple-forms";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Anggota baru" };
export const instant = false;

export default async function NewTeamMemberPage() {
  await requireUser();
  return (
    <>
      <PageHeader title="Anggota baru" back={{ href: "/admin/team", label: "Tim" }} />
      <TeamForm action={saveTeamMember.bind(null, null)} />
    </>
  );
}
