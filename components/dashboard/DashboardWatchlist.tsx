"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const currentSymbol = searchParams.get("symbol")?.toUpperCase();
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

  return (
    <div className={cn("glass-card p-5 flex flex-col animate-fade-in-up opacity-0 stagger-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0 pb-3 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shadow-xs">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground tracking-tight">Watchlist</h2>
            <p className="text-[11px] text-muted font-medium">กดเพื่อสลับดูกราฟ</p>
          </div>
        </div>
        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-muted-bg/60 border border-border/50 text-muted">
          {watchlist.length} หุ้น
        </span>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden pr-1.5 -mr-1.5 space-y-2 custom-scrollbar flex flex-col">
        {/* Loading State */}
        {(isWatchlistLoading || isLoading) && (
          <div className="space-y-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted-bg/30 animate-pulse border border-border/20">
                <div className="w-8 h-8 rounded-lg skeleton-shimmer flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="w-16 h-3 skeleton-shimmer rounded" />
                  <div className="w-24 h-2.5 skeleton-shimmer rounded opacity-60" />
                </div>
                <div className="w-14 h-6 skeleton-shimmer rounded-lg" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isWatchlistLoading && !isLoading && watchlist.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-5 my-auto">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-3 shadow-xs">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <p className="text-sm font-bold text-foreground">ยังไม่มีหุ้นใน Watchlist</p>
            <p className="text-xs text-muted mt-1 max-w-[200px]">
              กดติดตามหุ้นที่คุณสนใจเพื่อเข้าถึงกราฟราคาได้ทันที
            </p>
            <button
              onClick={() => router.push("/watchlist")}
              className="mt-4 px-3.5 py-1.5 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              + จัดการ Watchlist
            </button>
          </div>
        )}

        {/* Watchlist Items */}
        {!isWatchlistLoading && !isLoading && watchlist.length > 0 && (
          <div className="space-y-1.5 pb-2">
            {watchlist.map((item) => {
              const quote = quotes[item.symbol];
              const changePct = quote?.regularMarketChangePercent || 0;
              const isPositive = changePct >= 0;
              const isActive = currentSymbol === item.symbol.toUpperCase();

              return (
                <div
                  key={item.symbol}
                  onClick={() => router.push(`/?symbol=${item.symbol}`)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl border cursor-pointer transition-all duration-200 ease-out group",
                    isActive
                      ? "bg-accent/10 border-accent/40 shadow-sm shadow-accent/10"
                      : "bg-muted-bg/25 border-border/30 hover:bg-card-hover/90 hover:border-accent/30 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
                  )}
                >
                  <CompanyLogo
                    symbol={item.symbol}
                    name={item.name}
                    size="sm"
                    className="rounded-lg flex-shrink-0 group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={cn(
                        "text-xs font-bold font-mono transition-colors",
                        isActive ? "text-accent" : "text-foreground group-hover:text-accent"
                      )}>
                        {item.symbol}
                      </p>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted truncate max-w-[110px] font-medium">{item.name}</p>
                  </div>
                  
                  {quote ? (
                    <div className="text-right flex flex-col items-end">
                      <p className="text-xs font-bold font-mono text-foreground tabular-nums">
                        {formatCurrency(quote.regularMarketPrice)}
                      </p>
                      <span className={cn(
                        "text-[10px] font-bold font-mono px-1.5 py-0.2 rounded-md inline-flex items-center gap-0.5 mt-0.5 border tabular-nums",
                        isPositive 
                          ? "bg-profit/10 text-profit border-profit/20" 
                          : "bg-loss/10 text-loss border-loss/20"
                      )}>
                        <span>{isPositive ? "▲" : "▼"}</span>
                        <span>{formatPercent(changePct)}</span>
                      </span>
                    </div>
                  ) : (
                    <div className="w-14 h-6 skeleton-shimmer rounded-md" />
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

