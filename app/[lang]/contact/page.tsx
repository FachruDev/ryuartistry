import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale } from "@/lib/i18n";
import { getSettings } from "@/lib/queries";
import { alternates } from "@/lib/site";
import { ContactForm } from "@/components/site/contact-form";
import { PageIntro } from "@/components/site/page-intro";
import { PageTransition } from "@/components/site/page-transition";
import { Reveal } from "@/components/site/reveal";

export async function generateMetadata({ params }: PageProps<"/[lang]/contact">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  return { title: dict.nav.contact, description: dict.contact.intro, alternates: alternates(lang, "/contact") };
}

export default async function ContactPage({ params }: PageProps<"/[lang]/contact">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const settings = await getSettings();

  return (
    <PageTransition>
      <PageIntro title={dict.contact.title} intro={dict.contact.intro} />
      <section className="px-4 sm:px-8">
        <Reveal className="mx-auto max-w-[880px]">
          <div className="rounded-[2.5rem] bg-paper-raised p-5 ring-1 ring-line sm:p-10 md:rounded-[3.5rem] md:p-14">
            <ContactForm t={dict.contact} />
          </div>
        </Reveal>
        {(settings?.contactEmail || (settings && settings.socials.length > 0)) && (
          <Reveal delay={0.1} className="mx-auto mt-12 max-w-[880px] text-center">
            {settings?.contactEmail && (
              <p className="text-lg text-muted">
                {dict.contact.orEmail}{" "}
                <a href={`mailto:${settings.contactEmail}`} className="link-grow font-semibold text-ink">
                  {settings.contactEmail}
                </a>
              </p>
            )}
            {settings && settings.socials.length > 0 && (
              <ul className="mt-6 flex flex-wrap justify-center gap-2">
                {settings.socials.map((s) => (
                  <li key={s.url}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex rounded-full bg-paper-raised/70 px-4 py-2 text-sm font-semibold text-ink ring-1 ring-line transition-[transform,background-color] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-0.5 hover:bg-paper-raised"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Reveal>
        )}
      </section>
    </PageTransition>
  );
}
