"use client";

import { useMemo } from "react";
import { formatCurrency, cn } from "@/lib/utils";

interface TechnicalAnalysisProps {
  data: any[];
  isLoading: boolean;
}

export default function TechnicalAnalysis({ data, isLoading }: TechnicalAnalysisProps) {
  // Calculate Standard Pivot Points based on the last 20 trading days
  const pivots = useMemo(() => {
    if (!data || data.length < 20) return null;

    // Get the last 20 days of data
    const last20 = data.slice(-20);
    
    // Find High, Low, Close for this period
    let high = -Infinity;
    let low = Infinity;
    
    last20.forEach(candle => {
      if (candle.high > high) high = candle.high;
      if (candle.low < low) low = candle.low;
    });
    
    const close = last20[last20.length - 1].close;

    // Standard Pivot Point formulas
    const P = (high + low + close) / 3;
    const R1 = (2 * P) - low;
    const S1 = (2 * P) - high;
    const R2 = P + (high - low);
    const S2 = P - (high - low);
    const R3 = high + 2 * (P - low);
    const S3 = low - 2 * (high - P);

    return { P, R1, R2, R3, S1, S2, S3, currentPrice: close };
  }, [data]);

  if (isLoading) {
    return (
      <div className="mt-6 glass-card p-5 animate-pulse">
        <div className="h-4 w-40 bg-muted/20 rounded mb-6"></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-10 bg-muted/20 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!pivots) return null;

  return (
    <div className="mt-6 glass-card p-5 animate-fade-in-up opacity-0 stagger-5 relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[50px] pointer-events-none" />

      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-6 flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" />
          <path d="m19 9-5 5-4-4-3 3" />
        </svg>
        Technical Levels (Support & Resistance)
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
        {/* Resistance 3 */}
        <LevelCard label="R3" value={pivots.R3} type="resistance" />
        {/* Resistance 2 */}
        <LevelCard label="R2" value={pivots.R2} type="resistance" />
        {/* Resistance 1 */}
        <LevelCard label="R1" value={pivots.R1} type="resistance" />
        
        {/* Pivot */}
        <div className="col-span-2 sm:col-span-4 md:col-span-1 bg-accent/10 border border-accent/20 p-3 rounded-xl flex flex-col items-center justify-center">
          <span className="text-[10px] font-bold text-accent uppercase tracking-wider mb-1">Pivot Point</span>
          <span className="text-sm font-mono font-bold text-foreground">{formatCurrency(pivots.P)}</span>
        </div>

        {/* Support 1 */}
        <LevelCard label="S1" value={pivots.S1} type="support" />
        {/* Support 2 */}
        <LevelCard label="S2" value={pivots.S2} type="support" />
        {/* Support 3 */}
        <LevelCard label="S3" value={pivots.S3} type="support" />
      </div>
    </div>
  );
}

function LevelCard({ label, value, type }: { label: string, value: number, type: "support" | "resistance" }) {
  const isResistance = type === "resistance";
  
  return (
    <div className={cn(
      "p-3 rounded-xl border border-transparent transition-all hover:scale-105 cursor-default",
      isResistance ? "bg-loss/5 hover:border-loss/30 hover:bg-loss/10" : "bg-profit/5 hover:border-profit/30 hover:bg-profit/10"
    )}>
      <div className={cn(
        "text-[11px] font-bold mb-1 flex items-center gap-1",
        isResistance ? "text-loss" : "text-profit"
      )}>
        {isResistance ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        )}
        {label}
      </div>
      <div className="text-sm font-mono font-semibold text-foreground tracking-tight">
        {formatCurrency(value)}
      </div>
    </div>
  );
}
