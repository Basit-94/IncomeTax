import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Caveat, JetBrains_Mono, Source_Serif_4, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Disclaimer from "../components/disclaimer";
import { TaxProvider } from "../context/TaxReturnContext";

/* Direction 13 typography (DESIGN.md §4): Space Grotesk carries headings,
   badges, buttons and nav; Source Serif 4 is what makes the body read as a
   document; JetBrains Mono carries every number; Caveat is the pencil voice. */
const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-grotesk",
});
const serif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-serif-d13",
});
const jbMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jb-mono",
});
const caveat = Caveat({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-caveat",
});


export const metadata: Metadata = {
  title: "Wapsi — your money, coming back",
  description:
    "An independent concept prototype: what filing a tax return and tracking a refund could feel like if the system told you the truth. Not affiliated with the Income Tax Department.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f3f7f8",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${grotesk.variable} ${serif.variable} ${jbMono.variable} ${caveat.variable}`}
    >
      <body className="min-h-dvh flex flex-col">
        {/* D13 layer stack (verbatim d13.css): graph paper at -2, motes canvas
            at -1 (mounted in the page), veil above the motes so they recede. */}
        <div className="paper" aria-hidden="true" />
        <TaxProvider>
          <div className="flex-1">{children}</div>
        </TaxProvider>
        <div className="veil" aria-hidden="true" />
        <Analytics />
        <Disclaimer />
      </body>
    </html>
  );
}
