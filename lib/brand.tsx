import { ImageResponse } from "next/og";

// The four-point sparkle from the nav (Phosphor "Sparkle", fill), on the ink square used across the brand.
export const SPARKLE_PATH =
  "M208,144a15.78,15.78,0,0,1-10.42,14.94L146,178l-19,51.62a15.92,15.92,0,0,1-29.88,0L78,178l-51.62-19a15.92,15.92,0,0,1,0-29.88L78,110l19-51.62a15.92,15.92,0,0,1,29.88,0L146,110l51.62,19A15.78,15.78,0,0,1,208,144ZM152,48h16V64a8,8,0,0,0,16,0V48h16a8,8,0,0,0,0-16H184V16a8,8,0,0,0-16,0V32H152a8,8,0,0,0,0,16Zm88,32h-8V72a8,8,0,0,0-16,0v8h-8a8,8,0,0,0,0,16h8v8a8,8,0,0,0,16,0V96h8a8,8,0,0,0,0-16Z";
export const INK = "#14213d";
export const PAPER = "#f3f1ea";

/** The square app icon as a PNG of the given size (apple-icon, logo for structured data, manifest). */
export function brandIcon(size: number, { rounded = true } = {}) {
  return new ImageResponse(
    (
      <svg width={size} height={size} viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
        <rect width="256" height="256" rx={rounded ? 56 : 0} fill={INK} />
        <path d={SPARKLE_PATH} fill={PAPER} transform="translate(41 46) scale(0.66)" />
      </svg>
    ),
    { width: size, height: size },
  );
}
