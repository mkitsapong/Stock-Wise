"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getGrowthData } from "@/lib/mock-data";
import { formatCurrency, cn } from "@/lib/utils";

type Period = "1M" | "6M" | "YTD";

export default function PortfolioChart() {
  const [period, setPeriod] = useState<Period>("6M");
  const data = getGrowthData(period);

  return (
    <div className="glass-card p-4 animate-fade-in-up opacity-0 stagger-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Portfolio Growth
          </h3>
        </div>
        <div className="flex gap-1 bg-muted-bg rounded-xl p-1">
          {(["1M", "6M", "YTD"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200",
                period === p
                  ? "bg-accent text-white shadow-md"
                  : "text-muted hover:text-foreground"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-[240px] -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--chart-grid)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              tickFormatter={(val: string) => {
                const d = new Date(val);
                return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              }}
              interval="preserveStartEnd"
              minTickGap={50}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              tickFormatter={(val: number) => `$${(val / 1000).toFixed(0)}k`}
              width={50}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="glass-card !rounded-xl px-4 py-3 shadow-2xl">
                    <p className="text-xs text-muted mb-1">{label}</p>
                    <p className="text-sm font-bold font-mono text-foreground">
                      {formatCurrency(payload[0].value as number)}
                    </p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--accent)"
              strokeWidth={2.5}
              fill="url(#portfolioGradient)"
              dot={false}
              activeDot={{
                r: 5,
                strokeWidth: 2,
                stroke: "var(--accent)",
                fill: "var(--card-bg)",
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
