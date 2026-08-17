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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in-up opacity-0 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            News Feed
          </h1>
          <p className="text-sm text-muted mt-1">
            ข่าวเฉพาะหุ้นที่อยู่ใน Portfolio และ Watchlist ของคุณ
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-accent/10 text-accent border border-accent/20">
          {allSymbols.length} symbols · {news.length} articles
        </span>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2 animate-fade-in-up opacity-0 stagger-1">
        {/* Source filter */}
        <div className="flex items-center gap-1 p-1 bg-card-bg border border-border/60 rounded-xl">
          {(["ALL", "PORTFOLIO", "WATCHLIST"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filter === f ? "bg-accent text-white shadow-sm" : "text-muted hover:text-foreground"
              }`}
            >
              {f === "ALL" ? `All (${news.length})` : f === "PORTFOLIO" ? `Portfolio (${portfolioCount})` : `Watchlist (${watchlistCount})`}
            </button>
          ))}
        </div>

        {/* Sentiment filter */}
        <div className="flex items-center gap-1 p-1 bg-card-bg border border-border/60 rounded-xl">
          {([
            { key: "ALL", label: "All Sentiment", color: "" },
            { key: "GOOD", label: "🟢 Bullish", color: "text-profit" },
            { key: "BAD", label: "🔴 Bearish", color: "text-loss" },
            { key: "NEUTRAL", label: "⚪ Neutral", color: "text-muted" },
          ] as const).map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setSentimentFilter(key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                sentimentFilter === key ? "bg-accent text-white shadow-sm" : `${color} hover:text-foreground`
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {allSymbols.length === 0 && (
        <div className="glass-card p-12 text-center flex flex-col items-center gap-4 border-dashed">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l6 6v8a2 2 0 01-2 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 13h6M9 17h4" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-foreground">ยังไม่มีหุ้นในพอร์ต</h3>
            <p className="text-sm text-muted mt-1">เพิ่มหุ้นใน Portfolio หรือ Watchlist ก่อนเพื่อดูข่าว</p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card p-5 space-y-3 animate-pulse">
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <a
              key={item.uuid}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card p-5 flex flex-col gap-3 hover:border-accent/40 transition-all duration-200 group hover:shadow-lg hover:shadow-accent/5 hover:-translate-y-0.5"
            >
              {/* Symbol Tag + Sentiment */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CompanyLogo symbol={item.symbol} size="sm" className="rounded-lg" />
                  <div>
                    <span className="text-xs font-bold text-accent font-mono">{item.symbol}</span>
                    <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                      item.source === "PORTFOLIO"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    }`}>
                      {item.source === "PORTFOLIO" ? "Portfolio" : "Watchlist"}
                    </span>
                  </div>
                </div>
                <span className={`text-sm ${
                  item.sentiment === "GOOD" ? "text-profit" : item.sentiment === "BAD" ? "text-loss" : "text-muted"
                }`}>
                  {item.sentiment === "GOOD" ? "🟢" : item.sentiment === "BAD" ? "🔴" : "⚪"}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-sm font-semibold text-foreground leading-snug group-hover:text-accent transition-colors line-clamp-3">
                {item.title}
              </h3>

              {/* Footer */}
              <div className="flex items-center justify-between mt-auto pt-1">
                <span className="text-[10px] text-muted truncate max-w-[70%]">{item.publisher}</span>
                <span className="text-[10px] text-muted/60">{timeAgo(item.providerPublishTime)}</span>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* No Results */}
      {!isLoading && allSymbols.length > 0 && filtered.length === 0 && (
        <div className="glass-card p-10 text-center text-muted">
          <p className="text-sm">ไม่พบข่าวสำหรับ filter ที่เลือก</p>
        </div>
      )}
    </div>
  );
}
