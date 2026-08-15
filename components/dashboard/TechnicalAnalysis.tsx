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

    const isAbovePivot = close >= P;
    const pivotDistancePercent = ((close - P) / P) * 100;

    return { P, R1, R2, R3, S1, S2, S3, currentPrice: close, isAbovePivot, pivotDistancePercent };
  }, [data]);

  if (isLoading) {
    return (
      <div className="mt-6 glass-card p-6 animate-pulse">
        <div className="h-5 w-48 bg-muted/20 rounded mb-6"></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-16 bg-muted/20 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!pivots) return null;

  return (
    <div className="mt-6 glass-card p-5 sm:p-6 animate-fade-in-up opacity-0 stagger-5 relative overflow-hidden">
      {/* Decorative ambient gradient */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-[60px] pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Technical Support & Resistance (Pivot Levels)
            </h3>
            <p className="text-xs text-muted font-medium">Standard 20-Day Pivot Calculation</p>
          </div>
        </div>

        {/* Pivot Bias Tag */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-mono font-bold border flex items-center gap-1.5",
              pivots.isAbovePivot
                ? "bg-profit/10 text-profit border-profit/20"
                : "bg-loss/10 text-loss border-loss/20"
            )}
          >
            <span>{pivots.isAbovePivot ? "▲ Above Pivot" : "▼ Below Pivot"}</span>
            <span className="opacity-80">({pivots.pivotDistancePercent > 0 ? "+" : ""}{pivots.pivotDistancePercent.toFixed(1)}%)</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
        {/* Resistance 3 */}
        <LevelCard label="R3 (Max Resistance)" shortLabel="R3" value={pivots.R3} type="resistance" currentPrice={pivots.currentPrice} />
        {/* Resistance 2 */}
        <LevelCard label="R2 (Major Resistance)" shortLabel="R2" value={pivots.R2} type="resistance" currentPrice={pivots.currentPrice} />
        {/* Resistance 1 */}
        <LevelCard label="R1 (Near Resistance)" shortLabel="R1" value={pivots.R1} type="resistance" currentPrice={pivots.currentPrice} />
        
        {/* Pivot */}
        <div className="col-span-2 sm:col-span-4 md:col-span-1 bg-gradient-to-b from-accent/15 to-accent/5 border border-accent/30 p-3.5 rounded-xl flex flex-col items-center justify-center shadow-sm">
          <span className="text-[10px] font-extrabold text-accent uppercase tracking-wider mb-0.5">Pivot Point</span>
          <span className="text-sm font-mono font-extrabold text-foreground tabular-nums">{formatCurrency(pivots.P)}</span>
        </div>

        {/* Support 1 */}
        <LevelCard label="S1 (Near Support)" shortLabel="S1" value={pivots.S1} type="support" currentPrice={pivots.currentPrice} />
        {/* Support 2 */}
        <LevelCard label="S2 (Major Support)" shortLabel="S2" value={pivots.S2} type="support" currentPrice={pivots.currentPrice} />
        {/* Support 3 */}
        <LevelCard label="S3 (Max Support)" shortLabel="S3" value={pivots.S3} type="support" currentPrice={pivots.currentPrice} />
      </div>
    </div>
  );
}

function LevelCard({ 
  label, 
  shortLabel, 
  value, 
  type,
  currentPrice 
}: { 
  label: string; 
  shortLabel: string; 
  value: number; 
  type: "support" | "resistance";
  currentPrice: number;
}) {
  const isResistance = type === "resistance";
  const isPassed = isResistance ? currentPrice >= value : currentPrice <= value;
  
  return (
    <div className={cn(
      "p-3.5 rounded-xl border transition-all hover:scale-[1.03] cursor-default relative overflow-hidden",
      isResistance 
        ? "bg-loss/5 border-loss/15 hover:border-loss/35 hover:bg-loss/10" 
        : "bg-profit/5 border-profit/15 hover:border-profit/35 hover:bg-profit/10",
      isPassed && "ring-1 ring-offset-0 " + (isResistance ? "ring-loss/40" : "ring-profit/40")
    )}
    title={label}
    >
      <div className={cn(
        "text-[11px] font-bold mb-1 flex items-center justify-between",
        isResistance ? "text-loss" : "text-profit"
      )}>
        <span className="flex items-center gap-1 font-mono">
          {isResistance ? (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
          ) : (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          )}
          {shortLabel}
        </span>
        {isPassed && (
          <span className="text-[9px] uppercase font-bold px-1 rounded bg-current/10">Passed</span>
        )}
      </div>
      <div className="text-sm font-mono font-bold text-foreground tracking-tight tabular-nums">
        {formatCurrency(value)}
      </div>
    </div>
  );
}

