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
  const tones = ["#cbc4f3", "#a7dcc4", "#b9d7f0", "#f6c6d1"];
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
          background: "linear-gradient(160deg, #f7ecc2 0%, #f3f1ea 45%, #e3f1ea 100%)",
          color: "#14213d",
        }}
      >
        <div style={{ display: "flex", fontSize: 40, fontWeight: 700, letterSpacing: -1.5 }}>
          ryuartistry<span style={{ color: "#e0442a" }}>.</span>
        </div>
        <div style={{ display: "flex", fontSize: 104, fontWeight: 700, letterSpacing: -5, lineHeight: 1 }}>
          {`${dict.home.heroLead} ${dict.home.heroWords[0]}`}
          <span style={{ color: "#e0442a" }}>.</span>
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
