"use client";

import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from 'recharts';

interface MarketCapDonutChartProps {
  holdings: any[];
  profiles: Record<string, any>;
  currencySymbol?: string;
}

const MARKET_CAP_COLORS: Record<string, string> = {
  'Mega-Cap (> $200B)': '#6366f1',  // Indigo
  'Large-Cap ($10B-$200B)': '#3b82f6', // Blue
  'Mid-Cap ($2B-$10B)': '#10b981',    // Emerald
  'Small-Cap (< $2B)': '#f59e0b',     // Amber
  'Crypto / Other': '#ec4899',        // Pink
};

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;

  return (
    <g>
      <text x={cx} y={cy - 10} dy={8} textAnchor="middle" fill="var(--foreground)" className="font-bold text-sm">
        {payload.name.split(' ')[0]}
      </text>
      <text x={cx} y={cy + 15} dy={8} textAnchor="middle" fill="var(--muted)" className="text-xs font-mono font-semibold">
        {`${(percent * 100).toFixed(1)}%`}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        className="transition-all duration-300 drop-shadow-[0_0_12px_rgba(99,102,241,0.2)]"
      />
    </g>
  );
};

export default function MarketCapDonutChart({ holdings, profiles, currencySymbol = '$' }: MarketCapDonutChartProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const chartData = React.useMemo(() => {
    if (!holdings || holdings.length === 0) return [];

    const categories: Record<string, number> = {
      'Mega-Cap (> $200B)': 0,
      'Large-Cap ($10B-$200B)': 0,
      'Mid-Cap ($2B-$10B)': 0,
      'Small-Cap (< $2B)': 0,
      'Crypto / Other': 0,
    };

    holdings.forEach(h => {
      const val = h.shares * (h.currentPrice || h.avgCost || 0);
      if (val <= 0) return;

      const mcap = profiles[h.symbol]?.marketCap || 0;
      if (mcap >= 200_000_000_000) {
        categories['Mega-Cap (> $200B)'] += val;
      } else if (mcap >= 10_000_000_000) {
        categories['Large-Cap ($10B-$200B)'] += val;
      } else if (mcap >= 2_000_000_000) {
        categories['Mid-Cap ($2B-$10B)'] += val;
      } else if (mcap > 0) {
        categories['Small-Cap (< $2B)'] += val;
      } else {
        categories['Crypto / Other'] += val;
      }
    });

    return Object.entries(categories)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value,
        color: MARKET_CAP_COLORS[name] || '#94a3b8',
      }));
  }, [holdings, profiles]);

  if (!holdings || holdings.length === 0 || chartData.length === 0) {
    return (
      <div className="bg-card-bg/60 backdrop-blur-md border border-border/70 rounded-2xl p-6 shadow-xl flex items-center justify-center min-h-[350px] text-muted font-mono text-xs">
        No Market Cap data available
      </div>
    );
  }

  return (
    <div className="bg-card-bg/60 backdrop-blur-md border border-border/70 rounded-2xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden min-h-[350px]">
      <div className="flex items-center justify-between mb-2 pb-3 border-b border-border/40">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          Market Cap Diversification
        </h3>
      </div>

      <div className="flex-1 w-full relative min-h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {React.createElement(Pie as any, {
              activeIndex: activeIndex,
              activeShape: renderActiveShape,
              data: chartData,
              cx: "50%",
              cy: "50%",
              innerRadius: 75,
              outerRadius: 100,
              paddingAngle: 2,
              dataKey: "value",
              onMouseEnter: (_: any, index: number) => setActiveIndex(index),
              stroke: "transparent"
            }, chartData.map((entry, index) => (
              <Cell key={`cell-mcap-${index}`} fill={entry.color} />
            )))}
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--card-border)',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
                color: 'var(--foreground)',
                padding: '12px 16px',
                backdropFilter: 'blur(12px)',
              }}
              itemStyle={{ color: 'var(--foreground)', fontWeight: 600 }}
              formatter={(value: any) => [`${currencySymbol}${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Value']}
            />
            <Legend 
              layout="horizontal" 
              verticalAlign="bottom" 
              align="center"
              wrapperStyle={{ paddingTop: '10px' }}
              formatter={(value: any) => (
                <span className="text-xs font-semibold text-foreground/80 ml-1">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
