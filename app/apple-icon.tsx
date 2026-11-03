import { brandIcon } from "@/lib/brand";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS rounds the corners itself, so the square stays square.
export default function AppleIcon() {
  return brandIcon(180, { rounded: false });
}
