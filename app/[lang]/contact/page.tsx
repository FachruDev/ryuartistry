import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale } from "@/lib/i18n";
import { getSettings } from "@/lib/queries";
import { alternates } from "@/lib/site";
import { PageIntro } from "@/components/site/page-intro";
import { ContactForm } from "@/components/site/contact-form";

export async function generateMetadata({ params }: PageProps<"/[lang]/contact">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  return { title: dict.contact.title, description: dict.contact.intro, alternates: alternates(lang, "/contact") };
}

export default async function ContactPage({ params }: PageProps<"/[lang]/contact">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const settings = await getSettings();

  return (
    <>
      <PageIntro title={dict.contact.title} intro={dict.contact.intro} />
      <section className="mx-auto grid max-w-[1440px] gap-16 px-4 py-20 sm:px-8 md:py-28 lg:grid-cols-[1fr_320px]">
        <ContactForm t={dict.contact} />
        <aside className="space-y-8 lg:pt-6">
          {settings?.contactEmail && (
            <div>
              <p className="text-sm font-semibold text-muted">Email</p>
              <a href={`mailto:${settings.contactEmail}`} className="mt-1 block text-xl font-semibold text-ink underline decoration-scale decoration-2 underline-offset-4">
                {settings.contactEmail}
              </a>
            </div>
          )}
          {settings && settings.socials.length > 0 && (
            <ul className="space-y-2">
              {settings.socials.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-lg text-ink hover:text-glow">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </section>
    </>
  );
}
