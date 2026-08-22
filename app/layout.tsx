import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wapsi — your money, coming back",
  description:
    "An independent concept prototype: what filing a tax return and tracking a refund could feel like if the system told you the truth. Not affiliated with the Income Tax Department.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#faf6ef",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh flex flex-col">
        <div className="flex-1">{children}</div>

        {/*
          Required by the hackathon brief: the prototype must not present itself
          as an official government product. This is not dismissable.
        */}
        <footer className="border-t border-line bg-paper-2 px-5 py-4 text-[0.8rem] leading-relaxed text-ink-2">
          <p className="mx-auto max-w-2xl">
            <strong className="font-semibold text-ink">
              Independent concept prototype.
            </strong>{" "}
            Not affiliated with, endorsed by, or connected to the Income Tax
            Department, CBDT, or the Government of India. Every name, PAN,
            amount and document here is invented. No live government system is
            contacted.{" "}
            <a
              className="font-medium text-money underline decoration-money/30 underline-offset-2 hover:decoration-money"
              href="/honesty"
            >
              See exactly what is real and what is mocked
            </a>
            .
          </p>
        </footer>
      </body>
    </html>
  );
}
