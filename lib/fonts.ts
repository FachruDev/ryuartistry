import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";

// Display: Fraunces with its SOFT and WONK axes, which round the serifs like pressed clay.
export const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
});

// Text and UI: Plus Jakarta Sans, designed in Jakarta.
export const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const fontVariables = `${fraunces.variable} ${jakarta.variable}`;
