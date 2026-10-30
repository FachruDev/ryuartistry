"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Ringkasan" },
  { href: "/admin/projects", label: "Karya" },
  { href: "/admin/posts", label: "Lab" },
  { href: "/admin/services", label: "Layanan" },
  { href: "/admin/team", label: "Tim" },
  { href: "/admin/inbox", label: "Inbox" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/settings", label: "Pengaturan" },
];

export function AdminNav({ unread }: { unread: number }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 [scrollbar-width:none] lg:flex-col lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden">
      {items.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active ? "bg-paper text-ink" : "text-paper/75 hover:bg-paper/10 hover:text-paper"
            }`}
          >
            {item.label}
            {item.href === "/admin/inbox" && unread > 0 && (
              <span className="ml-2 rounded-full bg-scale px-2 text-xs font-bold text-ink-deep">{unread}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
