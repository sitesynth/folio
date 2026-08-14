import type { Metadata } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3003"
  ),
  title: "Sofiia Van der Vir — Architektur Portfolio 2026",
  description: "Architekturportfolio von Sofiia Van der Vir — Frauentherapiezentrum Lüssow, Stadtbad Krefeld, Wohnungsbau Stolberg.",
  openGraph: {
    title: "Sofiia Van der Vir — Architektur Portfolio 2026",
    description: "Architekturportfolio — Frauentherapiezentrum, Stadtbad Krefeld, Wohnungsbau.",
    type: "website",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sofiia Van der Vir — Architektur Portfolio 2026",
    description: "Architekturportfolio — Frauentherapiezentrum, Stadtbad Krefeld, Wohnungsbau.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} ${cormorantGaramond.variable} ${inter.variable} h-full antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
