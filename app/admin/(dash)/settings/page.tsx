import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { saveSettings } from "@/lib/actions/settings";
import { PageHeader } from "@/components/admin/page-header";
import { SettingsForm } from "@/components/admin/forms/simple-forms";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Pengaturan" };
export const instant = false;

export default async function SettingsPage() {
  await requireUser();
  const [settings] = await db.select().from(schema.siteSettings).where(eq(schema.siteSettings.id, 1));
  return (
    <>
      <PageHeader title="Pengaturan situs" description="Teks hero, tagline, dan tautan sosial." />
      <SettingsForm action={saveSettings} settings={settings} />
    </>
  );
}
