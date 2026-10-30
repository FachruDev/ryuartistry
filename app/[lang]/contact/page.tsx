import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale } from "@/lib/i18n";
import { getSettings } from "@/lib/queries";
import { alternates } from "@/lib/site";
import { ContactForm } from "@/components/site/contact-form";
import { PageTransition } from "@/components/site/page-transition";
import { Eyebrow } from "@/components/site/pill";
import { Reveal } from "@/components/site/reveal";

export async function generateMetadata({ params }: PageProps<"/[lang]/contact">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  return { title: dict.contact.eyebrow, description: dict.contact.intro, alternates: alternates(lang, "/contact") };
}

export default async function ContactPage({ params }: PageProps<"/[lang]/contact">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const settings = await getSettings();

  return (
    <PageTransition>
      <section className="relative isolate overflow-hidden px-4 pb-28 pt-36 sm:px-8 md:pt-44">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="morph-blob absolute -left-28 top-24 size-[30rem] bg-[var(--lilac)] opacity-50 blur-3xl" />
          <div className="morph-blob absolute -right-20 bottom-0 size-[26rem] bg-[var(--mint)] opacity-50 blur-3xl [animation-delay:-4s]" />
        </div>
        <div className="mx-auto grid max-w-[1400px] gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <Reveal className="lg:sticky lg:top-32 lg:self-start">
            <Eyebrow clay="var(--mint)">{dict.contact.eyebrow}</Eyebrow>
            <h1 className="display mt-6 text-[clamp(3.2rem,9vw,8rem)] text-plum">{dict.contact.title}</h1>
            <p className="mt-6 max-w-[38ch] text-lg leading-relaxed text-plum-soft sm:text-xl">{dict.contact.intro}</p>
            <div className="mt-10 space-y-3">
              {settings?.contactEmail && (
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="display-italic block text-[clamp(1.5rem,2.6vw,2.2rem)] text-plum underline decoration-[var(--berry)] decoration-2 underline-offset-[6px]"
                >
                  {settings.contactEmail}
                </a>
              )}
              {settings && settings.socials.length > 0 && (
                <ul className="flex flex-wrap gap-2 pt-2">
                  {settings.socials.map((s) => (
                    <li key={s.url}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="clay clay-press inline-flex rounded-full px-4 py-2 text-sm font-semibold text-plum"
                        style={{ ["--clay" as string]: "var(--cloud)" }}
                      >
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="bezel">
              <div className="bezel-core bg-cloud/90 p-4 sm:p-8">
                <ContactForm t={dict.contact} />
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </PageTransition>
  );
}
