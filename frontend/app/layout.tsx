import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Y2K Resale Tracker",
  description: "Resale price tracking for Y2K brands",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col pt-16">
        <NavBar />
        {/* Explicit flex-1 + w-full: body's flex children should stretch to
            full width by default, but the Next.js dev-tools overlay adds
            its own (non-stretching) elements as body siblings, which can
            throw that default off in dev. Pinning it here guarantees every
            page gets the full width regardless. */}
        <div className="w-full flex-1">{children}</div>
      </body>
    </html>
  );
}
