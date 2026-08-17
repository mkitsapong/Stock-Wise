"use client";

import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from 'recharts';

interface AllocationDonutChartProps {
  data: { name: string; value: number; color?: string }[];
  title: string;
  currencySymbol?: string;
}

// Vibrant color palette for charts
const COLORS = [
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#f59e0b', // amber-500
  '#10b981', // emerald-500
  '#06b6d4', // cyan-500
  '#f43f5e', // rose-500
  '#eab308', // yellow-500
  '#6366f1', // indigo-500
  '#14b8a6', // teal-500
];

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;

  return (
    <g>
      <text x={cx} y={cy - 10} dy={8} textAnchor="middle" fill="var(--foreground)" className="font-bold text-base">
        {payload.name}
      </text>
      <text x={cx} y={cy + 15} dy={8} textAnchor="middle" fill="var(--muted)" className="text-xs font-mono font-semibold">
        {`${(percent * 100).toFixed(1)}%`}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        className="transition-all duration-300 drop-shadow-[0_0_12px_rgba(99,102,241,0.25)]"
      />
    </g>
  );
};

export default function AllocationDonutChart({ data, title, currencySymbol = '$' }: AllocationDonutChartProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-muted font-mono text-sm">
        No data available
      </div>
    );
  }

  // Pre-process data to ensure colors
  const chartData = data
    .sort((a, b) => b.value - a.value)
    .map((item, index) => ({
      ...item,
      color: item.color || COLORS[index % COLORS.length]
    }));

  return (
    <div className="flex flex-col w-full h-full min-h-[350px]">
      <h3 className="text-lg font-bold text-foreground mb-4 pl-2 border-l-4 border-accent">
        {title}
      </h3>
      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {React.createElement(Pie as any, {
              activeIndex: activeIndex,
              activeShape: renderActiveShape,
              data: chartData,
              cx: "50%",
              cy: "50%",
              innerRadius: 90,
              outerRadius: 120,
              paddingAngle: 2,
              dataKey: "value",
              onMouseEnter: onPieEnter,
              stroke: "transparent"
            }, chartData.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
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
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value: any, entry: any) => (
                <span className="text-xs font-semibold text-foreground/80 ml-1">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
