/** Where to land after signing in: only paths inside the CMS, never another site. */
export function safeAdminPath(value: string | null | undefined) {
  if (!value || !(value === "/admin" || value.startsWith("/admin/") || value.startsWith("/admin?"))) return "/admin";
  if (value.includes("\\") || value.startsWith("//")) return "/admin";
  return value;
}
