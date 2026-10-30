import { ImageResponse } from "next/og";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, locales } from "@/lib/i18n";

export const alt = "Ryuartistry";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function OpengraphImage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = getDictionary(isLocale(lang) ? lang : "id");
  const clays = ["#cdbcff", "#b8ecd8", "#bcdcff", "#ffcdb8"];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#f4f1fb",
          color: "#2a1e3f",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", right: -80, top: -60, width: 520, height: 520, borderRadius: 999, background: "#cdbcff" }} />
        <div style={{ position: "absolute", right: 300, bottom: -120, width: 320, height: 320, borderRadius: 999, background: "#ffcdb8" }} />
        <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1 }}>ryuartistry</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1, letterSpacing: -3, maxWidth: 900 }}>
            {`${dict.home.heroLead} ${dict.home.heroWords[0]} ${dict.home.heroTail}`}
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            {clays.map((c) => (
              <div key={c} style={{ width: 56, height: 56, borderRadius: 999, background: c }} />
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
