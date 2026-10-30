import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";

// Display: Bricolage Grotesque at its largest optical size, slightly narrowed and tightly tracked.
export const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
  variable: "--font-bricolage",
});

// Text and UI: Plus Jakarta Sans, designed in Jakarta.
export const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const fontVariables = `${bricolage.variable} ${jakarta.variable}`;
