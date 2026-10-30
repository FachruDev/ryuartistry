import {
  Briefcase,
  ChartLineUp,
  Flask,
  GearSix,
  Images,
  Robot,
  SquaresFour,
  Stack,
  Tray,
  UsersThree,
  type Icon,
} from "@phosphor-icons/react";

export type NavItem = { href: string; label: string; icon: Icon; keywords?: string };

export const navGroups: { label?: string; items: NavItem[] }[] = [
  {
    items: [
      { href: "/admin", label: "Ringkasan", icon: SquaresFour, keywords: "dashboard beranda home" },
      { href: "/admin/analytics", label: "Analitik", icon: ChartLineUp, keywords: "kunjungan traffic statistik visitor" },
    ],
  },
  {
    label: "Konten",
    items: [
      { href: "/admin/projects", label: "Karya", icon: Briefcase, keywords: "portofolio project work" },
      { href: "/admin/posts", label: "Lab", icon: Flask, keywords: "blog catatan devlog post" },
      { href: "/admin/services", label: "Layanan", icon: Stack, keywords: "services jasa" },
      { href: "/admin/team", label: "Tim", icon: UsersThree, keywords: "team anggota" },
    ],
  },
  {
    label: "Interaksi",
    items: [{ href: "/admin/inbox", label: "Inbox", icon: Tray, keywords: "pesan kontak inquiry" }],
  },
  {
    label: "Aset",
    items: [{ href: "/admin/media", label: "Media", icon: Images, keywords: "gambar upload foto" }],
  },
  {
    label: "Sistem",
    items: [
      { href: "/admin/ai", label: "Asisten AI", icon: Robot, keywords: "claude mcp token otomatis" },
      { href: "/admin/settings", label: "Pengaturan", icon: GearSix, keywords: "settings situs hero sosial" },
    ],
  },
];

export const createItems = [
  { href: "/admin/projects/new", label: "Karya baru" },
  { href: "/admin/posts/new", label: "Catatan Lab baru" },
  { href: "/admin/services/new", label: "Layanan baru" },
  { href: "/admin/team/new", label: "Anggota tim baru" },
];

export function isActive(href: string, pathname: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}
