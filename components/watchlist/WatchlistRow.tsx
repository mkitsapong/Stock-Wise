"use client";

import { useState } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { formatPercent, cn } from "@/lib/utils";
import { useWatchlist } from "@/context/WatchlistContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useRouter } from "next/navigation";
import CompanyLogo from "@/components/common/CompanyLogo";

interface Props {
  item: any;
  index: number;
  onQuickBuy?: (symbol: string, price: number, name?: string) => void;
}

export default function WatchlistRow({ item, index, onQuickBuy }: Props) {
  const router = useRouter();
  const { removeFromWatchlist, updateTargetPrice } = useWatchlist();
  const { formatCurrency, formatSignedCurrency } = useCurrency();
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [newTarget, setNewTarget] = useState(item.targetBuyPrice ? String(item.targetBuyPrice) : "");

  const hasTarget = item.targetBuyPrice !== null && item.targetBuyPrice > 0;
  const isAboveTarget = hasTarget && item.currentPrice > item.targetBuyPrice;
  const isPositiveDay = item.dayChange >= 0;
  const distanceFromTarget = hasTarget ? ((item.currentPrice - item.targetBuyPrice) / item.targetBuyPrice) * 100 : 0;
  const isNearTarget = hasTarget && Math.abs(distanceFromTarget) <= 3; // within 3%

  // Transform sparkline data for recharts
  const chartData = (item.sparklineData || []).map((price: number, i: number) => ({ i, price }));
  const isSparklinePositive = chartData.length > 0 && chartData[chartData.length - 1].price >= chartData[0].price;
  const sparklineColor = isSparklinePositive ? "var(--profit)" : "var(--loss)";
  const gradientId = `sparkline-gradient-${item.symbol}-${index}`;

  const handleSaveTarget = () => {
    const val = parseFloat(newTarget);
    if (!isNaN(val) && val > 0) {
      updateTargetPrice(item.symbol, val);
    } else {
      updateTargetPrice(item.symbol, null);
    }
    setIsEditingTarget(false);
  };

  const handleRowClick = (e: React.MouseEvent) => {
    // Avoid triggering navigation when clicking interactive buttons or inputs
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input")) return;
    router.push(`/?symbol=${item.symbol}`);
  };

  return (
    <tr 
      onClick={handleRowClick}
      className="border-b border-border/50 hover:bg-card-hover/90 transition-all duration-200 cursor-pointer group"
    >
      {/* Symbol & Name */}
      <td className="py-3.5 px-4 align-middle">
        <div className="flex items-center gap-3">
          <CompanyLogo symbol={item.symbol} name={item.name} size="md" className="group-hover:scale-105 transition-transform duration-200 shadow-xs" />
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-foreground font-mono group-hover:text-accent transition-colors duration-200">{item.symbol}</p>
              {isNearTarget && (
                <span className="flex h-2 w-2 relative" title="Near Target Buy Price">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </div>
            <p className="text-xs text-muted truncate max-w-[140px] font-medium">{item.name || "Unknown Company"}</p>
          </div>
        </div>
      </td>

      {/* 7D Trend Area Sparkline */}
      <td className="py-3.5 px-4 align-middle w-[130px]">
        <div className="h-[38px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparklineColor} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={sparklineColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="price"
                stroke={sparklineColor}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </td>

      {/* Price & Day Change */}
      <td className="py-3.5 px-4 align-middle text-right">
        <p className="text-sm font-bold font-mono text-foreground tabular-nums">
          {formatCurrency(item.currentPrice)}
        </p>
        <p className={cn("text-xs font-mono font-medium mt-0.5 tabular-nums flex items-center justify-end gap-1", isPositiveDay ? "text-profit" : "text-loss")}>
          <span>{isPositiveDay ? "▲" : "▼"}</span>
          <span>{formatSignedCurrency(item.dayChange)}</span>
          <span className="opacity-80">({formatPercent(item.dayChangePercent)})</span>
        </p>
      </td>

      {/* Target Price & Distance Gauge */}
      <td className="py-3.5 px-4 align-middle w-[220px]">
        {isEditingTarget ? (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <input 
              type="number" 
              className="w-24 bg-card-bg border border-accent rounded-lg px-2.5 py-1 text-xs font-mono text-foreground outline-none shadow-sm focus:ring-2 focus:ring-accent/30 transition-all"
              placeholder="Target..."
              value={newTarget}
              onChange={e => setNewTarget(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSaveTarget();
                if (e.key === 'Escape') setIsEditingTarget(false);
              }}
              autoFocus
            />
            <button 
              onClick={handleSaveTarget} 
              className="px-2.5 py-1 bg-accent text-white rounded-lg text-xs font-bold hover:bg-accent/90 transition-all shadow-sm cursor-pointer active:scale-95"
            >
              Save
            </button>
            <button 
              onClick={() => setIsEditingTarget(false)} 
              className="px-2 py-1 text-muted hover:text-foreground text-xs font-medium cursor-pointer"
            >
              ✕
            </button>
          </div>
        ) : (
          <div 
            className="flex flex-col group/target cursor-pointer p-1.5 rounded-xl hover:bg-muted-bg/60 transition-all duration-200" 
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingTarget(true);
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {hasTarget ? (
                  <span className="text-sm font-bold font-mono text-foreground tabular-nums">
                    {formatCurrency(item.targetBuyPrice)}
                  </span>
                ) : (
                  <span className="text-xs font-medium text-muted/70 italic flex items-center gap-1">
                    <span>+ Set Target</span>
                  </span>
                )}
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover/target:opacity-100 transition-opacity text-accent"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </div>

              {hasTarget && (
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase px-2 py-0.5 rounded-md font-mono border transition-colors",
                    isAboveTarget 
                      ? "bg-loss/10 text-loss border-loss/20" 
                      : "bg-profit/10 text-profit border-profit/20"
                  )}
                >
                  {isAboveTarget ? "Above" : "Below"} {distanceFromTarget > 0 ? "+" : ""}{distanceFromTarget.toFixed(1)}%
                </span>
              )}
            </div>

            {/* Mini Visual Target Bar */}
            {hasTarget && (
              <div className="w-full bg-border/40 h-1.5 rounded-full overflow-hidden mt-1.5">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-500 ease-out",
                    isAboveTarget ? "bg-loss shadow-xs shadow-loss/50" : "bg-profit shadow-xs shadow-profit/50"
                  )}
                  style={{ 
                    width: `${Math.min(100, Math.max(10, 100 - Math.abs(distanceFromTarget)))}%` 
                  }}
                />
              </div>
            )}
          </div>
        )}
      </td>

      {/* Actions */}
      <td className="py-3.5 px-4 align-middle text-right">
        <div className="flex items-center justify-end gap-1.5">
          {/* 🚀 Quick Buy Action */}
          {onQuickBuy && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickBuy(item.symbol, item.currentPrice, item.name);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all duration-200 shadow-xs cursor-pointer hover:scale-105 active:scale-95 text-xs font-semibold"
              title={`Quick Buy ${item.symbol}`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Buy</span>
            </button>
          )}

          <button 
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/?symbol=${item.symbol}`);
            }}
            className="p-1.5 rounded-lg bg-card-bg/90 border border-border/70 text-muted hover:text-accent hover:border-accent/40 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-xs cursor-pointer hover:scale-105 active:scale-95"
            title="Open Interactive Chart"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              removeFromWatchlist(item.symbol);
            }}
            className="p-1.5 rounded-lg bg-card-bg/90 border border-border/70 text-muted hover:text-loss hover:border-loss/50 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-xs cursor-pointer hover:scale-105 active:scale-95"
            title="Remove from Watchlist"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </td>
    </tr>
  );
}

