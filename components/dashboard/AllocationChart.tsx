"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { getSectorAllocation, SECTOR_COLORS as MOCK_COLORS } from "@/lib/mock-data";
import { usePortfolioQuotes } from "@/hooks/usePortfolioQuotes";
import { calculateSectorBreakdown } from "@/lib/diversification";
import { useCurrency } from "@/context/CurrencyContext";
import { formatPercent } from "@/lib/utils";

export default function AllocationChart() {
  const { holdings } = usePortfolioQuotes();
  const { formatCurrency } = useCurrency();
  
  const liveSectors = calculateSectorBreakdown(holdings);
  const data = liveSectors.length > 0
    ? liveSectors.map((s) => ({ name: s.name, value: s.value, color: s.color }))
    : getSectorAllocation().map((s) => ({ name: s.name, value: s.value, color: MOCK_COLORS[s.name] || "#6366f1" }));

  const total = data.reduce((sum, d) => sum + d.value, 0);

  const FALLBACK_COLORS = ["#6366f1", "#06b6d4", "#f59e0b", "#8b5cf6", "#10b981", "#ec4899"];

  return (
    <div className="glass-card p-4 animate-fade-in-up opacity-0 stagger-4">
      {/* Header */}
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-6">
        Asset Allocation
      </h3>

      {/* Chart */}
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="85%"
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={entry.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0];
                const pct = ((item.value as number) / total) * 100;
                return (
                  <div className="glass-card !rounded-xl px-4 py-3 shadow-2xl">
                    <p className="text-xs font-semibold text-foreground">{item.name}</p>
                    <p className="text-sm font-mono text-muted mt-0.5">
                      {formatCurrency(item.value as number)} · {formatPercent(pct).replace("+", "")}
                    </p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-2">
        {data.map((item, index) => {
          const pct = ((item.value / total) * 100);
          return (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor:
                      item.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length],
                  }}
                />
                <span className="text-foreground/80">{item.name}</span>
              </div>
              <span className="font-mono text-muted text-xs">{pct.toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
