"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePortfolioQuotes, type RealTimeHolding } from "@/hooks/usePortfolioQuotes";
import { useTransactions } from "@/context/TransactionContext";
import { useCurrency } from "@/context/CurrencyContext";
import { formatPercent, formatNumber, cn } from "@/lib/utils";
import CompanyLogo from "@/components/common/CompanyLogo";
import MoveStockModal from "@/components/portfolio/MoveStockModal";

type SortKey = "symbol" | "shares" | "avgCost" | "currentPrice" | "totalValue" | "plPercent";
type SortDir = "asc" | "desc";

export default function HoldingsTable() {
  const router = useRouter();
  const { holdings, isLoading } = usePortfolioQuotes();
  const { portfolios } = useTransactions();
  const { formatCurrency, formatSignedCurrency } = useCurrency();

  const [sortKey, setSortKey] = useState<SortKey>("totalValue");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [movingHolding, setMovingHolding] = useState<RealTimeHolding | null>(null);

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
    const cmp =
      typeof aVal === "string"
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
    { key: "symbol", label: "Asset", align: "left" },
    { key: "shares", label: "Shares", align: "right" },
    { key: "avgCost", label: "Avg Cost", align: "right" },
    { key: "currentPrice", label: "Price", align: "right" },
    { key: "totalValue", label: "Value", align: "right" },
    { key: "plPercent", label: "Unrealized P/L", align: "right" },
  ];

  return (
    <>
      <div className="glass-card overflow-hidden animate-fade-in-up opacity-0 stagger-2">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/80 bg-muted-bg/30">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={cn(
                      "px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-muted cursor-pointer hover:text-foreground transition-colors select-none",
                      col.align === "right" ? "text-right" : "text-left"
                    )}
                  >
                    {col.label}
                    <SortIcon active={sortKey === col.key} dir={sortDir} />
                  </th>
                ))}
                <th className="px-4 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-muted w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
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
                    onClick={() => router.push(`/?symbol=${h.symbol}`)}
                    className="table-row-hover cursor-pointer group"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <CompanyLogo
                          symbol={h.symbol}
                          name={h.name}
                          size="md"
                          className="group-hover:scale-105 transition-transform"
                        />
                        <div>
                          <p className="text-sm font-bold font-mono text-foreground group-hover:text-accent transition-colors">
                            {h.symbol}
                          </p>
                          <p className="text-xs text-muted truncate max-w-[160px] font-medium">
                            {h.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-sm text-foreground tabular-nums">
                      {formatNumber(h.shares)}
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-sm text-muted tabular-nums">
                      {formatCurrency(h.avgCost)}
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-sm text-foreground font-bold tabular-nums">
                      {showLoader ? (
                        <div className="w-16 h-4 skeleton-shimmer rounded ml-auto" />
                      ) : (
                        formatCurrency(currentPrice)
                      )}
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-sm text-foreground font-bold tabular-nums">
                      {showLoader ? (
                        <div className="w-20 h-4 skeleton-shimmer rounded ml-auto" />
                      ) : (
                        formatCurrency(totalValue)
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {showLoader ? (
                        <div className="w-16 h-6 skeleton-shimmer rounded ml-auto" />
                      ) : (
                        <div className="flex flex-col items-end">
                          <div
                            className={cn(
                              "font-mono text-sm font-bold tabular-nums",
                              isPositive ? "text-profit" : "text-loss"
                            )}
                          >
                            {formatSignedCurrency(pl)}
                          </div>
                          <div
                            className={cn(
                              "font-mono text-xs font-semibold tabular-nums mt-0.5",
                              isPositive ? "text-profit/80" : "text-loss/80"
                            )}
                          >
                            {formatPercent(plPercent)}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Actions Column */}
                    <td
                      className="px-4 py-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setMovingHolding(h)}
                        title="Move stock to another portfolio (ย้ายพอร์ต)"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-accent/10 hover:bg-accent/20 text-accent text-xs font-semibold border border-accent/20 transition-all active:scale-95 shadow-xs cursor-pointer"
                      >
                        <span>⇄</span>
                        <span className="hidden sm:inline">Move</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {holdings.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <p className="text-muted text-sm">
                No assets in this portfolio. You can add transactions or move stocks from other portfolios.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Move Stock Modal */}
      {movingHolding && (
        <MoveStockModal
          isOpen={Boolean(movingHolding)}
          onClose={() => setMovingHolding(null)}
          symbol={movingHolding.symbol}
          name={movingHolding.name}
          shares={movingHolding.shares}
          totalValue={movingHolding.realTimeValue}
        />
      )}
    </>
  );
}
