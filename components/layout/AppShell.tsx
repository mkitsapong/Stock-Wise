"use client";

import { useEffect, useState } from "react";
import ThemeProvider from "./ThemeProvider";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import TopBar from "./TopBar";
import MarketTickerRibbon from "./MarketTickerRibbon";
import AuthLoadingGuard from "./AuthLoadingGuard";
import { useWatchlist } from "@/context/WatchlistContext";
import { usePriceAlerts } from "@/hooks/usePriceAlerts";
import PortfolioChat from "@/components/ai/PortfolioChat";

/** Isolated component so the hook only runs when watchlist is ready */
function PriceAlertActivator() {
  const { watchlist } = useWatchlist();
  const [liveItems, setLiveItems] = useState<any[]>([]);

  useEffect(() => {
    if (watchlist.length === 0) return;
    const symbols = watchlist.map((w) => w.symbol).join(",");
    fetch(`/api/quotes?symbols=${encodeURIComponent(symbols)}&range=1d&interval=1d`)
      .then((r) => r.json())
      .then((data) => {
        const spark = data.spark?.result || [];
        const items = watchlist.map((w) => {
          const info = spark.find((s: any) => s.symbol?.toUpperCase() === w.symbol.toUpperCase());
          const currentPrice = info?.response?.[0]?.meta?.regularMarketPrice ?? 0;
          return { ...w, currentPrice };
        });
        setLiveItems(items);
      })
      .catch(() => {});
    // Refresh every 60 seconds
    const id = setInterval(() => {
      fetch(`/api/quotes?symbols=${encodeURIComponent(symbols)}&range=1d&interval=1d`)
        .then((r) => r.json())
        .then((data) => {
          const spark = data.spark?.result || [];
          const items = watchlist.map((w) => {
            const info = spark.find((s: any) => s.symbol?.toUpperCase() === w.symbol.toUpperCase());
            const currentPrice = info?.response?.[0]?.meta?.regularMarketPrice ?? 0;
            return { ...w, currentPrice };
          });
          setLiveItems(items);
        })
        .catch(() => {});
    }, 60000);
    return () => clearInterval(id);
  }, [watchlist]);

  usePriceAlerts(liveItems);
  return null;
}


export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <PriceAlertActivator />
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden pb-20 md:pb-0 flex flex-col">
          <TopBar />
          <MarketTickerRibbon />
          <AuthLoadingGuard>
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </div>
          </AuthLoadingGuard>
        </main>
        <BottomNav />
      </div>
      <PortfolioChat />
    </ThemeProvider>
  );
}

