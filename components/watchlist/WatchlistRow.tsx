"use client";

import { useState } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { formatCurrency, formatPercent, formatSignedCurrency, cn } from "@/lib/utils";
import { useWatchlist } from "@/context/WatchlistContext";

interface Props {
  item: any;
  index: number;
}

export default function WatchlistRow({ item, index }: Props) {
  const { removeFromWatchlist, updateTargetPrice } = useWatchlist();
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [newTarget, setNewTarget] = useState(item.targetBuyPrice ? String(item.targetBuyPrice) : "");

  const hasTarget = item.targetBuyPrice !== null && item.targetBuyPrice > 0;
  const isAboveTarget = hasTarget && item.currentPrice > item.targetBuyPrice;
  const isPositiveDay = item.dayChange >= 0;
  const distanceFromTarget = hasTarget ? ((item.currentPrice - item.targetBuyPrice) / item.targetBuyPrice) * 100 : 0;

  // Transform sparkline data for recharts
  const chartData = (item.sparklineData || []).map((price: number, i: number) => ({ i, price }));
  const sparklineColor = chartData.length > 0 && chartData[chartData.length - 1].price >= chartData[0].price
    ? "var(--profit)"
    : "var(--loss)";

  const handleSaveTarget = () => {
    const val = parseFloat(newTarget);
    if (!isNaN(val) && val > 0) {
      updateTargetPrice(item.symbol, val);
    } else {
      updateTargetPrice(item.symbol, null);
    }
    setIsEditingTarget(false);
  };

  return (
    <tr className="border-b border-border hover:bg-white/[0.02] transition-colors group">
      {/* Symbol & Name */}
      <td className="py-4 px-4 align-middle">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-accent">{item.symbol.slice(0, 2)}</span>
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{item.symbol}</p>
            <p className="text-xs text-muted truncate max-w-[120px]">{item.name || "Unknown Company"}</p>
          </div>
        </div>
      </td>

      {/* Sparkline */}
      <td className="py-4 px-4 align-middle w-[120px]">
        <div className="h-[40px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Line
                type="monotone"
                dataKey="price"
                stroke={sparklineColor}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </td>

      {/* Price & Change */}
      <td className="py-4 px-4 align-middle text-right">
        <p className="text-sm font-bold font-mono text-foreground">
          {formatCurrency(item.currentPrice)}
        </p>
        <p className={cn("text-xs font-mono mt-0.5", isPositiveDay ? "text-profit" : "text-loss")}>
          {formatSignedCurrency(item.dayChange)} ({formatPercent(item.dayChangePercent)})
        </p>
      </td>

      {/* Target Price */}
      <td className="py-4 px-4 align-middle w-[200px]">
        {isEditingTarget ? (
          <div className="flex items-center gap-2">
             <input 
               type="number" 
               className="w-20 bg-card-bg border border-border rounded-md px-2 py-1 text-xs font-mono text-foreground outline-none focus:border-accent"
               placeholder="Target..."
               value={newTarget}
               onChange={e => setNewTarget(e.target.value)}
               onKeyDown={e => e.key === 'Enter' && handleSaveTarget()}
               autoFocus
             />
             <button onClick={handleSaveTarget} className="px-2 py-1 bg-accent/20 text-accent rounded-md text-xs font-bold hover:bg-accent hover:text-white transition-colors">
               Save
             </button>
          </div>
        ) : (
          <div className="flex flex-col group/target cursor-pointer" onClick={() => setIsEditingTarget(true)}>
            <div className="flex items-center gap-1">
              {hasTarget ? (
                 <span className="text-sm font-bold font-mono text-foreground">
                   {formatCurrency(item.targetBuyPrice)}
                 </span>
              ) : (
                 <span className="text-xs font-medium text-muted italic">Not set (Click)</span>
              )}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover/target:opacity-100 transition-opacity text-muted"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </div>
            
            {hasTarget && (
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={cn(
                    "text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded",
                    isAboveTarget ? "bg-loss/10 text-loss" : "bg-profit/10 text-profit"
                  )}
                >
                  {isAboveTarget ? "Above" : "Below"}
                </span>
                <span className={cn(
                  "text-xs font-mono font-semibold",
                  distanceFromTarget > 0 ? "text-loss" : "text-profit"
                )}>
                  {distanceFromTarget > 0 ? "+" : ""}{distanceFromTarget.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        )}
      </td>

      {/* Actions */}
      <td className="py-4 px-4 align-middle text-right">
        <button 
          onClick={() => removeFromWatchlist(item.symbol)}
          className="p-1.5 rounded-md bg-card-bg border border-border text-muted hover:text-loss hover:border-loss/50 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Remove from Watchlist"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </td>
    </tr>
  );
}
