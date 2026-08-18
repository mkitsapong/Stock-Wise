"use client";

import { useState, useMemo } from "react";
import HoldingsTable from "@/components/portfolio/HoldingsTable";
import DividendSection from "@/components/portfolio/DividendSection";
import DiversificationSection from "@/components/portfolio/DiversificationSection";
import LifetimePortfolioValueChart from "@/components/portfolio/LifetimePortfolioValueChart";
import HoldingsPerformanceHeatmap from "@/components/portfolio/HoldingsPerformanceHeatmap";
import PortfolioDoctorSection from "@/components/portfolio/PortfolioDoctorSection";
import PortfolioSwitcher from "@/components/portfolio/PortfolioSwitcher";
import { usePortfolioQuotes } from "@/hooks/usePortfolioQuotes";
import { useCurrency } from "@/context/CurrencyContext";
import { calculateDiversificationHealth } from "@/lib/diversification";
import { formatPercent, cn } from "@/lib/utils";

type PortfolioTab = "OVERVIEW" | "DOCTOR" | "DIVERSIFICATION" | "HOLDINGS" | "DIVIDENDS" | "ALL";

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
      id: "DOCTOR",
      label: "AI Doctor & Simulator",
      badge: "AI",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
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
    <div className="space-y-6 pb-12">
      {/* 🌟 1. Standardized Page Header */}
      <div className="animate-fade-in-up opacity-0 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight gradient-text inline-block">
              Portfolio
            </h1>
            <span className="px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent font-mono text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shrink-0" />
              <span>{holdings.length} {holdings.length === 1 ? "Asset" : "Assets"}</span>
            </span>
          </div>
          <p className="text-sm text-muted mt-1 font-medium">
            Track performance heatmap, lifetime returns, AI diagnosis & risk diversification
          </p>
        </div>

        {/* Strategy Switcher Bar */}
        <div className="shrink-0">
          <PortfolioSwitcher variant="tabs" />
        </div>
      </div>

      {/* 🌟 2. Hero KPI Cards Grid (Matching Dashboard Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Value */}
        <div className="p-5 rounded-2xl animate-fade-in-up opacity-0 relative overflow-hidden transition-all duration-300 group bg-gradient-to-br from-accent/15 via-card-bg to-purple-500/10 border border-accent/30 shadow-[0_4px_24px_rgba(99,102,241,0.12)] hover:border-accent/50 stagger-1">
          <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-[40px] pointer-events-none bg-accent/25 opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">
              Total Portfolio Value
            </span>
            <span className="p-2 rounded-xl border bg-accent/10 text-accent border-accent/20 group-hover:scale-105 transition-transform">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </span>
          </div>
          <div className="relative z-10">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight tabular-nums text-foreground">
              {formatCurrency(totalValue)}
            </div>
          </div>
          <div className="relative z-10 mt-1.5">
            <span className="text-xs text-muted font-medium">
              Cost Basis: {formatCurrency(totalCost)}
            </span>
          </div>
        </div>

        {/* Card 2: Unrealized P/L */}
        <div className="glass-card p-5 rounded-2xl animate-fade-in-up opacity-0 relative overflow-hidden transition-all duration-300 group hover:border-border/80 stagger-2">
          <div className={cn(
            "absolute -top-12 -right-12 w-28 h-28 rounded-full blur-[40px] pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity",
            isPositive ? "bg-profit/20" : "bg-loss/20"
          )} />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Unrealized Return
            </span>
            <span className={cn(
              "p-2 rounded-xl border group-hover:scale-105 transition-transform",
              isPositive
                ? "bg-profit/10 text-profit border-profit/20"
                : "bg-loss/10 text-loss border-loss/20"
            )}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
              </svg>
            </span>
          </div>
          <div className="relative z-10">
            <div className={cn(
              "text-2xl sm:text-3xl font-extrabold font-mono tracking-tight tabular-nums",
              isPositive ? "text-profit" : "text-loss"
            )}>
              {formatSignedCurrency(unrealizedPL)}
            </div>
          </div>
          <div className="relative z-10 mt-1.5 flex items-center gap-1.5">
            <span className={cn(
              "text-xs font-mono font-bold px-1.5 py-0.5 rounded-md",
              isPositive ? "bg-profit/10 text-profit" : "bg-loss/10 text-loss"
            )}>
              {formatPercent(returnPercent)}
            </span>
            <span className="text-xs text-muted">all time</span>
          </div>
        </div>

        {/* Card 3: Health Score & Asset Count */}
        <div className="glass-card p-5 rounded-2xl animate-fade-in-up opacity-0 relative overflow-hidden transition-all duration-300 group hover:border-border/80 stagger-3">
          <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-[40px] pointer-events-none bg-accent/20 opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Health & Diversification
            </span>
            <span className="p-2 rounded-xl border bg-accent/10 text-accent border-accent/20 group-hover:scale-105 transition-transform">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                <path d="M22 12A10 10 0 0 0 12 2v10z" />
              </svg>
            </span>
          </div>
          <div className="relative z-10">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight tabular-nums text-foreground flex items-baseline gap-2">
              <span>{health.score > 0 ? health.score : "—"}</span>
              {health.score > 0 && (
                <span className="text-sm font-sans font-semibold text-muted">/ 100</span>
              )}
            </div>
          </div>
          <div className="relative z-10 mt-1.5 flex items-center gap-2">
            {health.score > 0 ? (
              <span className={cn(
                "text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border font-mono",
                health.score >= 80 ? "bg-profit/10 text-profit border-profit/20" :
                health.score >= 60 ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                "bg-loss/10 text-loss border-loss/20"
              )}>
                Grade: {health.grade}
              </span>
            ) : (
              <span className="text-xs text-muted">No holdings</span>
            )}
            <span className="text-xs text-muted">
              · {dividendCount} dividend {dividendCount === 1 ? 'payer' : 'payers'}
            </span>
          </div>
        </div>
      </div>

      {/* 🌟 2. Dedicated Full-Width Segmented Tab Navigation Bar (Never Clipped) */}
      <div className="w-full bg-card-bg/90 backdrop-blur-2xl p-1.5 rounded-2xl border border-border/80 shadow-md overflow-x-auto scrollbar-none animate-fade-in-up">
        <div className="flex items-center gap-1.5 min-w-max sm:min-w-0 sm:w-full">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 whitespace-nowrap cursor-pointer flex-1 group",
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

      {activeTab === "DOCTOR" && (
        <div className="space-y-6">
          <PortfolioDoctorSection />
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
          <PortfolioDoctorSection />
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
