import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale } from "@/lib/i18n";
import { getPosts } from "@/lib/queries";
import { alternates } from "@/lib/site";
import { PageIntro } from "@/components/site/page-intro";
import { PostList } from "@/components/site/post-list";

export async function generateMetadata({ params }: PageProps<"/[lang]/lab">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  return { title: dict.lab.title, description: dict.lab.intro, alternates: alternates(lang, "/lab") };
}

export default async function LabPage({ params }: PageProps<"/[lang]/lab">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const posts = await getPosts();

  return (
    <>
      <PageIntro title={dict.lab.title} intro={dict.lab.intro} />
      <section className="mx-auto max-w-[1440px] px-4 py-20 sm:px-8 md:py-28">
        {posts.length === 0 ? (
          <p className="text-lg text-muted">{dict.lab.empty}</p>
        ) : (
          <PostList items={posts} lang={lang} minRead={dict.lab.minRead} />
        )}
      </section>
    </>
  );
}
