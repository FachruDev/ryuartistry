import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Lightbulb, Info, TrendDown, TrendUp } from "@phosphor-icons/react/ssr";
import type { Insight } from "@/lib/analytics";
import { Sparkline } from "./charts";

export function Card({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-line bg-paper-raised p-5 ${className}`}>
      {(title || action) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="font-semibold">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

/** Signed change vs the previous period. `upIsGood` flips the color for metrics like bounce rate. */
export function Delta({ value, upIsGood = true, suffix = "" }: { value: number | null; upIsGood?: boolean; suffix?: string }) {
  if (value === null) return <span className="text-xs font-semibold text-muted">baru</span>;
  if (Math.abs(value) < 0.005) return <span className="text-xs font-semibold text-muted">± 0%{suffix}</span>;
  const up = value > 0;
  const good = up === upIsGood;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${good ? "text-success" : "text-danger"}`}>
      <Icon size={12} weight="bold" aria-hidden />
      {up ? "+" : "−"}
      {Math.round(Math.abs(value) * 100)}%{suffix}
    </span>
  );
}

export function StatTile({
  label,
  value,
  delta,
  upIsGood,
  trend,
  hint,
  href,
}: {
  label: string;
  value: string;
  delta?: number | null;
  upIsGood?: boolean;
  trend?: number[];
  hint?: string;
  href?: string;
}) {
  const body = (
    <>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1.5 text-[2rem] font-bold leading-none tracking-tight">{value}</p>
      <div className="mt-2 flex items-center gap-2">
        {delta !== undefined && <Delta value={delta} upIsGood={upIsGood} />}
        {hint && <span className="truncate text-xs text-muted">{hint}</span>}
      </div>
      {trend && <Sparkline values={trend} className="mt-3" />}
    </>
  );
  const cls = "block rounded-2xl border border-line bg-paper-raised p-5";
  return href ? (
    <Link href={href} className={`${cls} transition-colors hover:border-ink/25`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

const insightStyle = {
  up: { icon: TrendUp, cls: "bg-jade/50 text-on-pastel" },
  down: { icon: TrendDown, cls: "bg-sakura/60 text-on-pastel" },
  info: { icon: Info, cls: "bg-mizu/60 text-on-pastel" },
  tip: { icon: Lightbulb, cls: "bg-yuzu/60 text-on-pastel" },
} as const;

export function InsightList({ insights }: { insights: Insight[] }) {
  return (
    <ul className="space-y-3">
      {insights.map((insight, i) => {
        const { icon: Icon, cls } = insightStyle[insight.tone];
        return (
          <li key={i} className="flex gap-3">
            <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${cls}`}>
              <Icon size={16} weight="bold" aria-hidden />
            </span>
            <p className="pt-1 text-sm leading-relaxed">{insight.text}</p>
          </li>
        );
      })}
    </ul>
  );
}

export function LiveDot({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-paper-raised px-3 py-1.5 text-sm font-medium">
      <span className="relative flex size-2.5">
        {count > 0 && <span className="absolute inset-0 animate-ping rounded-full bg-success/60" />}
        <span className={`relative size-2.5 rounded-full ${count > 0 ? "bg-success" : "bg-muted/40"}`} />
      </span>
      {count} aktif sekarang
    </span>
  );
}
