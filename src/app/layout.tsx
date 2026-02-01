import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Altair - MultiversX Dashboard",
  description: "Advanced analytics and management dashboard for MultiversX",
  metadataBase: new URL("https://altair.dapp"), // TODO: Update with actual domain
  openGraph: {
    title: "Altair - MultiversX Dashboard",
    description: "Advanced analytics and management dashboard for MultiversX",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Altair - MultiversX Dashboard",
    description: "Advanced analytics and management dashboard for MultiversX",
  },
};

import { AppInitializer } from "@/components/providers/AppInitializer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppInitializer>
          {children}
        </AppInitializer>
      </body>
    </html>
  );
}
