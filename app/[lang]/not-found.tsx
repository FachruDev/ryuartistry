import Link from "next/link";

// Rendered inside the [lang] layout, which has already validated the locale.
export default function NotFound() {
  return (
    <section className="flex min-h-[80vh] items-end bg-ink px-4 pb-20 pt-40 text-paper sm:px-8">
      <div className="mx-auto w-full max-w-[1440px]">
        <p className="display text-[clamp(6rem,22vw,20rem)] leading-none text-scale">404</p>
        <h1 className="mt-4 text-3xl font-semibold">Halaman tidak ditemukan</h1>
        <p lang="en" className="mt-1 text-xl text-paper/70">Page not found</p>
        <div className="mt-8 flex gap-4">
          <Link href="/id" className="rounded-full bg-scale px-6 py-3 font-bold text-ink-deep">
            Beranda
          </Link>
          <Link href="/en" className="rounded-full border border-paper/40 px-6 py-3 font-semibold">
            Home
          </Link>
        </div>
      </div>
    </section>
  );
}
