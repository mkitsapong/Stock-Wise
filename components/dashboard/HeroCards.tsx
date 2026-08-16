"use client";

import { usePortfolioQuotes } from "@/hooks/usePortfolioQuotes";
import { useCurrency } from "@/context/CurrencyContext";
import { formatPercent, cn } from "@/lib/utils";

export default function HeroCards() {
  const { portfolioStats: stats, isLoading } = usePortfolioQuotes();
  const { formatCurrency, formatSignedCurrency } = useCurrency();

  const cards = [
    {
      label: "Total Portfolio Value",
      value: formatCurrency(stats.totalValue),
      sub: `Cost Basis: ${formatCurrency(stats.totalCost)}`,
      accent: false,
      isPositive: true,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      label: "Unrealized P/L",
      value: formatSignedCurrency(stats.unrealizedPL),
      sub: formatPercent(stats.totalCost > 0 ? (stats.unrealizedPL / stats.totalCost) * 100 : 0),
      accent: true,
      isPositive: stats.unrealizedPL >= 0,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
      ),
    },
    {
      label: "Day Change",
      value: formatSignedCurrency(stats.dayChange),
      sub: formatPercent(stats.dayChangePercent),
      accent: true,
      isPositive: stats.dayChange >= 0,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card, i) => (
        <div
          key={card.label}
          className={cn(
            "p-5 rounded-2xl animate-fade-in-up opacity-0 relative overflow-hidden transition-all duration-300 group",
            i === 0
              ? "bg-gradient-to-br from-accent/15 via-card-bg to-purple-500/10 border border-accent/30 shadow-[0_4px_24px_rgba(99,102,241,0.12)] hover:border-accent/50"
              : "glass-card hover:border-border/80",
            i === 0 && "stagger-1",
            i === 1 && "stagger-2",
            i === 2 && "stagger-3"
          )}
        >
          {/* Ambient Glow */}
          <div 
            className={cn(
              "absolute -top-12 -right-12 w-28 h-28 rounded-full blur-[40px] pointer-events-none transition-opacity opacity-50 group-hover:opacity-100",
              card.accent 
                ? card.isPositive ? "bg-profit/20" : "bg-loss/20" 
                : "bg-accent/25"
            )} 
          />

          {/* Header */}
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className={cn(
              "text-[11px] font-bold uppercase tracking-wider",
              i === 0 ? "text-foreground" : "text-muted"
            )}>
              {card.label}
            </span>
            <span
              className={cn(
                "p-2 rounded-xl border transition-transform group-hover:scale-105",
                card.accent
                  ? card.isPositive
                    ? "bg-profit/10 text-profit border-profit/20"
                    : "bg-loss/10 text-loss border-loss/20"
                  : "bg-accent/10 text-accent border-accent/20"
              )}
            >
              {card.icon}
            </span>
          </div>

          {/* Value */}
          <div className="relative z-10">
            {isLoading ? (
              <div className="w-32 h-7 skeleton-shimmer rounded-lg mb-2" />
            ) : (
              <div
                className={cn(
                  "text-2xl sm:text-3xl font-extrabold font-mono tracking-tight tabular-nums",
                  card.accent
                    ? card.isPositive
                      ? "text-profit"
                      : "text-loss"
                    : "text-foreground"
                )}
              >
                {card.value}
              </div>
            )}
          </div>

          {/* Subtitle */}
          <div className="relative z-10 mt-1.5">
            {isLoading ? (
              <div className="w-20 h-4 skeleton-shimmer rounded" />
            ) : (
              <div
                className={cn(
                  "text-xs font-mono font-medium tabular-nums flex items-center gap-1",
                  card.accent
                    ? card.isPositive
                      ? "text-profit/90"
                      : "text-loss/90"
                    : "text-muted"
                )}
              >
                {card.accent && <span>{card.isPositive ? "▲" : "▼"}</span>}
                <span>{card.sub}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

