"use client";

import { useTransactions } from "@/context/TransactionContext";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";

export default function DividendSection() {
  const { holdings } = useTransactions();
  const dividendHoldings = holdings.filter((h: any) => h.hasDividend);

  if (dividendHoldings.length === 0) return null;

  return (
    <div className="glass-card p-5 sm:p-6 animate-fade-in-up opacity-0 stagger-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-profit/10 flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Dividend Income</h3>
          <p className="text-xs text-muted">Passive income from dividend-paying holdings</p>
        </div>
      </div>

      <div className="space-y-4">
        {dividendHoldings.map((h) => {
          const totalValue = h.shares * h.currentPrice;
          const yieldOnCost = h.annualDividend ? (h.annualDividend / h.avgCost) * 100 : 0;
          const annualIncome = h.annualDividend ? h.annualDividend * h.shares : 0;
          const monthlyIncome = annualIncome / 12;

          return (
            <div
              key={h.symbol}
              className="p-4 rounded-xl bg-muted-bg/50 border border-border/50"
            >
              {/* Symbol Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-accent">{h.symbol}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{h.name}</p>
                    <p className="text-xs text-muted">
                      {h.shares} shares · {formatCurrency(totalValue)} value
                    </p>
                  </div>
                </div>
                {h.lastDividendDate && (
                  <span className="text-xs text-muted bg-muted-bg px-3 py-1 rounded-lg">
                    Last Div: {h.lastDividendDate}
                  </span>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-lg bg-card-bg border border-border/50">
                  <p className="text-xs text-muted uppercase tracking-wider mb-1">
                    Dividend Yield
                  </p>
                  <p className="text-lg font-bold font-mono text-profit">
                    {h.dividendYield?.toFixed(1)}%
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-card-bg border border-border/50">
                  <p className="text-xs text-muted uppercase tracking-wider mb-1">
                    Yield on Cost
                  </p>
                  <p className="text-lg font-bold font-mono text-profit">
                    {yieldOnCost.toFixed(1)}%
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-card-bg border border-border/50">
                  <p className="text-xs text-muted uppercase tracking-wider mb-1">
                    Annual Income
                  </p>
                  <p className="text-lg font-bold font-mono text-foreground">
                    {formatCurrency(annualIncome)}
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-card-bg border border-border/50">
                  <p className="text-xs text-muted uppercase tracking-wider mb-1">
                    Monthly Est.
                  </p>
                  <p className="text-lg font-bold font-mono text-foreground">
                    {formatCurrency(monthlyIncome)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
