import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, pick } from "@/lib/i18n";
import { getTeam } from "@/lib/queries";
import { alternates } from "@/lib/site";
import { toneCycle } from "@/lib/tones";
import { CtaCard } from "@/components/site/cta-card";
import { PageIntro } from "@/components/site/page-intro";
import { PageTransition } from "@/components/site/page-transition";
import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/ui";

export async function generateMetadata({ params }: PageProps<"/[lang]/about">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  return { title: dict.nav.about, description: dict.about.intro, alternates: alternates(lang, "/about") };
}

export default async function AboutPage({ params }: PageProps<"/[lang]/about">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const team = await getTeam();

  return (
    <PageTransition>
      <PageIntro title={dict.about.title} intro={dict.about.intro} />

      <section className="px-4 pb-24 sm:px-8 md:pb-36">
        <Reveal className="mx-auto max-w-[900px] rounded-[2.5rem] bg-paper-raised/70 p-8 ring-1 ring-line md:rounded-[3.5rem] md:p-14">
          <p className="text-[clamp(1.3rem,2.4vw,1.85rem)] font-medium leading-[1.5] tracking-[-0.01em] text-ink">{dict.about.story}</p>
        </Reveal>
      </section>

      <section className="px-4 pb-24 sm:px-8 md:pb-36">
        <Reveal>
          <SectionHeading title={dict.about.valuesTitle} />
        </Reveal>
        <ol className="mx-auto mt-14 grid max-w-[1240px] gap-x-8 gap-y-12 sm:grid-cols-2 md:mt-20 lg:grid-cols-4">
          {dict.about.values.map((v, i) => (
            <li key={v.title} className="group border-t border-line pt-6">
              <Reveal delay={i * 0.08}>
                <span
                  className="display grid size-12 place-items-center rounded-full text-lg text-on-pastel transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-rotate-12 group-hover:scale-110"
                  style={{ background: toneCycle[i % toneCycle.length] }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="display mt-6 text-[2rem] text-ink">{v.title}</h3>
                <p className="mt-3 max-w-[34ch] leading-relaxed text-muted">{v.body}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      {team.length > 0 && (
        <section className="px-4 pb-24 sm:px-8 md:pb-36">
          <Reveal>
            <SectionHeading title={dict.about.teamTitle} />
          </Reveal>
          <ul className="mx-auto mt-14 grid max-w-[1240px] gap-x-6 gap-y-14 sm:grid-cols-2 md:mt-20 lg:grid-cols-4">
            {team.map((m, i) => (
              <li key={m.id} className="group">
                <Reveal delay={(i % 4) * 0.08}>
                  <div
                    className="relative aspect-[4/5] overflow-hidden rounded-[2rem] transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-1.5 group-hover:-rotate-1"
                    style={{ background: toneCycle[i % toneCycle.length] }}
                  >
                    {m.photo && <Image src={m.photo.url} alt={m.name} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />}
                  </div>
                  <h3 className="display mt-5 text-2xl text-ink">{m.name}</h3>
                  <p className="font-medium text-muted">{pick(m.role, lang)}</p>
                  {pick(m.bio, lang) && <p className="mt-3 leading-relaxed text-muted">{pick(m.bio, lang)}</p>}
                  {m.socials.length > 0 && (
                    <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                      {m.socials.map((s) => (
                        <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="link-grow text-sm font-semibold text-ink">
                          {s.label}
                        </a>
                      ))}
                    </p>
                  )}
                </Reveal>
              </li>
            ))}
          </ul>
        </section>
      )}

      <CtaCard
        title={dict.home.ctaTitle}
        body={dict.home.ctaBody}
        primary={{ href: `/${lang}/contact`, label: dict.home.ctaSecondary }}
        secondary={{ href: `/${lang}/work`, label: dict.home.ctaPrimary }}
      />
    </PageTransition>
  );
}
