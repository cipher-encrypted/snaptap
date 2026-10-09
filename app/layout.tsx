import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Snaptap — Universal Media Utility",
  description:
    "Ultra-premium, tactile universal media asset extractor engineered with Apple Spatial UI fluidity.",
  keywords: [
    "Snaptap",
    "media extractor",
    "video downloader",
    "Instagram",
    "TikTok",
    "YouTube",
    "X",
    "spatial UI",
  ],
  authors: [{ name: "Snaptap Team" }],
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased selection:bg-white/20 selection:text-white`}
    >
      <body className="relative min-h-screen flex flex-col bg-[#09090b] text-[#f4f4f5] overflow-x-hidden">
        {/* Ambient Radial Light Canvas */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        >
          {/* Subtle top ambient radial wash */}
          <div className="ambient-glow-top" />

          {/* Secondary atmospheric center glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[600px] w-[800px] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.025)_0%,transparent_70%)] blur-3xl" />

          {/* Bottom subtle grounding glow */}
          <div className="ambient-glow-bottom" />

          {/* Micro-dot spatial canvas pattern overlay with soft fade */}
          <div className="absolute inset-0 bg-grid-pattern opacity-25 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)]" />
        </div>

        {/* Global Floating Navigation */}
        <Navbar />

        {/* Main Content Area */}
        <main className="relative z-10 flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
