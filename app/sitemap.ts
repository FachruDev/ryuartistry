import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n";
import { getPosts, getProjects } from "@/lib/queries";
import { siteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, posts] = await Promise.all([getProjects(), getPosts()]);

  const entry = (path: string, lastModified?: Date): MetadataRoute.Sitemap[number] => ({
    url: `${siteUrl}/id${path}`,
    lastModified,
    alternates: { languages: Object.fromEntries(locales.map((l) => [l, `${siteUrl}/${l}${path}`])) },
  });

  return [
    ...["", "/work", "/lab", "/services", "/about", "/contact"].map((p) => entry(p)),
    ...projects.map((p) => entry(`/work/${p.slug}`, p.updatedAt)),
    ...posts.map((p) => entry(`/lab/${p.slug}`, p.updatedAt)),
  ];
}
