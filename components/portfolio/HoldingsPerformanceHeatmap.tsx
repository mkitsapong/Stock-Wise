"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { usePortfolioQuotes } from "@/hooks/usePortfolioQuotes";
import { useCurrency } from "@/context/CurrencyContext";
import {
  calculateSquarifiedTreemap,
  HeatmapTimeframe,
  HeatmapSizeMetric,
  HeatmapItem,
} from "@/lib/holdings-performance";
import { formatPercent, cn } from "@/lib/utils";
import CompanyLogo from "@/components/common/CompanyLogo";

interface Props {
  className?: string;
  showCardWrapper?: boolean;
}

type ListSortMode = "RETURN_DESC" | "RETURN_ASC" | "VALUE_DESC" | "NAME_ASC";

export default function HoldingsPerformanceHeatmap({
  className,
  showCardWrapper = true,
}: Props) {
  const router = useRouter();
  const { holdings, isLoading } = usePortfolioQuotes();
  const { formatCurrency, formatSignedCurrency } = useCurrency();

  const [timeframe, setTimeframe] = useState<HeatmapTimeframe>("ALL");
  const [sizeMetric, setSizeMetric] = useState<HeatmapSizeMetric>("CURRENT_VALUE");
  const [viewMode, setViewMode] = useState<"HEATMAP" | "LIST">("HEATMAP");
  const [sortMode, setSortMode] = useState<ListSortMode>("RETURN_DESC");
  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredItem, setHoveredItem] = useState<HeatmapItem | null>(null);

  // Compute squarified layout
  const treemapItems = useMemo(
    () => calculateSquarifiedTreemap(holdings, sizeMetric, timeframe),
    [holdings, sizeMetric, timeframe]
  );

  const totalPortfolioValue = useMemo(
    () => treemapItems.reduce((sum, item) => sum + item.totalValue, 0),
    [treemapItems]
  );

  // Filter & Sort for List View
  const sortedListItems = useMemo(() => {
    let items = [...treemapItems];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (i) => i.symbol.toLowerCase().includes(q) || i.name.toLowerCase().includes(q)
      );
    }

    switch (sortMode) {
      case "RETURN_DESC":
        return items.sort((a, b) => b.returnPercent - a.returnPercent);
      case "RETURN_ASC":
        return items.sort((a, b) => a.returnPercent - b.returnPercent);
      case "VALUE_DESC":
        return items.sort((a, b) => b.totalValue - a.totalValue);
      case "NAME_ASC":
        return items.sort((a, b) => a.symbol.localeCompare(b.symbol));
      default:
        return items;
    }
  }, [treemapItems, sortMode, searchQuery]);

  const timeframes: { label: string; value: HeatmapTimeframe }[] = [
    { label: "1d", value: "1D" },
    { label: "7d", value: "7D" },
    { label: "1m", value: "1M" },
    { label: "3m", value: "3M" },
    { label: "6m", value: "6M" },
    { label: "YTD", value: "YTD" },
    { label: "1y", value: "1Y" },
    { label: "5y", value: "5Y" },
    { label: "all", value: "ALL" },
  ];

  const sizeOptions: { label: string; value: HeatmapSizeMetric }[] = [
    { label: "Current value", value: "CURRENT_VALUE" },
    { label: "Cost basis", value: "COST_BASIS" },
    { label: "Equal size", value: "EQUAL" },
  ];

  const sortOptions: { label: string; value: ListSortMode }[] = [
    { label: "Top Gainers (High → Low)", value: "RETURN_DESC" },
    { label: "Top Losers (Low → High)", value: "RETURN_ASC" },
    { label: "Position Size (Value)", value: "VALUE_DESC" },
    { label: "Symbol (A → Z)", value: "NAME_ASC" },
  ];

  const currentSizeLabel = sizeOptions.find((o) => o.value === sizeMetric)?.label || "Current value";
  const currentSortLabel = sortOptions.find((o) => o.value === sortMode)?.label || "Top Gainers";

  const content = (
    <div className={cn("space-y-4 select-none", className)}>
      
      {/* 1. Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Title + Info Tooltip */}
        <div className="flex items-center gap-1.5">
          <h3 className="text-lg font-bold text-foreground tracking-tight">
            Holdings performance
          </h3>
          <button
            type="button"
            className="text-muted/70 hover:text-foreground transition-colors p-0.5 rounded-full"
            title="Heatmap & Ranked list of all portfolio holdings sized by position weight and colored by return performance"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </button>
        </div>

        {/* Right Controls: Size Selector, View Mode, Options */}
        <div className="flex items-center gap-2">
          {/* Size Metric Dropdown (Heatmap View) */}
          {viewMode === "HEATMAP" ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsSizeDropdownOpen((prev) => !prev);
                  setIsSortDropdownOpen(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground bg-muted-bg/60 hover:bg-muted-bg border border-border/60 rounded-xl transition-all cursor-pointer"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
                <span>Size: <strong className="text-foreground">{currentSizeLabel}</strong></span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {isSizeDropdownOpen && (
                <div className="absolute right-0 mt-2 w-44 origin-top-right rounded-2xl border border-border/80 bg-card-bg/95 backdrop-blur-2xl py-1.5 shadow-2xl z-50 animate-fade-in-up">
                  {sizeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSizeMetric(opt.value);
                        setIsSizeDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-3.5 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer",
                        sizeMetric === opt.value
                          ? "bg-accent/15 text-accent font-bold"
                          : "text-muted hover:text-foreground hover:bg-muted-bg"
                      )}
                    >
                      <span>{opt.label}</span>
                      {sizeMetric === opt.value && <span>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Sort Metric Dropdown (List View) */
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsSortDropdownOpen((prev) => !prev);
                  setIsSizeDropdownOpen(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground bg-muted-bg/60 hover:bg-muted-bg border border-border/60 rounded-xl transition-all cursor-pointer"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                <span>Sort: <strong className="text-foreground">{currentSortLabel}</strong></span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {isSortDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 origin-top-right rounded-2xl border border-border/80 bg-card-bg/95 backdrop-blur-2xl py-1.5 shadow-2xl z-50 animate-fade-in-up">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSortMode(opt.value);
                        setIsSortDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-3.5 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer",
                        sortMode === opt.value
                          ? "bg-accent/15 text-accent font-bold"
                          : "text-muted hover:text-foreground hover:bg-muted-bg"
                      )}
                    >
                      <span>{opt.label}</span>
                      {sortMode === opt.value && <span>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* View Mode Toggle (Heatmap / List) */}
          <div className="flex items-center bg-muted-bg/60 p-0.5 rounded-xl border border-border/60">
            <button
              type="button"
              onClick={() => setViewMode("HEATMAP")}
              className={cn(
                "p-1.5 rounded-lg transition-all cursor-pointer",
                viewMode === "HEATMAP"
                  ? "bg-accent text-white shadow-md font-bold"
                  : "text-muted hover:text-foreground"
              )}
              title="Heatmap View"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("LIST")}
              className={cn(
                "p-1.5 rounded-lg transition-all cursor-pointer",
                viewMode === "LIST"
                  ? "bg-accent text-white shadow-md font-bold"
                  : "text-muted hover:text-foreground"
              )}
              title="List View"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
          </div>

          <button
            type="button"
            className="p-1.5 text-muted hover:text-foreground hover:bg-muted-bg/50 rounded-xl transition-all cursor-pointer"
            title="Options"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
          </button>
        </div>
      </div>

      {/* 2. Timeframe Bar and Color Gradient Legend Scale */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Timeframe Selectors */}
        <div className="flex items-center gap-1 bg-muted-bg/60 p-1 rounded-xl border border-border/50 overflow-x-auto scrollbar-none w-fit">
          {timeframes.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setTimeframe(tf.value)}
              className={cn(
                "px-2.5 py-1 text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer",
                timeframe === tf.value
                  ? "bg-accent/20 text-accent font-bold shadow-sm border border-accent/30"
                  : "text-muted hover:text-foreground"
              )}
            >
              {tf.label}
            </button>
          ))}
          <button
            type="button"
            className="p-1.5 text-muted hover:text-foreground rounded-lg transition-colors cursor-pointer"
            title="Custom Date Range"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </button>
        </div>

        {/* Color Gradient Scale Legend (Matching screenshot) */}
        <div className="flex items-center rounded-xl overflow-hidden text-[10px] font-mono font-bold text-white shadow-sm border border-border/50">
          <span className="px-2 py-0.5 bg-[#cc4f46]">-15%</span>
          <span className="px-2 py-0.5 bg-[#8c3b38]">-10%</span>
          <span className="px-2 py-0.5 bg-[#5c3333]">-5%</span>
          <span className="px-2 py-0.5 bg-[#26322d] text-muted">0%</span>
          <span className="px-2 py-0.5 bg-[#2f7553]">5%</span>
          <span className="px-2 py-0.5 bg-[#369365]">10%</span>
          <span className="px-2 py-0.5 bg-[#3ea874]">15%+</span>
        </div>
      </div>

      {/* 3. Heatmap Treemap View */}
      {viewMode === "HEATMAP" ? (
        <div className="relative w-full h-[420px] sm:h-[480px] rounded-2xl overflow-hidden border border-border/80 bg-card-bg/60 p-1 shadow-inner">
          {treemapItems.map((item) => {
            const isHovered = hoveredItem?.symbol === item.symbol;
            const isSmallTile = item.w < 14 || item.h < 14;
            const isTinyTile = item.w < 8 || item.h < 8;

            return (
              <div
                key={item.symbol}
                style={{
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  width: `${item.w}%`,
                  height: `${item.h}%`,
                  padding: "3px",
                }}
                className="absolute transition-all duration-300"
                onMouseEnter={() => setHoveredItem(item)}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => router.push(`/?symbol=${item.symbol}`)}
              >
                <div
                  style={{ backgroundColor: item.color }}
                  className={cn(
                    "w-full h-full rounded-xl flex flex-col items-center justify-center p-2 cursor-pointer transition-all duration-200 border relative overflow-hidden group shadow-md",
                    isHovered
                      ? "scale-[1.02] z-20 brightness-110 border-white/40 ring-2 ring-white/20 shadow-2xl"
                      : "border-black/20 hover:border-white/30"
                  )}
                >
                  {/* Symbol */}
                  <span
                    className={cn(
                      "font-black text-white font-mono tracking-tight leading-none drop-shadow-md group-hover:scale-105 transition-transform",
                      isTinyTile ? "text-[11px]" : isSmallTile ? "text-sm sm:text-base" : "text-lg sm:text-2xl"
                    )}
                  >
                    {item.symbol}
                  </span>

                  {/* Return Percentage */}
                  {!isTinyTile && (
                    <span
                      className={cn(
                        "font-mono font-bold text-white/95 mt-1 tracking-tight drop-shadow-sm",
                        isSmallTile ? "text-[10px]" : "text-xs sm:text-sm"
                      )}
                    >
                      {item.returnPercent >= 0 ? "+" : ""}
                      {item.returnPercent.toFixed(2)}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Hover Floating Details Tooltip */}
          {hoveredItem && (
            <div className="absolute bottom-4 left-4 z-40 glass-card !rounded-2xl p-4 shadow-2xl border border-border/80 min-w-[240px] animate-fade-in-up pointer-events-none backdrop-blur-2xl">
              <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
                <CompanyLogo symbol={hoveredItem.symbol} name={hoveredItem.name} size="sm" />
                <div>
                  <span className="font-bold text-foreground text-sm font-mono block leading-tight">
                    {hoveredItem.symbol}
                  </span>
                  <span className="text-xs text-muted truncate max-w-[170px] block">
                    {hoveredItem.name}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-muted font-sans">Market Value:</span>
                  <span className="font-bold text-foreground tabular-nums">
                    {formatCurrency(hoveredItem.totalValue)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted font-sans">Shares & Price:</span>
                  <span className="text-foreground tabular-nums">
                    {hoveredItem.shares} @ {formatCurrency(hoveredItem.currentPrice)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted font-sans">Return ({timeframe}):</span>
                  <span
                    className={cn(
                      "font-bold tabular-nums",
                      hoveredItem.returnPercent >= 0 ? "text-profit" : "text-loss"
                    )}
                  >
                    {hoveredItem.returnPercent >= 0 ? "+" : ""}
                    {hoveredItem.returnPercent.toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-border/40">
                  <span className="text-muted font-sans">Unrealized P/L:</span>
                  <span
                    className={cn(
                      "font-bold tabular-nums",
                      hoveredItem.unrealizedPL >= 0 ? "text-profit" : "text-loss"
                    )}
                  >
                    {formatSignedCurrency(hoveredItem.unrealizedPL)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {treemapItems.length === 0 && !isLoading && (
            <div className="h-full flex items-center justify-center text-muted text-xs">
              No holdings available in portfolio.
            </div>
          )}
        </div>
      ) : (
        /* 🌟 4. Premium Parqet-Style Ranked Performance List View */
        <div className="space-y-3">
          {sortedListItems.map((item, idx) => {
            const weightPercent = totalPortfolioValue > 0 ? (item.totalValue / totalPortfolioValue) * 100 : 0;
            const isPos = item.returnPercent >= 0;

            return (
              <div
                key={item.symbol}
                onClick={() => router.push(`/?symbol=${item.symbol}`)}
                className="group p-4 rounded-2xl bg-card-bg/60 border border-border/60 hover:border-accent/40 hover:bg-card-bg/90 transition-all duration-200 cursor-pointer shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left Colored Performance Accent Bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1.5 transition-all group-hover:w-2"
                  style={{ backgroundColor: item.color }}
                />

                {/* Left: Rank, Logo, Symbol, Name & Weight */}
                <div className="flex items-center gap-3.5 pl-2">
                  <span className="font-mono text-xs font-bold text-muted/60 w-5">
                    #{idx + 1}
                  </span>

                  <CompanyLogo symbol={item.symbol} name={item.name} size="md" />

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-foreground text-sm sm:text-base group-hover:text-accent transition-colors">
                        {item.symbol}
                      </span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-muted-bg text-muted">
                        {weightPercent.toFixed(1)}% of Port
                      </span>
                    </div>
                    <span className="text-xs text-muted truncate max-w-[200px] block font-medium">
                      {item.name}
                    </span>
                  </div>
                </div>

                {/* Center: Position Shares, Avg Cost, Current Price */}
                <div className="flex items-center gap-6 text-xs font-mono text-muted pl-10 md:pl-0">
                  <div>
                    <span className="text-[10px] text-muted uppercase font-bold block">Shares</span>
                    <span className="text-foreground font-semibold tabular-nums">{item.shares}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted uppercase font-bold block">Current Price</span>
                    <span className="text-foreground font-semibold tabular-nums">{formatCurrency(item.currentPrice)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted uppercase font-bold block">Market Value</span>
                    <span className="text-foreground font-bold tabular-nums">{formatCurrency(item.totalValue)}</span>
                  </div>
                </div>

                {/* Right: Return Performance Bar & P/L Pill */}
                <div className="flex items-center justify-between md:justify-end gap-4 pl-10 md:pl-0">
                  <div className="text-right">
                    <span className="text-[10px] text-muted uppercase font-bold block">
                      Return ({timeframe})
                    </span>
                    <span className={cn(
                      "text-xs font-mono font-bold tabular-nums block",
                      item.unrealizedPL >= 0 ? "text-profit" : "text-loss"
                    )}>
                      {formatSignedCurrency(item.unrealizedPL)}
                    </span>
                  </div>

                  {/* Return Badge */}
                  <div
                    style={{ backgroundColor: item.color }}
                    className="px-3.5 py-1.5 rounded-xl text-white font-mono font-extrabold text-xs sm:text-sm shadow-md flex items-center gap-1 min-w-[76px] justify-center"
                  >
                    <span>{isPos ? "+" : ""}</span>
                    <span>{item.returnPercent.toFixed(2)}%</span>
                  </div>

                  <div className="text-muted group-hover:text-foreground group-hover:translate-x-0.5 transition-all hidden sm:block">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  if (!showCardWrapper) return content;

  return (
    <div className="glass-card p-5 sm:p-7 rounded-3xl border border-border/80 shadow-lg relative overflow-hidden animate-fade-in-up">
      {content}
    </div>
  );
}
