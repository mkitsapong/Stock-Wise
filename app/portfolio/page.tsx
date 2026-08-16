"use client";

import { useState, useMemo } from "react";
import HoldingsTable from "@/components/portfolio/HoldingsTable";
import DividendSection from "@/components/portfolio/DividendSection";
import DiversificationSection from "@/components/portfolio/DiversificationSection";
import LifetimePortfolioValueChart from "@/components/portfolio/LifetimePortfolioValueChart";
import HoldingsPerformanceHeatmap from "@/components/portfolio/HoldingsPerformanceHeatmap";
import { usePortfolioQuotes } from "@/hooks/usePortfolioQuotes";
import { useCurrency } from "@/context/CurrencyContext";
import { calculateDiversificationHealth } from "@/lib/diversification";
import { formatPercent, cn } from "@/lib/utils";

type PortfolioTab = "OVERVIEW" | "DIVERSIFICATION" | "HOLDINGS" | "DIVIDENDS" | "ALL";

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState<PortfolioTab>("OVERVIEW");
  const { holdings, portfolioStats } = usePortfolioQuotes();
  const { formatCurrency, formatSignedCurrency } = useCurrency();

  const dividendCount = useMemo(
    () => holdings.filter((h) => h.hasDividend || h.symbol === "QQQI").length,
    [holdings]
  );

  const health = useMemo(
    () => calculateDiversificationHealth(holdings),
    [holdings]
  );

  const totalValue = portfolioStats.totalValue;
  const unrealizedPL = portfolioStats.unrealizedPL;
  const totalCost = portfolioStats.totalCost;
  const returnPercent = totalCost > 0 ? (unrealizedPL / totalCost) * 100 : 0;
  const isPositive = unrealizedPL >= 0;

  const tabs: {
    id: PortfolioTab;
    label: string;
    badge?: string | number;
    icon: React.ReactNode;
  }[] = [
    {
      id: "OVERVIEW",
      label: "Performance & Heatmap",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
      ),
    },
    {
      id: "DIVERSIFICATION",
      label: "Diversification",
      badge: health.score > 0 ? `${health.score}` : undefined,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
          <path d="M22 12A10 10 0 0 0 12 2v10z" />
        </svg>
      ),
    },
    {
      id: "HOLDINGS",
      label: "Holdings",
      badge: holdings.length,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18" />
          <path d="M9 21V9" />
        </svg>
      ),
    },
    {
      id: "DIVIDENDS",
      label: "Dividends",
      badge: dividendCount > 0 ? dividendCount : undefined,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      id: "ALL",
      label: "All Views",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-5 pb-12">
      
      {/* 🌟 1. Premium Hero Header Card */}
      <div className="glass-card p-5 sm:p-6 rounded-3xl border border-border/80 relative overflow-hidden shadow-xl animate-fade-in-up">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-0 right-1/4 w-80 h-36 bg-accent/15 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-32 bg-purple-500/10 rounded-full blur-[50px] pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          {/* Title & Badge */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                Portfolio Hub
              </span>
              <span className="text-muted/60 text-xs">•</span>
              <span className="text-xs text-muted font-medium">
                {holdings.length} Assets Tracked
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Portfolio Analytics
            </h1>
            <p className="text-xs sm:text-sm text-muted font-medium">
              Comprehensive performance heatmap, lifetime returns & risk diversification
            </p>
          </div>

          {/* Quick Metrics Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1 md:pt-0">
            {/* Total Value Chip */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card-bg/80 border border-border/60 shadow-sm text-xs font-mono">
              <span className="text-muted font-sans text-[11px]">Value:</span>
              <span className="font-extrabold text-foreground tabular-nums">
                {formatCurrency(totalValue)}
              </span>
            </div>

            {/* Total Return Chip */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card-bg/80 border border-border/60 shadow-sm text-xs font-mono">
              <span className="text-muted font-sans text-[11px]">Total Return:</span>
              <span className={cn(
                "font-bold tabular-nums flex items-center gap-1",
                isPositive ? "text-profit" : "text-loss"
              )}>
                <span>{isPositive ? "▲" : "▼"}</span>
                <span>{formatSignedCurrency(unrealizedPL)}</span>
                <span className="opacity-80">({formatPercent(returnPercent)})</span>
              </span>
            </div>

            {/* Health Score Chip */}
            {health.score > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card-bg/80 border border-border/60 shadow-sm text-xs font-mono">
                <span className="text-muted font-sans text-[11px]">Health:</span>
                <span className={cn(
                  "font-bold px-1.5 py-0.2 rounded text-[10px] uppercase border",
                  health.score >= 80 ? "bg-profit/10 text-profit border-profit/20" :
                  health.score >= 60 ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                  "bg-loss/10 text-loss border-loss/20"
                )}>
                  {health.score}/100 ({health.grade})
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🌟 2. Dedicated Full-Width Segmented Tab Navigation Bar (Never Clipped) */}
      <div className="w-full bg-[#131722]/90 backdrop-blur-2xl p-1.5 rounded-2xl border border-border/90 shadow-xl overflow-x-auto scrollbar-none animate-fade-in-up">
        <div className="flex items-center gap-1.5 min-w-max sm:min-w-0 sm:w-full">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 whitespace-nowrap cursor-pointer flex-1 group",
                  isActive
                    ? "bg-accent text-white font-bold shadow-lg shadow-accent/25 scale-[1.01]"
                    : "text-muted hover:text-foreground hover:bg-white/5"
                )}
              >
                <span className={cn(
                  "transition-transform duration-200",
                  isActive ? "scale-110" : "group-hover:scale-110"
                )}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={cn(
                      "px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-md transition-colors",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-muted-bg text-muted group-hover:text-foreground"
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-6">
          {/* 1. Lifetime Portfolio Value vs S&P 500 */}
          <LifetimePortfolioValueChart />

          {/* 2. Holdings Returns Heatmap */}
          <HoldingsPerformanceHeatmap />

          {/* 3. Holdings Table */}
          <HoldingsTable />
        </div>
      )}

      {activeTab === "DIVERSIFICATION" && (
        <div className="space-y-6">
          <DiversificationSection />
        </div>
      )}

      {activeTab === "HOLDINGS" && (
        <div className="space-y-6">
          <HoldingsTable />
        </div>
      )}

      {activeTab === "DIVIDENDS" && (
        <div className="space-y-6">
          <DividendSection />
        </div>
      )}

      {activeTab === "ALL" && (
        <div className="space-y-8">
          <LifetimePortfolioValueChart />
          <HoldingsPerformanceHeatmap />
          <DiversificationSection />
          <HoldingsTable />
          <DividendSection />
        </div>
      )}
    </div>
  );
}
