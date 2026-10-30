import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";
import "../globals.css";

// The CMS reads the session on every request, so it is allowed to block.
export const instant = false;

export const metadata: Metadata = {
  title: { default: "Ryuartistry CMS", template: "%s · Ryuartistry CMS" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="id" className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full bg-paper text-text">{children}</body>
    </html>
  );
}
