"use client";

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import CompanyLogo from '@/components/common/CompanyLogo';
import { useCurrency } from '@/context/CurrencyContext';

interface DividendProjectionCardProps {
  holdings: any[];
  profiles: Record<string, any>;
  currencySymbol?: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function DividendProjectionCard({ holdings, profiles, currencySymbol }: DividendProjectionCardProps) {
  const { currency, exchangeRate, currencySymbol: contextSymbol } = useCurrency();
  const activeCurrencySymbol = currencySymbol || contextSymbol;
  const fxRate = currency === 'THB' ? exchangeRate : 1;

  const dividendStats = useMemo(() => {
    if (!holdings || holdings.length === 0) {
      return {
        totalAnnualIncome: 0,
        averageYield: 0,
        dividendPayers: [],
        monthlyData: MONTHS.map(m => ({ month: m, amount: 0 })),
      };
    }

    let totalAnnualIncome = 0;
    let totalPortfolioVal = 0;
    const dividendPayers: any[] = [];

    holdings.forEach(h => {
      const price = (h.currentPrice || h.avgCost || 0) * fxRate;
      const val = h.shares * price;
      totalPortfolioVal += val;

      const profile = profiles[h.symbol] || {};
      const rate = (profile.dividendRate || 0) * fxRate;
      const yieldPct = profile.dividendYield || 0;

      if (rate > 0 || yieldPct > 0) {
        const annualIncome = h.shares * rate;
        totalAnnualIncome += annualIncome;
        dividendPayers.push({
          symbol: h.symbol,
          name: h.name,
          shares: h.shares,
          rate,
          yieldPct,
          annualIncome,
        });
      }
    });

    const averageYield = totalPortfolioVal > 0 ? (totalAnnualIncome / totalPortfolioVal) * 100 : 0;
    const sortedPayers = dividendPayers.sort((a, b) => b.annualIncome - a.annualIncome);

    // Estimate monthly cashflow across Jan-Dec (assuming quarterly payout distribution)
    const monthlyData = MONTHS.map((month, idx) => {
      let monthAmount = 0;
      dividendPayers.forEach((p, pIdx) => {
        // Distribute payouts across quarters based on symbol hash / index
        const payoutCycle = (pIdx + idx) % 3 === 0;
        if (payoutCycle) {
          monthAmount += p.annualIncome / 4;
        }
      });
      return {
        month,
        amount: Math.round(monthAmount * 100) / 100,
      };
    });

    return {
      totalAnnualIncome,
      averageYield,
      dividendPayers: sortedPayers,
      monthlyData,
    };
  }, [holdings, profiles]);

  if (!holdings || holdings.length === 0) return null;

  return (
    <div className="bg-card-bg/60 backdrop-blur-md border border-border/70 rounded-2xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden min-h-[350px]">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/40">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Dividend Yield & Income Projection
          </h3>
          <p className="text-xs text-muted font-medium mt-0.5">คาดการณ์กระแสเงินสดปันผลล่วงหน้า</p>
        </div>
        <div className="text-right">
          <p className="text-base font-bold font-mono text-profit">
            +{activeCurrencySymbol}{dividendStats.totalAnnualIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-xs text-muted font-normal"> / ปี</span>
          </p>
          <p className="text-[11px] font-mono text-muted">
            Avg Yield: <span className="font-bold text-foreground">{dividendStats.averageYield.toFixed(2)}%</span>
          </p>
        </div>
      </div>

      {dividendStats.dividendPayers.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-muted font-mono text-xs">
          <p>หุ้นในพอร์ตปัจจุบันยังไม่มีประวัติจ่ายเงินปันผล</p>
          <p className="text-[10px] opacity-70 mt-1">Growth stock / Non-dividend focus</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 12-Month Projected Cashflow Bar Chart */}
          <div>
            <p className="text-xs font-bold text-muted mb-2 font-mono uppercase tracking-wider">
              12-Month Cashflow Projection
            </p>
            <div className="h-[140px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dividendStats.monthlyData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--muted)', fontSize: 10, fontWeight: 600 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--muted)', fontSize: 9 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--card-border)',
                      borderRadius: '10px',
                      color: 'var(--foreground)',
                      fontSize: '11px',
                      padding: '8px 12px',
                    }}
                    formatter={(val: any) => [`${activeCurrencySymbol}${Number(val).toFixed(2)}`, 'Estimated Payout']}
                  />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {dividendStats.monthlyData.map((entry, index) => (
                      <Cell 
                        key={`cell-div-${index}`} 
                        fill={entry.amount > 0 ? "var(--profit)" : "rgba(148, 163, 184, 0.2)"} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Dividend Contributors */}
          <div className="pt-2 border-t border-border/40">
            <p className="text-[11px] font-bold text-muted mb-2 font-mono uppercase">Top Dividend Contributors</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {dividendStats.dividendPayers.slice(0, 3).map((p) => (
                <div key={p.symbol} className="p-2 rounded-xl bg-muted-bg/30 border border-border/30 flex items-center gap-2">
                  <CompanyLogo symbol={p.symbol} size="sm" className="rounded-lg shadow-xs" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold font-mono text-foreground">{p.symbol}</p>
                    <p className="text-[10px] text-profit font-mono font-bold">
                      +{activeCurrencySymbol}{p.annualIncome.toFixed(2)} <span className="text-muted font-normal">({p.yieldPct.toFixed(1)}%)</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
