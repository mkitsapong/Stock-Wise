"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface TopHoldingsBarChartProps {
  data: { symbol: string; value: number; color?: string }[];
  title: string;
  currencySymbol?: string;
}

// Vibrant color palette
const COLORS = [
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#f59e0b', // amber-500
  '#10b981', // emerald-500
];

const CustomTooltip = ({ active, payload, label, currencySymbol }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card-bg/95 border border-border/80 p-3 rounded-xl shadow-xl backdrop-blur-md">
        <p className="text-foreground font-bold mb-1">{label}</p>
        <p className="text-accent font-mono text-sm font-semibold">
          {currencySymbol}{payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

export default function TopHoldingsBarChart({ data, title, currencySymbol = '$' }: TopHoldingsBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-muted font-mono text-sm">
        No data available
      </div>
    );
  }

  // Pre-process data
  const chartData = data
    .sort((a, b) => b.value - a.value)
    .slice(0, 5) // Top 5
    .map((item, index) => ({
      ...item,
      color: item.color || COLORS[index % COLORS.length]
    }));

  return (
    <div className="flex flex-col w-full h-full min-h-[350px]">
      <h3 className="text-lg font-bold text-foreground mb-4 pl-2 border-l-4 border-emerald-500">
        {title}
      </h3>
      <div className="flex-1 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" opacity={0.7} />
            <XAxis 
              type="number" 
              hide 
            />
            <YAxis 
              dataKey="symbol" 
              type="category" 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: 'var(--foreground)', fontWeight: 700, fontSize: 13 }}
              width={65}
            />
            <Tooltip content={<CustomTooltip currencySymbol={currencySymbol} />} cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }} />
            <Bar 
              dataKey="value" 
              radius={[0, 6, 6, 0]}
              barSize={32}
              className="drop-shadow-md"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
