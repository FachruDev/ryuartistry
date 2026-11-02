// Platform metadata shared by the CMS, the public site, and the MCP tools.

export const PLATFORMS = ["android", "windows", "macos", "linux"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const platformInfo: Record<Platform, { label: string; extensions: string[]; accept: string }> = {
  android: { label: "Android", extensions: [".apk"], accept: ".apk" },
  windows: { label: "Windows", extensions: [".exe", ".msi", ".zip"], accept: ".exe,.msi,.zip" },
  macos: { label: "macOS", extensions: [".dmg", ".pkg", ".zip"], accept: ".dmg,.pkg,.zip" },
  linux: { label: "Linux", extensions: [".appimage", ".deb", ".rpm", ".tar.gz", ".zip"], accept: ".AppImage,.deb,.rpm,.tar.gz,.zip" },
};

/** Builds kept per project and platform; older ones lose their file but keep their changelog. */
export const KEEP_BUILDS = 5;
export const MAX_BUILD_BYTES = 2 * 1024 ** 3;

export function extensionOk(platform: Platform, filename: string) {
  const name = filename.toLowerCase();
  return platformInfo[platform].extensions.some((ext) => name.endsWith(ext));
}

/** Content type the browser sees when downloading, so Android offers to install an APK. */
export function downloadContentType(filename: string) {
  return filename.toLowerCase().endsWith(".apk") ? "application/vnd.android.package-archive" : "application/octet-stream";
}

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

/** Changelog text is one change per line; leading bullets are optional. */
export function changelogLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
}
