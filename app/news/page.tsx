"use client";

import { useEffect, useState } from "react";
import { useTransactions } from "@/context/TransactionContext";
import { useWatchlist } from "@/context/WatchlistContext";
import CompanyLogo from "@/components/common/CompanyLogo";

type NewsFilter = "ALL" | "PORTFOLIO" | "WATCHLIST";

interface NewsItem {
  uuid: string;
  title: string;
  link: string;
  publisher: string;
  providerPublishTime?: number;
  symbol: string;
  symbolName?: string;
  source: "PORTFOLIO" | "WATCHLIST";
  sentiment?: "GOOD" | "BAD" | "NEUTRAL";
}

const GOOD_KW = ["upgrade", "surge", "jump", "gain", "beat", "buy", "soar", "outperform", "bullish", "record", "rally", "higher", "profit"];
const BAD_KW = ["downgrade", "miss", "drop", "sell", "lawsuit", "plunge", "fall", "bearish", "risk", "cut", "lower", "loss"];

function getSentiment(title: string): "GOOD" | "BAD" | "NEUTRAL" {
  const t = title.toLowerCase();
  if (BAD_KW.some((k) => t.includes(k))) return "BAD";
  if (GOOD_KW.some((k) => t.includes(k))) return "GOOD";
  return "NEUTRAL";
}

