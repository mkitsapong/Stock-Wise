"use client";

import { useState } from "react";
import { type Holding } from "@/lib/mock-data";
import { usePortfolioQuotes, type RealTimeHolding } from "@/hooks/usePortfolioQuotes";
import { formatCurrency, formatPercent, formatSignedCurrency, formatNumber, cn } from "@/lib/utils";

type SortKey = "symbol" | "shares" | "avgCost" | "currentPrice" | "totalValue" | "plPercent";
type SortDir = "asc" | "desc";

export default function HoldingsTable() {
  const { holdings, isLoading } = usePortfolioQuotes();
  const [sortKey, setSortKey] = useState<SortKey>("totalValue");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const getValue = (h: RealTimeHolding, key: SortKey): number | string => {
    const currentPrice = h.currentPrice || 0;
    const plPercent = currentPrice > 0 ? ((currentPrice - h.avgCost) / h.avgCost) * 100 : 0;
    
    switch (key) {
      case "symbol": return h.symbol;
      case "shares": return h.shares;
      case "avgCost": return h.avgCost;
      case "currentPrice": return currentPrice;
      case "totalValue": return h.realTimeValue || 0;
      case "plPercent": return plPercent;
    }
  };

  const sorted = [...holdings].sort((a, b) => {
    const aVal = getValue(a, sortKey);
    const bVal = getValue(b, sortKey);
    const cmp = typeof aVal === "string"
      ? aVal.localeCompare(bVal as string)
      : (aVal as number) - (bVal as number);
    return sortDir === "asc" ? cmp : -cmp;
  });

  const SortIcon = ({ active, dir }: { active: boolean; dir: SortDir }) => (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      className={cn(
        "ml-1 inline-block transition-all",
        active ? "text-accent" : "text-muted/40"
      )}
    >
      <path
        d="M6 2L9 5H3L6 2Z"
        fill={active && dir === "asc" ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1"
      />
      <path
        d="M6 10L3 7H9L6 10Z"
        fill={active && dir === "desc" ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );

  const columns: { key: SortKey; label: string; align: "left" | "right" }[] = [
    { key: "symbol", label: "Symbol", align: "left" },
    { key: "shares", label: "Shares", align: "right" },
    { key: "avgCost", label: "Avg Cost", align: "right" },
    { key: "currentPrice", label: "Price", align: "right" },
    { key: "totalValue", label: "Value", align: "right" },
    { key: "plPercent", label: "P/L", align: "right" },
  ];

  return (
    <div className="glass-card overflow-hidden animate-fade-in-up opacity-0 stagger-2">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={cn(
                    "px-5 py-4 text-xs font-semibold uppercase tracking-wider text-muted cursor-pointer hover:text-foreground transition-colors select-none",
                    col.align === "right" ? "text-right" : "text-left"
                  )}
                >
                  {col.label}
                  <SortIcon active={sortKey === col.key} dir={sortDir} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((h) => {
              const currentPrice = h.currentPrice || 0;
              const totalValue = h.realTimeValue || 0;
              const pl = h.realTimePL || 0;
              const plPercent = currentPrice > 0 ? ((currentPrice - h.avgCost) / h.avgCost) * 100 : 0;
              const isPositive = pl >= 0;
              
              const showLoader = isLoading && currentPrice === 0;

              return (
                <tr
                  key={h.symbol}
                  className="border-b border-border/50 table-row-hover"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-accent">
                          {h.symbol.slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{h.symbol}</p>
                        <p className="text-xs text-muted">{h.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-sm text-foreground">
                    {formatNumber(h.shares)}
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-sm text-muted">
                    {formatCurrency(h.avgCost)}
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-sm text-foreground font-semibold">
                    {showLoader ? "..." : formatCurrency(currentPrice)}
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-sm text-foreground font-semibold">
                    {showLoader ? "..." : formatCurrency(totalValue)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {showLoader ? (
                      <div className="text-muted text-sm">...</div>
                    ) : (
                      <>
                        <div className={cn("font-mono text-sm font-semibold", isPositive ? "text-profit" : "text-loss")}>
                          {formatSignedCurrency(pl)}
                        </div>
                        <div className={cn("font-mono text-xs", isPositive ? "text-profit/70" : "text-loss/70")}>
                          {formatPercent(plPercent)}
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
