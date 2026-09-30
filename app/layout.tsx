import type { Metadata, Viewport } from "next";
import { Caveat, IBM_Plex_Mono, Instrument_Sans } from "next/font/google";

import { AgentationDev } from "@/components/agentation-dev";
import { GlimmRootProvider } from "@/components/glimm-root-provider";
import { THEME_INIT_SCRIPT } from "@/features/shell/model/theme";
import { MotionProvider } from "@/components/motion-provider";

import "./globals.css";

const brandFont = Caveat({
  variable: "--font-caveat-family",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const uiFont = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
      className={`${brandFont.variable} ${uiFont.variable} ${monoFont.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full cursor-default flex-col">
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <GlimmRootProvider>
          <MotionProvider>{children}</MotionProvider>
        </GlimmRootProvider>
        <AgentationDev />
      </body>
    </html>
  );
}
