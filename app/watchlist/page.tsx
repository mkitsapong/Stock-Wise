"use client";

import { useEffect, useState, FormEvent } from "react";
import WatchlistRow from "@/components/watchlist/WatchlistRow";
import AddTransactionModal from "@/components/transactions/AddTransactionModal";
import { useWatchlist } from "@/context/WatchlistContext";
import { cn } from "@/lib/utils";

export default function WatchlistPage() {
  const { watchlist, addToWatchlist } = useWatchlist();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newSymbol, setNewSymbol] = useState("");

  // 🚀 Quick Trade Modal State
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [selectedPrice, setSelectedPrice] = useState<number | undefined>(undefined);
  const [selectedName, setSelectedName] = useState("");

  const handleQuickBuy = (symbol: string, price: number, name?: string) => {
    setSelectedSymbol(symbol);
    setSelectedPrice(price);
    setSelectedName(name || "");
    setTradeModalOpen(true);
  };

  const handleAddSymbol = (e: FormEvent) => {
    e.preventDefault();
    if (newSymbol.trim()) {
      addToWatchlist(newSymbol.trim().toUpperCase(), "");
      setNewSymbol("");
    }
  };

  useEffect(() => {
    async function fetchWatchlistQuotes() {
      if (watchlist.length === 0) {
        setQuotes([]);
        return;
      }

      setIsLoading(true);
      try {
        const symbols = watchlist.map((item) => item.symbol).join(",");
        const res = await fetch(`/api/quotes?symbols=${encodeURIComponent(symbols)}&range=7d&interval=1d`);
        const data = await res.json();
        
        // Match the API response to the WatchlistItems
        const sparkData = data.spark?.result || [];
        
        const mappedQuotes = watchlist.map((item) => {
          const symUpper = item.symbol.toUpperCase();
          const sparkInfo = sparkData.find(
            (s: any) => s.symbol?.toUpperCase() === symUpper
          );

          let currentPrice = 0;
          let prevClose = 0;
          let sparklineData: number[] = [];
          let name = item.name;

          if (sparkInfo && sparkInfo.response && sparkInfo.response[0]) {
            const meta = sparkInfo.response[0].meta;
            const indicators = sparkInfo.response[0].indicators;
            sparklineData = indicators?.quote?.[0]?.close || [];
            
            // Clean up nulls in sparkline data
            sparklineData = sparklineData.filter((p: number | null) => p !== null && !isNaN(p)) as number[];

            currentPrice = meta.regularMarketPrice || (sparklineData.length > 0 ? sparklineData[sparklineData.length - 1] : 0);
            
            // Calculate previous daily close (yesterday's close)
            // In 7-day daily data, the last item is today's price and the item before it is yesterday's close
            if (sparklineData.length >= 2) {
              prevClose = sparklineData[sparklineData.length - 2];
            } else {
              prevClose = meta.previousClose || meta.chartPreviousClose || currentPrice;
            }

            // Update name from Yahoo if not set
            if (!name || name === "Unknown Company" || name === "" || name === item.symbol) {
              name = meta.shortName || meta.longName || item.symbol;
            }
          }

          // Fallback if price was already known in previous quotes
          if (currentPrice === 0) {
            const prevQuote = quotes.find((q) => q.symbol?.toUpperCase() === symUpper);
            if (prevQuote && prevQuote.currentPrice > 0) {
              currentPrice = prevQuote.currentPrice;
              prevClose = prevQuote.currentPrice - (prevQuote.dayChange || 0);
              sparklineData = prevQuote.sparklineData || [];
              name = name || prevQuote.name;
            }
          }

          const dayChange = currentPrice - prevClose;
          const dayChangePercent = prevClose > 0 ? (dayChange / prevClose) * 100 : 0;

          return {
            ...item,
            name: name || item.symbol,
            currentPrice,
            dayChange,
            dayChangePercent,
            sparklineData,
          };
        });

        setQuotes(mappedQuotes);
      } catch (err) {
        console.error("Failed to fetch watchlist quotes", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchWatchlistQuotes();
    // Set an interval to refresh every 30 seconds
    const interval = setInterval(fetchWatchlistQuotes, 30000);
    return () => clearInterval(interval);
  }, [watchlist]);

  const targetSetCount = watchlist.filter(w => w.targetBuyPrice !== null && w.targetBuyPrice > 0).length;

  // Calculate top mover and target hits
  const { topMover, targetsHitCount } = quotes.reduce(
    (acc, q) => {
      if (q.dayChangePercent !== undefined) {
        if (!acc.topMover || q.dayChangePercent > (acc.topMover.dayChangePercent || -Infinity)) {
          acc.topMover = q;
        }
      }
      if (q.targetBuyPrice && q.currentPrice && q.currentPrice <= q.targetBuyPrice) {
        acc.targetsHitCount++;
      }
      return acc;
    },
    { topMover: null as any, targetsHitCount: 0 }
  );

  return (
    <div className="space-y-6 pb-12">
      {/* 🌟 1. Standardized Page Header & Add Form */}
      <div className="animate-fade-in-up opacity-0 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight gradient-text inline-block">
              Watchlist
            </h1>
            <span className="px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent font-mono text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shrink-0" />
              <span>{watchlist.length} {watchlist.length === 1 ? "Asset" : "Assets"}</span>
            </span>
          </div>
          <p className="text-sm text-muted mt-1 font-medium">
            Live quotes, 7-day sparkline momentum & automated buy price target alerts
          </p>
        </div>
        
        {/* Quick Add Form */}
        <form onSubmit={handleAddSymbol} className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
             <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <circle cx="11" cy="11" r="8" />
               <line x1="21" y1="21" x2="16.65" y2="16.65" />
             </svg>
             <input 
               type="text" 
               placeholder="Add ticker (e.g. NVDA, PTT.BK)..." 
               className="pl-9 pr-3 py-2.5 bg-card-bg border border-border/80 rounded-xl text-sm font-medium text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 w-full sm:w-[220px] md:w-[260px] transition-all shadow-sm"
               value={newSymbol}
               onChange={e => setNewSymbol(e.target.value)}
             />
          </div>
          <button 
            type="submit" 
            className="btn-shine-sweep px-4 py-2.5 bg-gradient-to-r from-accent to-purple-500 hover:from-accent/90 hover:to-purple-500/90 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-accent/25 hover:shadow-accent/40 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0" 
            disabled={!newSymbol.trim()}
          >
            + Add
          </button>
        </form>
      </div>

      {/* 🌟 2. Hero KPI Cards Grid (Matching Dashboard Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Tracked Assets */}
        <div className="p-5 rounded-2xl animate-fade-in-up opacity-0 relative overflow-hidden transition-all duration-300 group bg-gradient-to-br from-accent/15 via-card-bg to-purple-500/10 border border-accent/30 shadow-[0_4px_24px_rgba(99,102,241,0.12)] hover:border-accent/50 stagger-1">
          <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-[40px] pointer-events-none bg-accent/25 opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">
              Monitored Securities
            </span>
            <span className="p-2 rounded-xl border bg-accent/10 text-accent border-accent/20 group-hover:scale-105 transition-transform">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </span>
          </div>
          <div className="relative z-10">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight tabular-nums text-foreground flex items-baseline gap-2">
              <span>{watchlist.length}</span>
              <span className="text-sm font-sans font-medium text-muted">Stocks & ETFs</span>
            </div>
          </div>
          <div className="relative z-10 mt-1.5 flex items-center gap-1.5 text-xs text-muted">
            <span className="font-mono font-bold text-accent">{targetSetCount}</span> active buy targets set
          </div>
        </div>

        {/* Card 2: Top 24h Performer */}
        <div className="glass-card p-5 rounded-2xl animate-fade-in-up opacity-0 relative overflow-hidden transition-all duration-300 group hover:border-border/80 stagger-2">
          <div className={cn(
            "absolute -top-12 -right-12 w-28 h-28 rounded-full blur-[40px] pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity",
            topMover && topMover.dayChangePercent >= 0 ? "bg-profit/20" : "bg-loss/20"
          )} />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Top 24h Momentum
            </span>
            <span className={cn(
              "p-2 rounded-xl border group-hover:scale-105 transition-transform",
              topMover && topMover.dayChangePercent >= 0
                ? "bg-profit/10 text-profit border-profit/20"
                : "bg-loss/10 text-loss border-loss/20"
            )}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </span>
          </div>
          <div className="relative z-10">
            {topMover ? (
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-extrabold font-mono text-foreground">
                  {topMover.symbol}
                </span>
                <span className={cn(
                  "text-lg sm:text-xl font-bold font-mono tabular-nums",
                  topMover.dayChangePercent >= 0 ? "text-profit" : "text-loss"
                )}>
                  {topMover.dayChangePercent >= 0 ? "+" : ""}{topMover.dayChangePercent?.toFixed(2)}%
                </span>
              </div>
            ) : (
              <div className="text-2xl font-bold font-mono text-muted">—</div>
            )}
          </div>
          <div className="relative z-10 mt-1.5 flex items-center justify-between text-xs text-muted truncate">
            <span>{topMover ? topMover.name || "Leader of watchlist" : "Add symbols to see movers"}</span>
          </div>
        </div>

        {/* Card 3: Target Alerts & Opportunities */}
        <div className="glass-card p-5 rounded-2xl animate-fade-in-up opacity-0 relative overflow-hidden transition-all duration-300 group hover:border-border/80 stagger-3">
          <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-[40px] pointer-events-none bg-emerald-500/15 opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Buy Target Opportunities
            </span>
            <span className="p-2 rounded-xl border bg-emerald-500/10 text-emerald-500 border-emerald-500/20 group-hover:scale-105 transition-transform">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </span>
          </div>
          <div className="relative z-10">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight tabular-nums text-foreground flex items-baseline gap-2">
              <span className={targetsHitCount > 0 ? "text-emerald-400" : "text-foreground"}>
                {targetsHitCount}
              </span>
              <span className="text-sm font-sans font-medium text-muted">At or Below Target</span>
            </div>
          </div>
          <div className="relative z-10 mt-1.5 flex items-center gap-1.5 text-xs text-muted">
            <span className={cn(
              "px-1.5 py-0.2 rounded text-[10px] font-mono font-bold uppercase border",
              targetsHitCount > 0
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-muted-bg text-muted border-border/60"
            )}>
              {targetsHitCount > 0 ? "Action Recommended" : "Within Normal Range"}
            </span>
          </div>
        </div>
      </div>

      {watchlist.length === 0 && (
        <div className="glass-card p-12 text-center flex flex-col items-center justify-center border-dashed animate-fade-in-up opacity-0 stagger-1 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-accent/10 rounded-full blur-[50px] pointer-events-none" />
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-4 border border-accent/20 shadow-lg shadow-accent/10">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-foreground mb-1">Your Watchlist is Empty</h3>
          <p className="text-sm text-muted max-w-sm">
            Enter a stock symbol like <span className="font-mono text-accent font-semibold">AAPL</span>, <span className="font-mono text-accent font-semibold">NVDA</span>, or <span className="font-mono text-accent font-semibold">PTT.BK</span> in the input above to monitor prices and trends in real time.
          </p>
        </div>
      )}

      {/* Table */}
      {quotes.length > 0 && (
        <div className="glass-card overflow-hidden animate-fade-in-up opacity-0 stagger-1 relative">
          <div className="absolute top-0 right-0 w-64 h-32 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-[11px] uppercase tracking-wider text-muted font-semibold bg-muted-bg/30">
                  <th className="py-3 px-4">Asset</th>
                  <th className="py-3 px-4">7D Trend</th>
                  <th className="py-3 px-4 text-right">Price</th>
                  <th className="py-3 px-4">Target Buy Price</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((item, index) => (
                  <WatchlistRow
                    key={item.symbol}
                    item={item}
                    index={index}
                    onQuickBuy={handleQuickBuy}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Loading Skeleton */}
      {isLoading && quotes.length === 0 && watchlist.length > 0 && (
        <div className="glass-card overflow-hidden p-4 space-y-3 animate-fade-in-up">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-border/40 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl skeleton-shimmer shrink-0" />
                <div className="space-y-1.5">
                  <div className="w-16 h-4 skeleton-shimmer rounded" />
                  <div className="w-24 h-3 skeleton-shimmer rounded" />
                </div>
              </div>
              <div className="w-24 h-8 skeleton-shimmer rounded-lg" />
              <div className="w-20 h-4 skeleton-shimmer rounded text-right" />
              <div className="w-32 h-6 skeleton-shimmer rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {/* 🚀 Quick Add Transaction Modal */}
      <AddTransactionModal
        isOpen={tradeModalOpen}
        onClose={() => setTradeModalOpen(false)}
        initialSymbol={selectedSymbol}
        initialPrice={selectedPrice}
        initialName={selectedName}
        initialType="BUY"
      />
    </div>
  );
}

