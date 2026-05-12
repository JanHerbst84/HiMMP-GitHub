import { Fraunces, Inter_Tight, JetBrains_Mono } from "next/font/google";

export const fontDisplay = Fraunces({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600", "800"],
  variable: "--font-display",
  preload: false
});

export const fontBody = Inter_Tight({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body"
});

export const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "700"],
  variable: "--font-mono",
  preload: false
});

export const fontVariableClassName = [
  fontDisplay.variable,
  fontBody.variable,
  fontMono.variable
].join(" ");
