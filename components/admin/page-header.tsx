import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  back,
  actions,
}: {
  title: string;
  description?: string;
  back?: { href: string; label: string };
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
      <div>
        {back && (
          <Link href={back.href} className="text-sm text-muted hover:text-text">
            ← {back.label}
          </Link>
        )}
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-muted">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

export function StatusBadge({ status }: { status: "draft" | "published" | string }) {
  const published = status === "published";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
        published ? "bg-success/15 text-success" : "bg-line text-muted"
      }`}
    >
      {published ? "Terbit" : "Draf"}
    </span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-dashed border-line px-6 py-12 text-center text-muted">{children}</div>;
}
