import type { Metadata, Viewport } from "next";
import { Caveat, Geist_Mono, Kodchasan, Manrope } from "next/font/google";

import { AgentationDev } from "@/components/agentation-dev";
import { GlimmRootProvider } from "@/components/glimm-root-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { MotionProvider } from "@/components/motion-provider";

import "./globals.css";

const heroSupportFont = Kodchasan({
  variable: "--font-kodchasan",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const brandFont = Caveat({
  variable: "--font-caveat-family",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const bodyFont = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const monoFont = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QRafty",
  description: "QRafty — premium branded QR codes, live refinement, and export.",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
      {
        url: "/icon-dark.png",
        type: "image/png",
        sizes: "32x32",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple: [
      {
        url: "/apple-icon.png",
        type: "image/png",
        sizes: "180x180",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f5f0" },
    { media: "(prefers-color-scheme: dark)", color: "#1f222c" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${heroSupportFont.variable} ${brandFont.variable} ${bodyFont.variable} ${monoFont.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full cursor-default flex-col">
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <ThemeProvider>
          <GlimmRootProvider>
            <MotionProvider>{children}</MotionProvider>
          </GlimmRootProvider>
        </ThemeProvider>
        <AgentationDev />
      </body>
    </html>
  );
}
