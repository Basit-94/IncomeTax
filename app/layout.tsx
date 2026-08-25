import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Disclaimer from "../components/disclaimer";


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
    <html lang="en">
      <body className="min-h-dvh flex flex-col">
        <div className="flex-1">{children}</div>
        <Analytics />
        <Disclaimer />
      </body>
    </html>
  );
}
