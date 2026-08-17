"use client";

import React, { useMemo } from 'react';
import { cn, formatPercent } from '@/lib/utils';
import CompanyLogo from '@/components/common/CompanyLogo';

interface ProfitLossBreakdownProps {
  holdings: any[];
  currencySymbol?: string;
}

export default function ProfitLossBreakdown({ holdings, currencySymbol = '$' }: ProfitLossBreakdownProps) {
  const stats = useMemo(() => {
    if (!holdings || holdings.length === 0) {
      return {
        winners: [],
        losers: [],
        breakeven: [],
        winRate: 0,
        totalGain: 0,
        totalLoss: 0,
        bestPerformer: null,
        worstPerformer: null,
      };
    }

    let winners: any[] = [];
    let losers: any[] = [];
    let breakeven: any[] = [];
    let totalGain = 0;
    let totalLoss = 0;

    const mapped = holdings.map(h => {
      const currentPrice = h.currentPrice || h.avgCost || 0;
      const totalCost = h.shares * h.avgCost;
      const totalVal = h.shares * currentPrice;
      const pl = totalVal - totalCost;
      const plPct = totalCost > 0 ? (pl / totalCost) * 100 : 0;

      return {
        ...h,
        currentPrice,
        totalVal,
        totalCost,
        pl,
        plPct,
      };
    });

    mapped.forEach(item => {
      if (item.pl > 0.001) {
        winners.push(item);
        totalGain += item.pl;
      } else if (item.pl < -0.001) {
        losers.push(item);
        totalLoss += Math.abs(item.pl);
      } else {
        breakeven.push(item);
      }
    });

    const winRate = holdings.length > 0 ? (winners.length / holdings.length) * 100 : 0;

    const sortedByPct = [...mapped].sort((a, b) => b.plPct - a.plPct);
    const bestPerformer = sortedByPct[0] || null;
    const worstPerformer = sortedByPct[sortedByPct.length - 1] || null;

    return {
      winners,
      losers,
      breakeven,
      winRate,
      totalGain,
      totalLoss,
      bestPerformer,
      worstPerformer,
    };
  }, [holdings]);

  if (!holdings || holdings.length === 0) return null;

  return (
    <div className="bg-card-bg/60 backdrop-blur-md border border-border/70 rounded-2xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/40">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          P&L Performance & Win Rate
        </h3>
        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">
          Win Rate: {stats.winRate.toFixed(0)}%
        </span>
      </div>

      {/* Winners vs Losers Progress Bar */}
      <div className="space-y-1.5 mb-5">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-profit font-bold">
            {stats.winners.length} กำไร (+{currencySymbol}{stats.totalGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
          </span>
          <span className="text-loss font-bold">
            {stats.losers.length} ขาดทุน (-{currencySymbol}{stats.totalLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
          </span>
        </div>
        <div className="w-full h-3 rounded-full bg-muted-bg/60 overflow-hidden flex p-0.5 border border-border/40 gap-0.5">
          <div 
            className="h-full bg-profit rounded-l-full transition-all duration-700 ease-out" 
            style={{ width: `${Math.max(5, stats.winRate)}%` }}
            title={`Winners: ${stats.winners.length}`}
          />
          <div 
            className="h-full bg-loss rounded-r-full transition-all duration-700 ease-out" 
            style={{ width: `${Math.max(5, 100 - stats.winRate)}%` }}
            title={`Losers: ${stats.losers.length}`}
          />
        </div>
      </div>

      {/* Best & Worst Performers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-auto">
        {/* Best Performer */}
        {stats.bestPerformer && (
          <div className="p-3 rounded-xl bg-profit/5 border border-profit/20 flex items-center gap-3">
            <CompanyLogo symbol={stats.bestPerformer.symbol} size="sm" className="rounded-lg shadow-xs" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-foreground">{stats.bestPerformer.symbol}</span>
                <span className="text-xs font-bold font-mono text-profit">{formatPercent(stats.bestPerformer.plPct)}</span>
              </div>
              <p className="text-[10px] text-muted truncate">Best Performer (Top Gain)</p>
            </div>
          </div>
        )}

        {/* Worst Performer */}
        {stats.worstPerformer && (
          <div className="p-3 rounded-xl bg-loss/5 border border-loss/20 flex items-center gap-3">
            <CompanyLogo symbol={stats.worstPerformer.symbol} size="sm" className="rounded-lg shadow-xs" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-foreground">{stats.worstPerformer.symbol}</span>
                <span className={cn(
                  "text-xs font-bold font-mono",
                  stats.worstPerformer.plPct >= 0 ? "text-profit" : "text-loss"
                )}>
                  {formatPercent(stats.worstPerformer.plPct)}
                </span>
              </div>
              <p className="text-[10px] text-muted truncate">Lagging Asset</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
