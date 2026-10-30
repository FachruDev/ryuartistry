import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, pick } from "@/lib/i18n";
import { getOpenJobs } from "@/lib/queries";
import { alternates } from "@/lib/site";
import { PageIntro } from "@/components/site/page-intro";

export async function generateMetadata({ params }: PageProps<"/[lang]/careers">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  return { title: dict.careers.title, description: dict.careers.intro, alternates: alternates(lang, "/careers") };
}

export default async function CareersPage({ params }: PageProps<"/[lang]/careers">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const jobs = await getOpenJobs();

  return (
    <>
      <PageIntro title={dict.careers.title} intro={dict.careers.intro} />
      <section className="mx-auto max-w-[1440px] px-4 py-20 sm:px-8 md:py-28">
        {jobs.length === 0 ? (
          <div className="max-w-[52ch]">
            <p className="text-lg text-text/80">{dict.careers.empty}</p>
            <Link href={`/${lang}/contact`} className="mt-6 inline-block font-semibold text-ink underline decoration-scale decoration-2 underline-offset-4">
              {dict.nav.contact}
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {jobs.map((j) => (
              <li key={j.id}>
                <Link href={`/${lang}/careers/${j.slug}`} className="group grid gap-2 py-8 md:grid-cols-[1fr_auto] md:items-baseline">
                  <div>
                    <h2 className="text-2xl font-semibold text-ink decoration-scale decoration-2 underline-offset-4 group-hover:underline sm:text-3xl">
                      {pick(j.title, lang)}
                    </h2>
                    {pick(j.summary, lang) && <p className="mt-2 max-w-[62ch] text-text/75">{pick(j.summary, lang)}</p>}
                  </div>
                  <p className="text-muted">
                    {j.location}, {j.employmentType}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
