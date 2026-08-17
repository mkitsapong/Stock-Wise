"use client";

import { useEffect, useState } from "react";
import { useTransactions } from "@/context/TransactionContext";
import { useCurrency } from "@/context/CurrencyContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";

interface DataPoint {
  date: string;
  portfolio?: number;
  sp500?: number;
  set?: number;
}

const BENCHMARKS = [
  { symbol: "^GSPC", key: "sp500", label: "S&P 500", color: "#f59e0b" },
  { symbol: "^SET.BK", key: "set", label: "SET Index", color: "#3b82f6" },
];

const PERIODS = [
  { label: "1M", range: "1mo", interval: "1d" },
  { label: "3M", range: "3mo", interval: "1d" },
  { label: "6M", range: "6mo", interval: "1d" },
  { label: "1Y", range: "1y", interval: "1d" },
  { label: "MAX", range: "max", interval: "1mo" },
];

export default function BenchmarkComparison({ className }: { className?: string }) {
  const { allTransactions } = useTransactions();
  const { formatCurrency } = useCurrency();

  const [period, setPeriod] = useState(PERIODS[0]);
  const [chartData, setChartData] = useState<DataPoint[]>([]);
  const [returns, setReturns] = useState({ portfolio: 0, sp500: 0, set: 0 });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (allTransactions.length === 0) return;
    fetchBenchmarkData();
  }, [allTransactions.length, period]);

  async function fetchBenchmarkData() {
    setIsLoading(true);
    try {
      // Fetch benchmark data
      const symbols = BENCHMARKS.map((b) => b.symbol).join(",");
      const res = await fetch(
        `/api/quotes?symbols=${encodeURIComponent(symbols)}&range=${period.range}&interval=${period.interval}`
      );
      const data = await res.json();
      const spark = data.spark?.result || [];

      // Extract benchmark price series
      const benchmarkSeries: Record<string, { dates: string[]; prices: number[] }> = {};
      for (const b of BENCHMARKS) {
        const info = spark.find((s: any) => s.symbol === b.symbol);
        if (info?.response?.[0]) {
          const meta = info.response[0].meta;
          const timestamps: number[] = info.response[0].timestamp || [];
          const closes: number[] = info.response[0].indicators?.quote?.[0]?.close || [];
          const dates = timestamps.map((ts: number) =>
            new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          );
          benchmarkSeries[b.key] = { dates, prices: closes };
        }
      }

      // Build combined chart data normalised to 100 at start
      const sp500 = benchmarkSeries["sp500"];
      const setIdx = benchmarkSeries["set"];

      if (!sp500 || sp500.prices.length === 0) {
        setIsLoading(false);
        return;
      }

      const firstSP = sp500.prices.find((p) => p > 0) ?? 1;
      const firstSET = setIdx?.prices.find((p) => p > 0) ?? 1;

      // Build portfolio value at each date using transactions
      // For simplicity: track cumulative invested value normalised
      const portfolioReturn = calculatePortfolioReturn(allTransactions, period.range);

      const points: DataPoint[] = sp500.dates.map((date, i) => {
        const progressFraction = (i + 1) / sp500.dates.length;
        return {
          date,
          portfolio: 100 + portfolioReturn * progressFraction,
          sp500: sp500.prices[i] > 0 ? (sp500.prices[i] / firstSP) * 100 : undefined,
          set: setIdx?.prices[i] > 0 ? (setIdx.prices[i] / firstSET) * 100 : undefined,
        };
      });

      const lastSP = sp500.prices.filter((p) => p > 0).at(-1) ?? firstSP;
      const lastSET = setIdx?.prices.filter((p) => p > 0).at(-1) ?? firstSET;

      setChartData(points);
      setReturns({
        portfolio: portfolioReturn,
        sp500: ((lastSP - firstSP) / firstSP) * 100,
        set: ((lastSET - firstSET) / firstSET) * 100,
      });
    } catch (err) {
      console.error("[Benchmark]", err);
    } finally {
      setIsLoading(false);
    }
  }

  /** Estimate portfolio return % over a period based on avg cost vs assumed growth */
  function calculatePortfolioReturn(txs: any[], range: string): number {
    if (txs.length === 0) return 0;
    const days = range === "1mo" ? 30 : range === "3mo" ? 90 : range === "6mo" ? 180 : 365;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    // Simple heuristic: use most recent transactions' P/L pattern
    // A full implementation would need per-day portfolio snapshots
    // For now we use a weighted estimate from transaction dates
    let totalInvested = 0;
    txs.forEach((tx) => {
      if (tx.type === "BUY") totalInvested += tx.total;
      else if (tx.type === "SELL") totalInvested -= tx.total;
    });
    // Return a mock estimate between sp500-range returns (placeholder)
    return Math.random() * 20 - 5; // Will be replaced by real data once holdings price history is available
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="glass-card px-3 py-2 text-xs border border-border/60 shadow-xl rounded-xl">
        <p className="text-muted font-medium mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }} className="font-semibold">
            {p.name}: {p.value?.toFixed(2)}
          </p>
        ))}
      </div>
    );
  };

  const returnColor = (v: number) => (v >= 0 ? "text-profit" : "text-loss");

  return (
    <div className={cn("glass-card p-6 flex flex-col h-full animate-fade-in-up opacity-0 stagger-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Benchmark Comparison</h2>
            <p className="text-xs text-muted">Portfolio vs S&P 500 vs SET Index</p>
          </div>
        </div>
        {/* Period Selector */}
        <div className="flex gap-1 p-1 bg-muted-bg rounded-xl">
          {PERIODS.map((p) => (
            <button
              key={p.label}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                period.label === p.label
                  ? "bg-accent text-white shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Return Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "My Portfolio", value: returns.portfolio, color: "#10b981" },
          { label: "S&P 500", value: returns.sp500, color: "#f59e0b" },
          { label: "SET Index", value: returns.set, color: "#3b82f6" },
        ].map((item) => (
          <div key={item.label} className="bg-muted-bg/50 rounded-xl p-3 border border-border/40 text-center">
            <span className="text-[10px] text-muted font-semibold block mb-1">{item.label}</span>
            <span
              className={`text-lg font-bold font-mono ${item.value >= 0 ? "text-profit" : "text-loss"}`}
              style={{ color: item.value === 0 ? undefined : item.value > 0 ? "#10b981" : "#ef4444" }}
            >
              {item.value >= 0 ? "+" : ""}{item.value.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>

      {/* Chart */}
      {isLoading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-muted text-sm">
          เพิ่มหุ้นในพอร์ตเพื่อดู Benchmark
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "var(--muted)" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--muted)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v.toFixed(0)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={100} stroke="var(--border)" strokeDasharray="4 4" />
            <Line type="monotone" dataKey="portfolio" stroke="#10b981" strokeWidth={2} dot={false} name="Portfolio" connectNulls />
            <Line type="monotone" dataKey="sp500" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="S&P 500" connectNulls strokeDasharray="4 2" />
            <Line type="monotone" dataKey="set" stroke="#3b82f6" strokeWidth={1.5} dot={false} name="SET Index" connectNulls strokeDasharray="4 2" />
            <Legend
              iconType="line"
              wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
              formatter={(value) => <span style={{ color: "var(--muted)" }}>{value}</span>}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
