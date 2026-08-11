import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "StockWise — Smart Portfolio Tracker",
  description:
    "Track your stock portfolio, monitor performance, analyze dividends, and manage your watchlist with a premium financial dashboard.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
          <div className="ambient-bg">
            <div className="ambient-blob-1"></div>
            <div className="ambient-blob-2"></div>
          </div>
          <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
