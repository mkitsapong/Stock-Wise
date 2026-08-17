"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWatchlist } from "@/context/WatchlistContext";
import { useCurrency } from "@/context/CurrencyContext";
import CompanyLogo from "@/components/common/CompanyLogo";
import { cn, formatPercent } from "@/lib/utils";

interface WatchlistQuote {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChangePercent: number;
}

export default function DashboardWatchlist({ className }: { className?: string }) {
  const router = useRouter();
  const { watchlist, isLoading: isWatchlistLoading } = useWatchlist();
  const { formatCurrency } = useCurrency();
  const [quotes, setQuotes] = useState<Record<string, WatchlistQuote>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (watchlist.length === 0) return;
    setIsLoading(true);
    const symbols = watchlist.map((w) => w.symbol).join(",");
    
    fetch(`/api/quotes?symbols=${encodeURIComponent(symbols)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.spark && data.spark.result) {
          const quotesMap: Record<string, WatchlistQuote> = {};
          data.spark.result.forEach((q: any) => {
            const meta = q.response?.[0]?.meta || {};
            quotesMap[q.symbol] = {
              symbol: q.symbol,
              regularMarketPrice: meta.regularMarketPrice || 0,
              regularMarketChangePercent: 0,
            };
            
            if (meta.chartPreviousClose && meta.regularMarketPrice) {
               quotesMap[q.symbol].regularMarketChangePercent = 
                 ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100;
            }
          });
          setQuotes(quotesMap);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [watchlist]);

  if (!isWatchlistLoading && watchlist.length === 0) return null;

  return (
    <div className={cn("glass-card p-6 flex flex-col animate-fade-in-up opacity-0 stagger-4", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">Your Watchlist</h2>
          <p className="text-xs text-muted">กดที่รายชื่อเพื่อดูกราฟทันที</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden pr-2 -mr-2 space-y-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {/* Loading State */}
        {(isWatchlistLoading || isLoading) && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted-bg/40 animate-pulse">
                <div className="w-9 h-9 rounded-xl skeleton-shimmer flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="w-20 h-3 skeleton-shimmer rounded" />
                  <div className="w-32 h-3 skeleton-shimmer rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Watchlist Items */}
        {!isWatchlistLoading && !isLoading && watchlist.length > 0 && (
          <div className="space-y-2 pb-2">
            {watchlist.map((item) => {
              const quote = quotes[item.symbol];
              const changePct = quote?.regularMarketChangePercent || 0;
              const isPositive = changePct >= 0;

              return (
                <div
                  key={item.symbol}
                  onClick={() => router.push(`/?symbol=${item.symbol}`)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl border bg-muted-bg/30 border-border/40 hover:bg-card-bg hover:border-accent/30 hover:shadow-md cursor-pointer transition-all group"
                >
                  <CompanyLogo symbol={item.symbol} size="md" className="rounded-xl flex-shrink-0 group-hover:scale-105 transition-transform" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground font-mono group-hover:text-accent transition-colors">
                      {item.symbol}
                    </p>
                    <p className="text-xs text-muted truncate max-w-[120px]">{item.name}</p>
                  </div>
                  
                  {quote ? (
                    <div className="text-right">
                      <p className="text-sm font-bold font-mono text-foreground">
                        {formatCurrency(quote.regularMarketPrice)}
                      </p>
                      <p className={cn(
                        "text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md inline-block mt-0.5",
                        isPositive ? "bg-profit/10 text-profit" : "bg-loss/10 text-loss"
                      )}>
                        {isPositive ? "▲" : "▼"} {formatPercent(changePct)}
                      </p>
                    </div>
                  ) : (
                    <div className="w-16 h-8 skeleton-shimmer rounded-lg" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
