import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Disclaimer from "../components/disclaimer";
import { TaxProvider } from "../context/TaxReturnContext";


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
    <html lang="en" data-scroll-behavior="smooth">
      <body className="min-h-dvh flex flex-col">
        <TaxProvider>
          <div className="flex-1">{children}</div>
        </TaxProvider>
        <Analytics />
        <Disclaimer />
      </body>
    </html>
  );
}
