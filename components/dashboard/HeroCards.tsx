"use client";

import { usePortfolioQuotes } from "@/hooks/usePortfolioQuotes";
import { formatCurrency, formatSignedCurrency, formatPercent, cn } from "@/lib/utils";

export default function HeroCards() {
  const { portfolioStats: stats, isLoading } = usePortfolioQuotes();

  const cards = [
    {
      label: "Total Portfolio Value",
      value: isLoading ? "Loading..." : formatCurrency(stats.totalValue),
      sub: isLoading ? "..." : `Cost Basis: ${formatCurrency(stats.totalCost)}`,
      accent: false,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      label: "Unrealized P/L",
      value: isLoading ? "Loading..." : formatSignedCurrency(stats.unrealizedPL),
      sub: isLoading ? "..." : formatPercent(stats.totalCost > 0 ? (stats.unrealizedPL / stats.totalCost) * 100 : 0),
      accent: true,
      isPositive: stats.unrealizedPL >= 0,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
      ),
    },
    {
      label: "Day Change",
      value: isLoading ? "Loading..." : formatSignedCurrency(stats.dayChange),
      sub: isLoading ? "..." : formatPercent(stats.dayChangePercent),
      accent: true,
      isPositive: stats.dayChange >= 0,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {cards.map((card, i) => (
        <div
          key={card.label}
          className={cn(
            "p-4 rounded-[16px] animate-fade-in-up opacity-0 relative overflow-hidden transition-all duration-300",
            // Highlight the first card with a special gradient and stronger shadow
            i === 0
              ? "bg-gradient-to-br from-accent/20 to-purple-500/10 border border-accent/30 shadow-[0_0_30px_rgba(99,102,241,0.15)] hover:shadow-[0_0_40px_rgba(99,102,241,0.25)] hover:border-accent/50"
              : "glass-card",
            i === 0 && "stagger-1",
            i === 1 && "stagger-2",
            i === 2 && "stagger-3"
          )}
        >
          {/* Decorative blur inside the first card */}
          {i === 0 && (
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent/30 rounded-full blur-[40px] pointer-events-none" />
          )}

          {/* Header */}
          <div className="flex items-center justify-between mb-2 relative z-10">
            <span className={cn(
              "text-[11px] font-semibold uppercase tracking-wider",
              i === 0 ? "text-foreground" : "text-muted"
            )}>
              {card.label}
            </span>
            <span
              className={cn(
                "p-1.5 rounded-lg",
                card.accent
                  ? card.isPositive
                    ? "bg-profit/10 text-profit"
                    : "bg-loss/10 text-loss"
                  : "bg-accent/10 text-accent"
              )}
            >
              {/* Scale down the SVG inside */}
              <div className="scale-75 origin-center">
                {card.icon}
              </div>
            </span>
          </div>

          {/* Value */}
          <div
            className={cn(
              "text-xl sm:text-2xl font-bold font-mono tracking-tight",
              card.accent
                ? card.isPositive
                  ? "text-profit"
                  : "text-loss"
                : "text-foreground"
            )}
          >
            {card.value}
          </div>

          {/* Sub */}
          <div
            className={cn(
              "text-xs font-mono mt-1",
              card.accent
                ? card.isPositive
                  ? "text-profit/80"
                  : "text-loss/80"
                : "text-muted"
            )}
          >
            {card.sub}
          </div>
        </div>
      ))}
    </div>
  );
}
