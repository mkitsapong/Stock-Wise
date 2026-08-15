"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPercent, cn } from "@/lib/utils";

interface TickerItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

const DEFAULT_TICKERS: TickerItem[] = [
  { symbol: "^GSPC", name: "S&P 500", price: 5864.67, change: 23.4, changePercent: 0.40 },
  { symbol: "^IXIC", name: "NASDAQ", price: 18342.94, change: 112.5, changePercent: 0.63 },
  { symbol: "^SET.BK", name: "SET Index", price: 1465.12, change: -4.2, changePercent: -0.28 },
  { symbol: "BTC-USD", name: "Bitcoin", price: 68420.00, change: 1450.0, changePercent: 2.15 },
  { symbol: "THB=X", name: "USD / THB", price: 34.25, change: -0.08, changePercent: -0.23 },
];

export default function MarketTickerRibbon() {
  const router = useRouter();
  const [tickers, setTickers] = useState<TickerItem[]>(DEFAULT_TICKERS);

  useEffect(() => {
    async function fetchTickerQuotes() {
      try {
        const symbols = "^GSPC,^IXIC,BTC-USD,THB=X";
        const res = await fetch(`/api/quotes?symbols=${encodeURIComponent(symbols)}`);
        if (!res.ok) return;
        const data = await res.json();
        const sparkData = data.spark?.result || [];

        if (sparkData.length > 0) {
          const updated = DEFAULT_TICKERS.map((item) => {
            const match = sparkData.find((s: any) => s.symbol === item.symbol);
            if (match && match.response?.[0]?.meta) {
              const meta = match.response[0].meta;
              const price = meta.regularMarketPrice || item.price;
              const prev = meta.chartPreviousClose || price;
              const change = price - prev;
              const changePercent = prev > 0 ? (change / prev) * 100 : 0;
              return { ...item, price, change, changePercent };
            }
            return item;
          });
          setTickers(updated);
        }
      } catch (err) {
        // Fallback gracefully to default values
      }
    }

    fetchTickerQuotes();
    const timer = setInterval(fetchTickerQuotes, 45000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full bg-muted-bg/30 border-b border-border/50 backdrop-blur-md overflow-hidden text-xs py-1.5 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 shrink-0 pr-3 border-r border-border/60">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted font-mono">Markets</span>
        </div>

        {/* Scrolling or Flex Tickers */}
        <div className="flex items-center gap-6 overflow-x-auto scrollbar-none py-0.5 w-full">
          {tickers.map((item) => {
            const isPos = item.change >= 0;
            return (
              <div
                key={item.symbol}
                onClick={() => router.push(`/?symbol=${item.symbol}`)}
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity shrink-0 group"
              >
                <span className="font-semibold text-foreground/90 font-mono text-[11px] group-hover:text-accent transition-colors">
                  {item.name}
                </span>
                <span className="font-mono text-foreground font-semibold tabular-nums text-[11px]">
                  {item.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span
                  className={cn(
                    "font-mono text-[10px] font-bold px-1.5 py-0.2 rounded tabular-nums flex items-center gap-0.5",
                    isPos ? "text-profit bg-profit/10" : "text-loss bg-loss/10"
                  )}
                >
                  {isPos ? "+" : ""}{formatPercent(item.changePercent)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
