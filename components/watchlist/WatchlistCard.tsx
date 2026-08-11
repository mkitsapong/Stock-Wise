"use client";

import { LineChart, Line, ResponsiveContainer } from "recharts";
import { formatCurrency, formatPercent, formatSignedCurrency, cn } from "@/lib/utils";
import type { WatchlistItem } from "@/lib/mock-data";

interface Props {
  item: WatchlistItem;
  index: number;
}

export default function WatchlistCard({ item, index }: Props) {
  const isAboveTarget = item.currentPrice > item.targetBuyPrice;
  const isPositiveDay = item.dayChange >= 0;
  const distanceFromTarget = ((item.currentPrice - item.targetBuyPrice) / item.targetBuyPrice) * 100;

  // Transform sparkline data for recharts
  const chartData = item.sparklineData.map((price, i) => ({ i, price }));
  const sparklineColor = item.sparklineData[item.sparklineData.length - 1] >= item.sparklineData[0]
    ? "var(--profit)"
    : "var(--loss)";

  return (
    <div
      className={cn(
        "glass-card p-5 animate-fade-in-up opacity-0",
        index === 0 && "stagger-1",
        index === 1 && "stagger-2",
        index === 2 && "stagger-3",
        index === 3 && "stagger-4",
        index === 4 && "stagger-5",
        index >= 5 && "stagger-5"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <span className="text-sm font-bold text-accent">{item.symbol.slice(0, 2)}</span>
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{item.symbol}</p>
            <p className="text-xs text-muted truncate max-w-[140px]">{item.name}</p>
          </div>
        </div>
        <span
          className={cn(
            "text-[10px] font-semibold uppercase px-2.5 py-1 rounded-lg",
            isAboveTarget
              ? "bg-loss/10 text-loss"
              : "bg-profit/10 text-profit"
          )}
        >
          {isAboveTarget ? "Above Target" : "Below Target"}
        </span>
      </div>

      {/* Price and Change */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="text-2xl font-bold font-mono text-foreground">
            {formatCurrency(item.currentPrice)}
          </p>
          <p className={cn("text-xs font-mono mt-0.5", isPositiveDay ? "text-profit" : "text-loss")}>
            {formatSignedCurrency(item.dayChange)} ({formatPercent(item.dayChangePercent)})
          </p>
        </div>
      </div>

      {/* Sparkline */}
      <div className="h-[60px] -mx-1 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <Line
              type="monotone"
              dataKey="price"
              stroke={sparklineColor}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Target Price */}
      <div className="p-3 rounded-xl bg-muted-bg/50 border border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted uppercase tracking-wider">Target Buy Price</p>
            <p className="text-lg font-bold font-mono text-foreground mt-0.5">
              {formatCurrency(item.targetBuyPrice)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted">Distance</p>
            <p className={cn(
              "text-sm font-mono font-semibold",
              distanceFromTarget > 0 ? "text-loss" : "text-profit"
            )}>
              {distanceFromTarget > 0 ? "+" : ""}{distanceFromTarget.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
