import { brandIcon } from "@/lib/brand";

// A raster logo for structured data (Organization.logo) and the web app manifest.
export function GET() {
  return brandIcon(512);
}
