"use client";

import { getTopGainers, getTopLosers } from "@/lib/mock-data";
import { useCurrency } from "@/context/CurrencyContext";
import { formatPercent, cn } from "@/lib/utils";
import CompanyLogo from "@/components/common/CompanyLogo";

export default function TopMovers() {
  const { formatCurrency, formatSignedCurrency } = useCurrency();
  const gainers = getTopGainers();
  const losers = getTopLosers();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in-up opacity-0 stagger-5">
      {/* Top Gainers */}
      <div className="glass-card p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-profit" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Top Gainers
          </h3>
        </div>
        <div className="space-y-1">
          {gainers.map((h) => (
            <div
              key={h.symbol}
              className="flex items-center justify-between py-2.5 px-3 rounded-xl transition-all duration-200 hover:bg-card-hover hover:scale-[1.01] hover:shadow-md cursor-pointer border border-transparent hover:border-profit/20 group"
            >
              <div className="flex items-center gap-3">
                <CompanyLogo symbol={h.symbol} name={h.name} size="sm" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{h.symbol}</p>
                  <p className="text-xs text-muted truncate max-w-[120px]">{h.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono font-semibold text-foreground">
                  {formatCurrency(h.currentPrice ?? 0)}
                </p>
                <p className="text-xs font-mono text-profit">
                  {formatSignedCurrency(h.dayChange ?? 0)} ({formatPercent(h.dayChangePercent ?? 0)})
                </p>
              </div>
            </div>
          ))}
          {gainers.length === 0 && (
            <p className="text-sm text-muted py-4 text-center">No gainers today</p>
          )}
        </div>
      </div>

      {/* Top Losers */}
      <div className="glass-card p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-loss" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Top Losers
          </h3>
        </div>
        <div className="space-y-1">
          {losers.map((h) => (
            <div
              key={h.symbol}
              className="flex items-center justify-between py-2.5 px-3 rounded-xl transition-all duration-200 hover:bg-card-hover hover:scale-[1.01] hover:shadow-md cursor-pointer border border-transparent hover:border-loss/20 group"
            >
              <div className="flex items-center gap-3">
                <CompanyLogo symbol={h.symbol} name={h.name} size="sm" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{h.symbol}</p>
                  <p className="text-xs text-muted truncate max-w-[120px]">{h.name}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm font-mono font-semibold text-foreground">
                  {formatCurrency(h.currentPrice ?? 0)}
                </p>
                <p className="text-xs font-mono text-loss">
                  {formatSignedCurrency(h.dayChange ?? 0)} ({formatPercent(h.dayChangePercent ?? 0)})
                </p>
              </div>

            </div>
          ))}
          {losers.length === 0 && (
            <p className="text-sm text-muted py-4 text-center">No losers today</p>
          )}
        </div>
      </div>
    </div>
  );
}
