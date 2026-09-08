import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Caveat, JetBrains_Mono, Outfit } from "next/font/google";
import "./globals.css";
import Disclaimer from "../components/disclaimer";
import { TaxProvider } from "../context/TaxReturnContext";

/* Redesign 2026-09-06 (docs/redesign handoff): Outfit carries everything —
   display, body, buttons — replacing Space Grotesk + Source Serif 4; JetBrains
   Mono keeps every number, PAN and eyebrow label; Caveat is Munshi ji's
   handwritten note. The old --font-grotesk / --font-serif-d13 variables are
   kept as aliases of Outfit so no component has to change its font class. */
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-outfit",
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
  themeColor: "#FAFAF8",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      dir="ltr"
      data-scroll-behavior="smooth"
      className={`${outfit.variable} ${jbMono.variable} ${caveat.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{document.documentElement.dir='ltr';var t=localStorage.getItem('wapsi_theme');if(t==='dark'){document.documentElement.classList.add('dark','dark-mode');}else{document.documentElement.classList.remove('dark','dark-mode');}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-dvh flex flex-col">
        {/* The ambient ground: lilac page with two drifting blobs (globals.css .paper), under everything. */}
        <div className="paper" aria-hidden="true" />
        <TaxProvider>
          <div className="flex-1">{children}</div>
        </TaxProvider>
        <div className="veil" aria-hidden="true" />
        <Analytics />
        <SpeedInsights />
        <Disclaimer />
      </body>
    </html>
  );
}
