"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { usePortfolioQuotes, type RealTimeHolding } from '@/hooks/usePortfolioQuotes';
import { useCurrency } from '@/context/CurrencyContext';
import AllocationDonutChart from '@/components/analytics/AllocationDonutChart';
import TopHoldingsBarChart from '@/components/analytics/TopHoldingsBarChart';
import PortfolioHealthScore from '@/components/analytics/PortfolioHealthScore';
import ProfitLossBreakdown from '@/components/analytics/ProfitLossBreakdown';
import MarketCapDonutChart from '@/components/analytics/MarketCapDonutChart';
import DividendProjectionCard from '@/components/analytics/DividendProjectionCard';
import { cn } from '@/lib/utils';

export default function AnalyticsPage() {
  const { holdings, isLoading: isQuotesLoading } = usePortfolioQuotes();
  const { currency } = useCurrency();
  const [profileData, setProfileData] = useState<Record<string, any>>({});
  const [loadingData, setLoadingData] = useState(true);

  // Derive top holdings data
  const topHoldingsData = useMemo(() => {
    if (!holdings) return [];
    return holdings.map((h: RealTimeHolding) => {
      const currentPrice = h.currentPrice || h.avgCost || 0;
      const value = h.shares * currentPrice;
      return {
        symbol: h.symbol,
        value: value,
      };
    }).filter(h => h.value > 0);
  }, [holdings]);

  // Fetch Financial & Sector Data
  useEffect(() => {
    async function fetchAnalytics() {
      if (!holdings || holdings.length === 0) {
        setLoadingData(false);
        return;
      }
      
      try {
        const symbols = holdings.map((h: RealTimeHolding) => h.symbol);
        const res = await fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbols }),
        });
        
        if (res.ok) {
          const data = await res.json();
          setProfileData(data.profiles || {});
        }
      } catch (err) {
        console.error("Failed to fetch analytics data", err);
      } finally {
        setLoadingData(false);
      }
    }
    
    fetchAnalytics();
  }, [holdings]);

  // Derive Sector Allocation Data
  const sectorAllocationData = useMemo(() => {
    if (!holdings || Object.keys(profileData).length === 0) return [];
    
    const aggregated: Record<string, number> = {};
    
    holdings.forEach((h: RealTimeHolding) => {
      const currentPrice = h.currentPrice || h.avgCost || 0;
      const value = h.shares * currentPrice;
      if (value <= 0) return;
      
      const sector = profileData[h.symbol]?.sector || 'Other/Unknown';
      aggregated[sector] = (aggregated[sector] || 0) + value;
    });
    
    return Object.entries(aggregated).map(([name, value]) => ({
      name,
      value
    }));
  }, [holdings, profileData]);

  // Calculate winning vs losing positions
  const { gainersCount, losersCount, winPercent } = useMemo(() => {
    if (!holdings || holdings.length === 0) return { gainersCount: 0, losersCount: 0, winPercent: 0 };
    let g = 0;
    let l = 0;
    holdings.forEach((h: RealTimeHolding) => {
      const cur = h.currentPrice || h.avgCost || 0;
      if (cur >= h.avgCost) g++;
      else l++;
    });
    const win = Math.round((g / holdings.length) * 100);
    return { gainersCount: g, losersCount: l, winPercent: win };
  }, [holdings]);

  const currencySymbol = currency === 'THB' ? '฿' : '$';

  return (
    <div className="space-y-6 pb-12">
      {/* 🌟 1. Standardized Page Header */}
      <div className="animate-fade-in-up opacity-0 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight gradient-text inline-block">
              Analytics
            </h1>
            <span className="px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent font-mono text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shrink-0" />
              <span>Pro Insights</span>
            </span>
          </div>
          <p className="text-sm text-muted mt-1 font-medium">
            Deep-dive portfolio health assessment, sector diversification, market cap spread & dividend forecasts
          </p>
        </div>

        <div className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-card-bg border border-border/80 text-muted shadow-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span>{holdings.length} Assets Analyzed</span>
        </div>
      </div>

      {(!holdings || holdings.length === 0) ? (
        <div className="glass-card p-12 text-center flex flex-col items-center gap-4 border-dashed animate-fade-in-up opacity-0 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-accent/10 rounded-full blur-[50px] pointer-events-none" />
          <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shadow-lg shadow-accent/10">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground mb-1">No Holdings to Analyze</h3>
            <p className="text-sm text-muted max-w-sm">
              Add buy transactions to your portfolio to unlock automated health scores, risk allocation breakdowns, and dividend forecasts.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* 🌟 2. Hero KPI Cards Grid (Matching Dashboard Style) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Card 1: Diversification Coverage */}
            <div className="p-5 rounded-2xl animate-fade-in-up opacity-0 relative overflow-hidden transition-all duration-300 group bg-gradient-to-br from-accent/15 via-card-bg to-purple-500/10 border border-accent/30 shadow-[0_4px_24px_rgba(99,102,241,0.12)] hover:border-accent/50 stagger-1">
              <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-[40px] pointer-events-none bg-accent/25 opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between mb-3 relative z-10">
                <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                  Sector Diversification
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
                  <span>{sectorAllocationData.length}</span>
                  <span className="text-sm font-sans font-medium text-muted">Active Sectors</span>
                </div>
              </div>
              <div className="relative z-10 mt-1.5 flex items-center gap-1.5 text-xs text-muted">
                <span>{holdings.length} total weighted assets</span>
              </div>
            </div>

            {/* Card 2: Profitable Holdings Win Rate */}
            <div className="glass-card p-5 rounded-2xl animate-fade-in-up opacity-0 relative overflow-hidden transition-all duration-300 group hover:border-border/80 stagger-2">
              <div className={cn(
                "absolute -top-12 -right-12 w-28 h-28 rounded-full blur-[40px] pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity",
                winPercent >= 50 ? "bg-profit/20" : "bg-loss/20"
              )} />
              <div className="flex items-center justify-between mb-3 relative z-10">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  Position Win Rate
                </span>
                <span className={cn(
                  "p-2 rounded-xl border group-hover:scale-105 transition-transform",
                  winPercent >= 50
                    ? "bg-profit/10 text-profit border-profit/20"
                    : "bg-loss/10 text-loss border-loss/20"
                )}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                </span>
              </div>
              <div className="relative z-10 flex items-baseline gap-2">
                <span className={cn(
                  "text-2xl sm:text-3xl font-extrabold font-mono tracking-tight tabular-nums",
                  winPercent >= 50 ? "text-profit" : "text-loss"
                )}>
                  {winPercent}%
                </span>
                <span className="text-sm font-sans font-semibold text-muted">In Green</span>
              </div>
              <div className="relative z-10 mt-1.5 flex items-center gap-1.5 text-xs text-muted">
                <span>{gainersCount} in profit · {losersCount} in drawdown</span>
              </div>
            </div>

            {/* Card 3: Top Concentration */}
            <div className="glass-card p-5 rounded-2xl animate-fade-in-up opacity-0 relative overflow-hidden transition-all duration-300 group hover:border-border/80 stagger-3">
              <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-[40px] pointer-events-none bg-accent/20 opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between mb-3 relative z-10">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  Top Holding Weight
                </span>
                <span className="p-2 rounded-xl border bg-accent/10 text-accent border-accent/20 group-hover:scale-105 transition-transform">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                </span>
              </div>
              <div className="relative z-10">
                <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight tabular-nums text-foreground flex items-baseline gap-2">
                  <span>{topHoldingsData[0]?.symbol || "—"}</span>
                  <span className="text-sm font-sans font-medium text-muted">#1 Position</span>
                </div>
              </div>
              <div className="relative z-10 mt-1.5 flex items-center gap-1.5 text-xs text-muted">
                <span>Top 5 account for most variance</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Row 1: Health Score & Win Rate Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up opacity-0 stagger-1">
              <PortfolioHealthScore holdings={holdings} sectorData={profileData} />
              <ProfitLossBreakdown holdings={holdings} currencySymbol={currencySymbol} />
            </div>

            {/* Row 2: Sector Allocation & Top Holdings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up opacity-0 stagger-2">
              {/* Sector Allocation */}
              <div className="glass-card p-6 shadow-xl flex flex-col relative overflow-hidden min-h-[350px]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full blur-3xl pointer-events-none" />
                
                {loadingData ? (
                  <div className="flex flex-col items-center justify-center min-h-[300px]">
                    <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-muted font-mono text-sm animate-pulse">Analyzing sectors...</p>
                  </div>
                ) : (
                  <AllocationDonutChart 
                    data={sectorAllocationData} 
                    title="Allocation by Sector" 
                    currencySymbol={currencySymbol} 
                  />
                )}
              </div>

              {/* Top Holdings */}
              <div className="glass-card p-6 shadow-xl flex flex-col relative overflow-hidden min-h-[350px]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full blur-3xl pointer-events-none" />
                
                <TopHoldingsBarChart 
                  data={topHoldingsData} 
                  title="Top 5 Holdings" 
                  currencySymbol={currencySymbol} 
                />
              </div>
            </div>

            {/* Row 3: Market Cap Allocation & Dividend Projection */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up opacity-0 stagger-3">
              <MarketCapDonutChart 
                holdings={holdings} 
                profiles={profileData} 
                currencySymbol={currencySymbol} 
              />
              <DividendProjectionCard 
                holdings={holdings} 
                profiles={profileData} 
                currencySymbol={currencySymbol} 
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
