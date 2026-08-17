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

  const currencySymbol = currency === 'THB' ? '฿' : '$';

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar pb-12 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <span>Portfolio Analytics</span>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
              Pro Insights
            </span>
          </h1>
          <p className="text-muted mt-1 font-mono text-sm">
            วิเคราะห์เชิงลึก สุขภาพพอร์ต ความหลากหลาย และคาดการณ์เงินปันผล
          </p>
        </div>
      </div>

      {(!holdings || holdings.length === 0) ? (
        <div className="flex-1 flex items-center justify-center text-muted font-mono bg-card-bg/30 border border-border/40 rounded-2xl min-h-[300px]">
          No portfolio holdings available to analyze.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Row 1: Health Score & Win Rate Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PortfolioHealthScore holdings={holdings} sectorData={profileData} />
            <ProfitLossBreakdown holdings={holdings} currencySymbol={currencySymbol} />
          </div>

          {/* Row 2: Sector Allocation & Top Holdings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sector Allocation */}
            <div className="bg-card-bg/60 backdrop-blur-md border border-border/70 rounded-2xl p-6 shadow-xl flex flex-col relative overflow-hidden min-h-[350px]">
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
            <div className="bg-card-bg/60 backdrop-blur-md border border-border/70 rounded-2xl p-6 shadow-xl flex flex-col relative overflow-hidden min-h-[350px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full blur-3xl pointer-events-none" />
              
              <TopHoldingsBarChart 
                data={topHoldingsData} 
                title="Top 5 Holdings" 
                currencySymbol={currencySymbol} 
              />
            </div>
          </div>

          {/* Row 3: Market Cap Allocation & Dividend Projection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      )}
    </div>
  );
}
