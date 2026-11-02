import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";
import { themeScript } from "@/lib/theme";
import { ThemeSync } from "@/components/site/theme-toggle";
import "../globals.css";

// The CMS reads the session on every request, so it is allowed to block.
export const instant = false;

export const metadata: Metadata = {
  title: { default: "Ryuartistry CMS", template: "%s · Ryuartistry CMS" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    // Same theme choice as the site; the inline script sets data-theme before paint.
    <html lang="id" className={`${fontVariables} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="cms min-h-full bg-paper text-text">
        <ThemeSync />
        {children}
      </body>
    </html>
  );
}
