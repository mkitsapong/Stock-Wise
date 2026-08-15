"use client";

import { useEffect, useState, FormEvent } from "react";
import WatchlistRow from "@/components/watchlist/WatchlistRow";
import { useWatchlist } from "@/context/WatchlistContext";

export default function WatchlistPage() {
  const { watchlist, addToWatchlist } = useWatchlist();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newSymbol, setNewSymbol] = useState("");

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
        const res = await fetch(`/api/quotes?symbols=${encodeURIComponent(symbols)}`);
        const data = await res.json();
        
        // Match the API response to the WatchlistItems
        const sparkData = data.spark?.result || [];
        
        const mappedQuotes = watchlist.map((item) => {
          const sparkInfo = sparkData.find((s: any) => s.symbol === item.symbol);
          let currentPrice = 0;
          let prevClose = 0;
          let sparklineData: number[] = [];
          let name = item.name;

          if (sparkInfo && sparkInfo.response && sparkInfo.response[0]) {
            const meta = sparkInfo.response[0].meta;
            const indicators = sparkInfo.response[0].indicators;
            currentPrice = meta.regularMarketPrice || 0;
            prevClose = meta.chartPreviousClose || currentPrice;
            sparklineData = indicators?.quote?.[0]?.close || [];
            
            // Clean up nulls in sparkline data
            sparklineData = sparklineData.filter((p: number | null) => p !== null) as number[];

            // Update name from Yahoo if not set
            if (!name || name === "Unknown Company" || name === "") {
               name = meta.shortName || meta.longName || item.symbol;
            }
          }

          const dayChange = currentPrice - prevClose;
          const dayChangePercent = prevClose > 0 ? (dayChange / prevClose) * 100 : 0;

          return {
            ...item,
            name,
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

  return (
    <div className="space-y-6">
      {/* Page Header & Add Form */}
      <div className="animate-fade-in-up opacity-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Watchlist
          </h1>
          <p className="text-sm text-muted mt-1">
            Tracking {watchlist.length} stocks · Monitor target buy prices
          </p>
        </div>
        
        <form onSubmit={handleAddSymbol} className="flex items-center gap-2">
          <div className="relative">
             <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
             <input 
               type="text" 
               placeholder="Add symbol (e.g. AAPL)..." 
               className="pl-9 pr-4 py-2 bg-card-bg border border-border rounded-lg text-sm font-medium text-foreground outline-none focus:border-accent w-[200px]"
               value={newSymbol}
               onChange={e => setNewSymbol(e.target.value)}
             />
          </div>
          <button type="submit" className="px-4 py-2 bg-accent/10 text-accent font-semibold text-sm rounded-lg hover:bg-accent hover:text-white transition-colors" disabled={!newSymbol.trim()}>
            Add
          </button>
        </form>
      </div>

      {watchlist.length === 0 && (
        <div className="glass-card p-12 text-center flex flex-col items-center justify-center border-dashed animate-fade-in-up opacity-0 stagger-1">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-muted mb-4 opacity-50">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <h3 className="text-lg font-bold text-foreground mb-1">Your Watchlist is Empty</h3>
          <p className="text-sm text-muted max-w-sm">
            Type a stock symbol above and click Add to start tracking.
          </p>
        </div>
      )}

      {/* Table */}
      {quotes.length > 0 && (
        <div className="glass-card overflow-hidden animate-fade-in-up opacity-0 stagger-1">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/50 text-xs uppercase tracking-wider text-muted font-semibold bg-white/[0.01]">
                  <th className="py-3 px-4 font-medium">Asset</th>
                  <th className="py-3 px-4 font-medium">7D Trend</th>
                  <th className="py-3 px-4 font-medium text-right">Price</th>
                  <th className="py-3 px-4 font-medium">Target</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((item, index) => (
                  <WatchlistRow key={item.symbol} item={item} index={index} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {isLoading && quotes.length === 0 && watchlist.length > 0 && (
        <div className="text-center py-10">
           <p className="text-muted animate-pulse">Loading prices...</p>
        </div>
      )}
    </div>
  );
}
