"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { usePortfolioQuotes } from "@/hooks/usePortfolioQuotes";
import { useTransactions } from "@/context/TransactionContext";
import { useCurrency } from "@/context/CurrencyContext";
import {
  generateLifetimePortfolioData,
  LifetimeTimeFrame,
} from "@/lib/lifetime-portfolio";
import { formatPercent, cn } from "@/lib/utils";

interface Props {
  className?: string;
  showCardWrapper?: boolean;
}

export default function LifetimePortfolioValueChart({
  className,
  showCardWrapper = true,
}: Props) {
  const [timeframe, setTimeframe] = useState<LifetimeTimeFrame>("ALL");
  const [showPortfolio, setShowPortfolio] = useState(true);
  const [showSp500, setShowSp500] = useState(true);
  const [showInvested, setShowInvested] = useState(true);

  const { transactions } = useTransactions();
  const { portfolioStats } = usePortfolioQuotes();
  const { formatCurrency, formatSignedCurrency, currency, exchangeRate, currencySymbol } = useCurrency();

  // Generate historical data
  const { data: rawData, summary } = useMemo(
    () =>
      generateLifetimePortfolioData(
        transactions,
        portfolioStats.totalValue,
        portfolioStats.totalCost,
        timeframe
      ),
    [transactions, portfolioStats.totalValue, portfolioStats.totalCost, timeframe]
  );

  // Convert values according to active currency
  const data = useMemo(() => {
    const rate = currency === "THB" ? exchangeRate : 1;
    return rawData.map((pt) => ({
      ...pt,
      displayPortfolio: pt.portfolioValue * rate,
      displayInvested: pt.invested * rate,
      displaySp500: pt.sp500Value * rate,
    }));
  }, [rawData, currency, exchangeRate]);

  const timeframes: { label: string; value: LifetimeTimeFrame }[] = [
    { label: "7d", value: "7D" },
    { label: "1m", value: "1M" },
    { label: "3m", value: "3M" },
    { label: "6m", value: "6M" },
    { label: "YTD", value: "YTD" },
    { label: "1y", value: "1Y" },
    { label: "5y", value: "5Y" },
    { label: "all", value: "ALL" },
  ];

  const content = (
    <div className={cn("space-y-4", className)}>
      
      {/* 1. Header with Title, Info Icon, and Menu */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <h3 className="text-lg font-bold text-foreground tracking-tight">
            Portfolio value
          </h3>
          <button
            type="button"
            className="text-muted/70 hover:text-foreground transition-colors p-0.5 rounded-full"
            title="Shows your total portfolio market value over time compared against S&P 500 benchmark and invested capital"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-1.5 text-muted hover:text-foreground hover:bg-muted-bg/50 rounded-xl transition-all cursor-pointer"
            title="Options"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
          </button>
        </div>
      </div>

      {/* 2. Outperformance Banner */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-muted-bg/50 border border-border/70 backdrop-blur-md flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="text-base sm:text-lg">🎉</span>
          <p className="text-xs sm:text-sm font-medium text-foreground/95">
            Portfolio is {summary.isAhead ? "ahead of" : "trailing"}{" "}
            <span className="font-bold text-foreground">S&P 500</span> by{" "}
            <span className={cn(
              "font-mono font-bold",
              summary.isAhead ? "text-profit" : "text-loss"
            )}>
              {formatSignedCurrency(summary.outperformanceAmount)} (
              {summary.outperformancePercent >= 0 ? "+" : ""}
              {summary.outperformancePercent.toFixed(2)}%)
            </span>
          </p>
        </div>
      </div>

      {/* 3. Timeframe Pills and Range Performance Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Left: Timeframe Selectors */}
        <div className="flex items-center gap-1 bg-muted-bg/60 p-1 rounded-xl border border-border/50 overflow-x-auto scrollbar-none w-fit">
          {timeframes.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setTimeframe(tf.value)}
              className={cn(
                "px-2.5 py-1 text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer",
                timeframe === tf.value
                  ? "bg-accent/20 text-accent font-bold shadow-sm border border-accent/30"
                  : "text-muted hover:text-foreground"
              )}
            >
              {tf.label}
            </button>
          ))}
          <button
            type="button"
            className="p-1.5 text-muted hover:text-foreground rounded-lg transition-colors cursor-pointer"
            title="Custom Date Range"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </button>
        </div>

        {/* Right: Date Range & Performance Badges */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <span className="text-muted/80 font-medium">
            {summary.formattedRange}
          </span>
          <div className="flex items-center gap-2.5">
            <span className="text-[#00b4d8] font-bold flex items-center gap-1.5" title="Current Portfolio Value">
              <span className="w-2 h-2 rounded-full bg-[#00b4d8]" />
              <span>{formatCurrency(summary.portfolioEnd)}</span>
              <span className={cn("text-[10px] px-1.5 py-0.2 rounded font-mono font-bold", summary.portfolioChangePercent >= 0 ? "bg-profit/15 text-profit" : "bg-loss/15 text-loss")}>
                {summary.portfolioChangePercent >= 0 ? "+" : ""}{summary.portfolioChangePercent.toFixed(2)}%
              </span>
            </span>
            <span className="text-[#fb923c] font-bold flex items-center gap-1.5" title="S&P 500 Benchmark Equivalent">
              <span className="w-2 h-2 rounded-full bg-[#fb923c]" />
              <span>{formatCurrency(summary.sp500End)}</span>
              <span className={cn("text-[10px] px-1.5 py-0.2 rounded font-mono font-bold", summary.sp500ChangePercent >= 0 ? "bg-profit/15 text-profit" : "bg-loss/15 text-loss")}>
                {summary.sp500ChangePercent >= 0 ? "+" : ""}{summary.sp500ChangePercent.toFixed(2)}%
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* 4. Chart Area */}
      <div className="h-[340px] sm:h-[380px] w-full pt-2 -ml-3">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 10, bottom: 5, left: 10 }}
          >
            <defs>
              {/* Portfolio Glow Area Gradient */}
              <linearGradient id="portfolioLifetimeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00b4d8" stopOpacity={0.25} />
                <stop offset="60%" stopColor="#00b4d8" stopOpacity={0.05} />
                <stop offset="100%" stopColor="#00b4d8" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(148, 163, 184, 0.08)"
              vertical={false}
            />

            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(148, 163, 184, 0.7)", fontSize: 11, fontFamily: "var(--font-jetbrains)" }}
              tickFormatter={(val: string) => {
                const d = new Date(val);
                const month = d.toLocaleDateString("en-US", { month: "short" });
                const day = d.getDate();
                return `${month} ${day}`;
              }}
              minTickGap={35}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(148, 163, 184, 0.7)", fontSize: 11, fontFamily: "var(--font-jetbrains)" }}
              tickFormatter={(val: number) => {
                if (val >= 1000000) return `${currencySymbol}${(val / 1000000).toFixed(1)}M`;
                if (val >= 1000) return `${currencySymbol}${(val / 1000).toFixed(0)}k`;
                return `${currencySymbol}${Math.round(val)}`;
              }}
              width={54}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const orig = payload[0]?.payload as (typeof data)[0];
                if (!orig) return null;

                const d = new Date(orig.date);
                const fullDate = d.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                const diff = orig.portfolioValue - orig.sp500Value;
                const isPos = diff >= 0;

                return (
                  <div className="glass-card !rounded-2xl p-4 shadow-2xl border border-border/80 min-w-[240px] text-xs font-mono space-y-2">
                    <div className="text-muted pb-1.5 border-b border-border/40 font-sans font-medium text-[11px]">
                      {fullDate}
                    </div>

                    <div className="space-y-1.5 pt-0.5">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-foreground/90 font-sans">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#00b4d8]" />
                          Portfolio
                        </span>
                        <span className="font-bold text-foreground text-sm tabular-nums">
                          {formatCurrency(orig.portfolioValue)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-foreground/90 font-sans">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#fb923c]" />
                          S&P 500
                        </span>
                        <span className="font-bold text-[#fb923c] tabular-nums">
                          {formatCurrency(orig.sp500Value)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-foreground/90 font-sans">
                          <span className="w-2.5 h-1 border-t-2 border-dashed border-[#a855f7]" />
                          Invested
                        </span>
                        <span className="font-bold text-[#a855f7] tabular-nums">
                          {formatCurrency(orig.invested)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px]">
                      <span className="text-muted font-sans">Vs. S&P 500:</span>
                      <span className={cn("font-bold", isPos ? "text-profit" : "text-loss")}>
                        {isPos ? "+" : ""}{formatCurrency(diff)} ({isPos ? "+" : ""}{((diff / orig.sp500Value) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                );
              }}
            />

            {/* Area Fill for Portfolio */}
            {showPortfolio && (
              <Area
                type="monotone"
                dataKey="displayPortfolio"
                stroke="none"
                fill="url(#portfolioLifetimeGradient)"
                isAnimationActive={false}
              />
            )}

            {/* Line for S&P 500 (Orange) */}
            {showSp500 && (
              <Line
                type="monotone"
                dataKey="displaySp500"
                stroke="#fb923c"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#fb923c", stroke: "var(--card-bg)", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            )}

            {/* Line for Invested Capital (Purple Dashed) */}
            {showInvested && (
              <Line
                type="stepAfter"
                dataKey="displayInvested"
                stroke="#a855f7"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                activeDot={{ r: 4, fill: "#a855f7", stroke: "var(--card-bg)", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            )}

            {/* Line for Portfolio Value (Cyan Blue) */}
            {showPortfolio && (
              <Line
                type="monotone"
                dataKey="displayPortfolio"
                stroke="#00b4d8"
                strokeWidth={2.4}
                dot={false}
                activeDot={{ r: 5, fill: "#00b4d8", stroke: "var(--card-bg)", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 5. Interactive Bottom Legend (Click to Toggle) */}
      <div className="flex items-center justify-center gap-6 pt-2 pb-1 border-t border-border/40 text-xs font-medium select-none">
        {/* Portfolio Toggle */}
        <button
          type="button"
          onClick={() => setShowPortfolio((prev) => !prev)}
          className={cn(
            "flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-100",
            showPortfolio ? "opacity-100 font-bold" : "opacity-40 line-through"
          )}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#00b4d8] shadow-sm" />
          <span className="text-foreground/90">Portfolio</span>
        </button>

        {/* S&P 500 Toggle */}
        <button
          type="button"
          onClick={() => setShowSp500((prev) => !prev)}
          className={cn(
            "flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-100",
            showSp500 ? "opacity-100 font-bold" : "opacity-40 line-through"
          )}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#fb923c] shadow-sm" />
          <span className="text-foreground/90">S&P 500</span>
        </button>

        {/* Invested Toggle */}
        <button
          type="button"
          onClick={() => setShowInvested((prev) => !prev)}
          className={cn(
            "flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-100",
            showInvested ? "opacity-100 font-bold" : "opacity-40 line-through"
          )}
        >
          <span className="w-3 h-1 border-t-2 border-dashed border-[#a855f7]" />
          <span className="text-foreground/90">Invested</span>
        </button>
      </div>

    </div>
  );

  if (!showCardWrapper) return content;

  return (
    <div className="glass-card p-5 sm:p-7 rounded-3xl border border-border/80 shadow-lg relative overflow-hidden animate-fade-in-up">
      {content}
    </div>
  );
}