export default function NewsPage() {
  const { allHoldings } = useTransactions();
  const { watchlist } = useWatchlist();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<NewsFilter>("ALL");
  const [sentimentFilter, setSentimentFilter] = useState<"ALL" | "GOOD" | "BAD" | "NEUTRAL">("ALL");

  const portfolioSymbols = allHoldings.map((h) => ({ symbol: h.symbol, name: h.name, source: "PORTFOLIO" as const }));
  const watchlistOnlySymbols = watchlist
    .filter((w) => !allHoldings.some((h) => h.symbol === w.symbol))
    .map((w) => ({ symbol: w.symbol, name: w.name, source: "WATCHLIST" as const }));

  const allSymbols = [...portfolioSymbols, ...watchlistOnlySymbols];

  useEffect(() => {
    if (allSymbols.length === 0) return;

    setIsLoading(true);
    const fetches = allSymbols.map(async ({ symbol, name, source }) => {
      try {
        const res = await fetch(`/api/insights?symbol=${encodeURIComponent(symbol)}`);
        if (!res.ok) return [];
        const data = await res.json();
        return (data.news || []).slice(0, 5).map((item: any) => ({
          ...item,
          symbol,
          symbolName: name || symbol,
          source,
          sentiment: getSentiment(item.title),
        }));
      } catch {
        return [];
      }
    });

    Promise.all(fetches).then((results) => {
      // Flatten, deduplicate by uuid, sort by time
      const all: NewsItem[] = results.flat();
      const seen = new Set<string>();
      const unique = all.filter((n) => {
        if (seen.has(n.uuid)) return false;
        seen.add(n.uuid);
        return true;
      });
      unique.sort((a, b) => (b.providerPublishTime || 0) - (a.providerPublishTime || 0));
      setNews(unique);
      setIsLoading(false);
    });
  }, [allHoldings.length, watchlist.length]);

  const filtered = news
    .filter((n) => filter === "ALL" || n.source === filter)
    .filter((n) => sentimentFilter === "ALL" || n.sentiment === sentimentFilter);

  const portfolioCount = news.filter((n) => n.source === "PORTFOLIO").length;
  const watchlistCount = news.filter((n) => n.source === "WATCHLIST").length;

  function timeAgo(ts?: number) {
    if (!ts) return "";
    const diff = Math.floor((Date.now() - ts * 1000) / 60000);
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  }

  // Sentiment statistics
  const bullishCount = news.filter((n) => n.sentiment === "GOOD").length;
  const bearishCount = news.filter((n) => n.sentiment === "BAD").length;
  const neutralCount = news.filter((n) => n.sentiment === "NEUTRAL").length;
  const bullishPercent = news.length > 0 ? Math.round((bullishCount / news.length) * 100) : 0;
  const bearishPercent = news.length > 0 ? Math.round((bearishCount / news.length) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* 🌟 1. Standardized Page Header */}
      <div className="animate-fade-in-up opacity-0 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight gradient-text inline-block">
              Market News
            </h1>
            <span className="px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent font-mono text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shrink-0" />
              <span>{news.length} Articles</span>
            </span>
          </div>
          <p className="text-sm text-muted mt-1 font-medium">
            Curated financial headlines & automated sentiment signal analysis for your active assets
          </p>
        </div>

        <div className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-card-bg border border-border/80 text-muted shadow-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-profit animate-pulse" />
          <span>Tracking {allSymbols.length} portfolio & watchlist symbols</span>
        </div>
      </div>

      {/* 🌟 2. Hero KPI Sentiment & Coverage Cards (Matching Dashboard Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Monitored Intelligence */}
        <div className="p-5 rounded-2xl animate-fade-in-up opacity-0 relative overflow-hidden transition-all duration-300 group bg-gradient-to-br from-accent/15 via-card-bg to-purple-500/10 border border-accent/30 shadow-[0_4px_24px_rgba(99,102,241,0.12)] hover:border-accent/50 stagger-1">
          <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-[40px] pointer-events-none bg-accent/25 opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">
              Market Intelligence Feed
            </span>
            <span className="p-2 rounded-xl border bg-accent/10 text-accent border-accent/20 group-hover:scale-105 transition-transform">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
                <path d="M18 14h-8" />
                <path d="M15 18h-5" />
                <path d="M10 6h8v4h-8V6Z" />
              </svg>
            </span>
          </div>
          <div className="relative z-10">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight tabular-nums text-foreground flex items-baseline gap-2">
              <span>{news.length}</span>
              <span className="text-sm font-sans font-medium text-muted">Headlines Cached</span>
            </div>
          </div>
          <div className="relative z-10 mt-1.5 flex items-center gap-1.5 text-xs text-muted">
            <span>{portfolioCount} Portfolio · {watchlistCount} Watchlist</span>
          </div>
        </div>

        {/* Card 2: Bullish Momentum */}
        <div className="glass-card p-5 rounded-2xl animate-fade-in-up opacity-0 relative overflow-hidden transition-all duration-300 group hover:border-border/80 stagger-2">
          <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-[40px] pointer-events-none bg-profit/20 opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Bullish News Bias
            </span>
            <span className="p-2 rounded-xl border bg-profit/10 text-profit border-profit/20 group-hover:scale-105 transition-transform">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </span>
          </div>
          <div className="relative z-10 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight tabular-nums text-profit">
              {bullishPercent}%
            </span>
            <span className="text-sm font-sans font-semibold text-muted">Positive Signal</span>
          </div>
          <div className="relative z-10 mt-1.5 flex items-center gap-1.5 text-xs text-muted">
            <span className="font-mono font-bold text-profit">{bullishCount}</span> articles with bullish keywords
          </div>
        </div>

        {/* Card 3: Bearish & Risk Signals */}
        <div className="glass-card p-5 rounded-2xl animate-fade-in-up opacity-0 relative overflow-hidden transition-all duration-300 group hover:border-border/80 stagger-3">
          <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-[40px] pointer-events-none bg-loss/15 opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Risk & Bearish Bias
            </span>
            <span className="p-2 rounded-xl border bg-loss/10 text-loss border-loss/20 group-hover:scale-105 transition-transform">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                <polyline points="17 18 23 18 23 12" />
              </svg>
            </span>
          </div>
          <div className="relative z-10 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight tabular-nums text-loss">
              {bearishPercent}%
            </span>
            <span className="text-sm font-sans font-semibold text-muted">Cautious Bias</span>
          </div>
          <div className="relative z-10 mt-1.5 flex items-center gap-1.5 text-xs text-muted">
            <span>{bearishCount} bearish · {neutralCount} neutral articles</span>
          </div>
        </div>
      </div>

      {/* 🌟 3. Filter Bar (Segmented Controls) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in-up opacity-0 stagger-1">
        {/* Source filter */}
        <div className="flex items-center gap-1 p-1 bg-card-bg/90 backdrop-blur-md border border-border/80 rounded-2xl shadow-sm overflow-x-auto scrollbar-none max-w-full shrink-0">
          {(["ALL", "PORTFOLIO", "WATCHLIST"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer shrink-0 whitespace-nowrap ${
                filter === f
                  ? "bg-accent text-white shadow-md shadow-accent/25 scale-[1.02]"
                  : "text-muted hover:text-foreground hover:bg-white/5"
              }`}
            >
              {f === "ALL" ? `All (${news.length})` : f === "PORTFOLIO" ? `Portfolio (${portfolioCount})` : `Watchlist (${watchlistCount})`}
            </button>
          ))}
        </div>

        {/* Sentiment filter */}
        <div className="flex items-center gap-1 p-1 bg-card-bg/90 backdrop-blur-md border border-border/80 rounded-2xl shadow-sm overflow-x-auto scrollbar-none max-w-full">
          {([
            { key: "ALL", label: "All Sentiment", color: "" },
            { key: "GOOD", label: "🟢 Bullish", color: "text-profit" },
            { key: "BAD", label: "🔴 Bearish", color: "text-loss" },
            { key: "NEUTRAL", label: "⚪ Neutral", color: "text-muted" },
          ] as const).map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setSentimentFilter(key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer shrink-0 whitespace-nowrap ${
                sentimentFilter === key
                  ? "bg-accent text-white shadow-md shadow-accent/25 scale-[1.02]"
                  : `${color} hover:text-foreground hover:bg-white/5`
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {allSymbols.length === 0 && (
        <div className="glass-card p-12 text-center flex flex-col items-center gap-4 border-dashed animate-fade-in-up opacity-0 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-accent/10 rounded-full blur-[50px] pointer-events-none" />
          <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shadow-lg shadow-accent/10">
            <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l6 6v8a2 2 0 01-2 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 13h6M9 17h4" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground mb-1">No Assets Tracked Yet</h3>
            <p className="text-sm text-muted max-w-sm">Add stocks to your Portfolio or Watchlist to automatically fetch live financial news and AI sentiment signals.</p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-fade-in-up">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card p-5 space-y-3">
              <div className="flex gap-2 items-center">
                <div className="w-8 h-8 rounded-lg skeleton-shimmer" />
                <div className="w-16 h-3 skeleton-shimmer rounded" />
              </div>
              <div className="w-full h-4 skeleton-shimmer rounded" />
              <div className="w-4/5 h-4 skeleton-shimmer rounded" />
              <div className="w-24 h-3 skeleton-shimmer rounded" />
            </div>
          ))}
        </div>
      )}

      {/* News Grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-fade-in-up opacity-0 stagger-2">
          {filtered.map((item) => (
            <a
              key={item.uuid}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card p-5 flex flex-col gap-3 hover:border-accent/40 transition-all duration-300 group hover:shadow-xl hover:shadow-accent/5 hover:-translate-y-1 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-bl-full blur-2xl pointer-events-none group-hover:bg-accent/15 transition-all" />

              {/* Symbol Tag + Sentiment */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <CompanyLogo symbol={item.symbol} size="sm" className="rounded-lg" />
                  <div>
                    <span className="text-xs font-bold text-accent font-mono">{item.symbol}</span>
                    <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-md font-mono font-bold uppercase border ${
                      item.source === "PORTFOLIO"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    }`}>
                      {item.source === "PORTFOLIO" ? "Portfolio" : "Watchlist"}
                    </span>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                  item.sentiment === "GOOD"
                    ? "bg-profit/10 text-profit border-profit/20"
                    : item.sentiment === "BAD"
                    ? "bg-loss/10 text-loss border-loss/20"
                    : "bg-muted-bg text-muted border-border/60"
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {item.sentiment === "GOOD" ? "Bullish" : item.sentiment === "BAD" ? "Bearish" : "Neutral"}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-sm font-semibold text-foreground leading-snug group-hover:text-accent transition-colors line-clamp-3 relative z-10">
                {item.title}
              </h3>

              {/* Footer */}
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/40 relative z-10">
                <span className="text-[11px] text-muted font-medium truncate max-w-[65%]">{item.publisher}</span>
                <span className="text-[10px] font-mono text-muted/80">{timeAgo(item.providerPublishTime)}</span>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* No Results */}
      {!isLoading && allSymbols.length > 0 && filtered.length === 0 && (
        <div className="glass-card p-12 text-center text-muted animate-fade-in-up">
          <p className="text-sm font-medium">No news articles match the selected source or sentiment filters.</p>
        </div>
      )}
    </div>
  );
}
