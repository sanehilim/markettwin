import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, JetBrains_Mono } from "next/font/google";

import { AppShell } from "@/components/app-shell";
import { appConfig } from "@/lib/config";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap"
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap"
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(appConfig.siteUrl),
  title: {
    default: "MarketTwin AI",
    template: "%s · MarketTwin AI"
  },
  description:
    "AI market pattern intelligence for comparing current crypto market conditions with historical analogs.",
  applicationName: "MarketTwin AI",
  authors: [{ name: "MarketTwin AI" }],
  keywords: ["crypto", "CoinMarketCap", "market intelligence", "historical analogs", "trading research"],
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "MarketTwin AI",
    description:
      "Find crypto markets that look like today, learn from the past, and analyze likely regimes from live CMC data.",
    url: appConfig.siteUrl,
    siteName: "MarketTwin AI",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: `${appConfig.siteUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "MarketTwin AI market pattern intelligence dashboard"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "MarketTwin AI",
    description:
      "Find crypto markets that look like today, learn from the past, and analyze likely regimes from live CMC data.",
    images: [`${appConfig.siteUrl}/opengraph-image`]
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
    apple: "/icon.svg"
  },
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#122033" }
  ]
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${fraunces.variable} ${jetbrains.variable}`}>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
