import Link from "next/link";
import { Sparkle } from "@/components/site/ui";

// Rendered inside the [lang] layout, which has already validated the locale.
export default function NotFound() {
  return (
    <section className="relative flex min-h-[86dvh] items-center px-4 pb-16 pt-36 text-center sm:px-8">
      <Sparkle className="absolute left-[12%] top-[30%] size-12 md:size-16" color="var(--sparkle)" />
      <Sparkle className="absolute bottom-[22%] right-[14%] size-10 md:size-14" color="var(--wisteria)" delay={-2} />
      <div className="mx-auto w-full max-w-3xl">
        <p className="display text-[clamp(7rem,28vw,18rem)] leading-none text-ink">
          404<span className="text-accent">.</span>
        </p>
        <h1 className="display mt-4 text-[clamp(1.8rem,4vw,2.8rem)] text-ink">Halaman ini tidak ditemukan.</h1>
        <p lang="en" className="mt-2 text-lg text-muted">
          This page couldn&apos;t be found.
        </p>
        <div className="mt-10 flex justify-center gap-3">
          <Link
            href="/id"
            className="rounded-full bg-ink px-6 py-3.5 font-semibold text-paper transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-0.5"
          >
            Beranda
          </Link>
          <Link
            href="/en"
            className="rounded-full bg-paper-raised/60 px-6 py-3.5 font-semibold text-ink ring-1 ring-line transition-[transform,background-color] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-0.5 hover:bg-paper-raised"
          >
            Home
          </Link>
        </div>
      </div>
    </section>
  );
}
