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
  const tones = ["#cfb8f6", "#a9e4cb", "#b8d8fb", "#ffc4a8"];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 36,
          background: "linear-gradient(160deg, #fbefc4 0%, #f4efe7 45%, #e9e2f6 100%)",
          color: "#1f2550",
        }}
      >
        <div style={{ display: "flex", fontSize: 40, fontWeight: 700, letterSpacing: -1.5 }}>
          ryuartistry<span style={{ color: "#f2603a" }}>.</span>
        </div>
        <div style={{ display: "flex", fontSize: 104, fontWeight: 700, letterSpacing: -5, lineHeight: 1 }}>
          {`${dict.home.heroLead} ${dict.home.heroWords[0]}`}
          <span style={{ color: "#f2603a" }}>.</span>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          {tones.map((c) => (
            <div key={c} style={{ width: 120, height: 44, borderRadius: 999, background: c }} />
          ))}
        </div>
      </div>
    ),
    size,
  );
}
