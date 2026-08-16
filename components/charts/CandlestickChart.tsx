"use client";

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import {
  createChart,
  CandlestickSeries,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type DeepPartial,
  type ChartOptions,
} from "lightweight-charts";
import { useTheme } from "@/components/layout/ThemeProvider";
import { useCurrency } from "@/context/CurrencyContext";
import CompanyLogo from "@/components/common/CompanyLogo";


// ============================================================
// Types
// ============================================================

export interface CandlestickDataPoint {
  date: string | number;   // "YYYY-MM-DD" format or unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
}

interface CandlestickChartProps {
  /** Array of OHLC data points sorted by date ascending */
  data: CandlestickDataPoint[];
  /** Chart height in pixels (default: 400) */
  height?: number;
  /** Show volume-like color intensity (default: true) */
  showGrid?: boolean;
  /** Optional title displayed above the chart */
  title?: string;
  /** Optional symbol name displayed as subtitle */
  symbol?: string;
  /** Current timeframe (controlled component) */
  timeFrame?: string;
  /** Callback when timeframe changes */
  onTimeFrameChange?: (tf: string) => void;
  /** Optional action element to render in the header */
  headerAction?: React.ReactNode;
}

// ============================================================
// Theme Configs
// ============================================================

function getChartOptions(isDark: boolean): DeepPartial<ChartOptions> {
  return {
    layout: {
      background: {
        type: ColorType.Solid,
        color: "transparent",
      },
      textColor: isDark ? "#94a3b8" : "#64748b",
      fontFamily: "'Inter', sans-serif",
      fontSize: 12,
    },
    grid: {
      vertLines: {
        color: isDark ? "rgba(148, 163, 184, 0.06)" : "rgba(148, 163, 184, 0.15)",
      },
      horzLines: {
        color: isDark ? "rgba(148, 163, 184, 0.06)" : "rgba(148, 163, 184, 0.15)",
      },
    },
    crosshair: {
      mode: 0, // Normal
      vertLine: {
        color: isDark ? "rgba(129, 140, 248, 0.4)" : "rgba(99, 102, 241, 0.4)",
        width: 1,
        style: 2, // Dashed
        labelBackgroundColor: isDark ? "#1e293b" : "#f1f5f9",
      },
      horzLine: {
        color: isDark ? "rgba(129, 140, 248, 0.4)" : "rgba(99, 102, 241, 0.4)",
        width: 1,
        style: 2,
        labelBackgroundColor: isDark ? "#1e293b" : "#f1f5f9",
      },
    },
    timeScale: {
      borderColor: isDark ? "rgba(148, 163, 184, 0.1)" : "rgba(148, 163, 184, 0.2)",
      timeVisible: false,
      rightOffset: 5,
      barSpacing: 8,
    },
    rightPriceScale: {
      borderColor: isDark ? "rgba(148, 163, 184, 0.1)" : "rgba(148, 163, 184, 0.2)",
    },
    handleScroll: {
      mouseWheel: true,
      pressedMouseMove: true,
      horzTouchDrag: true,
      vertTouchDrag: false,
    },
    handleScale: {
      axisPressedMouseMove: true,
      mouseWheel: true,
      pinch: true,
    },
  };
}

const CANDLE_COLORS = {
  dark: {
    upColor: "#34d399",          // emerald-400
    downColor: "#fb7185",        // rose-400
    borderUpColor: "#34d399",
    borderDownColor: "#fb7185",
    wickUpColor: "#34d399",
    wickDownColor: "#fb7185",
  },
  light: {
    upColor: "#10b981",          // emerald-500
    downColor: "#f43f5e",        // rose-500
    borderUpColor: "#10b981",
    borderDownColor: "#f43f5e",
    wickUpColor: "#10b981",
    wickDownColor: "#f43f5e",
  },
};

// ============================================================
// Data Transformation Utils
// ============================================================

function calculateHeikinAshi(data: CandlestickDataPoint[]): CandlestickDataPoint[] {
  if (data.length === 0) return [];
  const haData: CandlestickDataPoint[] = [];
  
  // First HA candle
  const first = data[0];
  haData.push({
    date: first.date,
    open: (first.open + first.close) / 2,
    close: (first.open + first.high + first.low + first.close) / 4,
    high: first.high,
    low: first.low,
  });

  // Subsequent HA candles
  for (let i = 1; i < data.length; i++) {
    const current = data[i];
    const prevHA = haData[i - 1];
    
    const haClose = (current.open + current.high + current.low + current.close) / 4;
    const haOpen = (prevHA.open + prevHA.close) / 2;
    const haHigh = Math.max(current.high, haOpen, haClose);
    const haLow = Math.min(current.low, haOpen, haClose);
    
    haData.push({
      date: current.date,
      open: haOpen,
      high: haHigh,
      low: haLow,
      close: haClose,
    });
  }
  return haData;
}

function aggregateWeekly(data: CandlestickDataPoint[]): CandlestickDataPoint[] {
  if (data.length === 0) return [];
  const weeklyData: CandlestickDataPoint[] = [];
  
  let currentWeekOpen = data[0].open;
  let currentWeekHigh = data[0].high;
  let currentWeekLow = data[0].low;
  let currentWeekDate = data[0].date;
  
  const getWeekNumber = (dateStr: string | number) => {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  
  let currentWeek = getWeekNumber(data[0].date);

  for (let i = 0; i < data.length; i++) {
    const current = data[i];
    const week = getWeekNumber(current.date);
    
    if (week !== currentWeek) {
      weeklyData.push({
        date: currentWeekDate,
        open: currentWeekOpen,
        high: currentWeekHigh,
        low: currentWeekLow,
        close: data[i - 1].close,
      });
      currentWeek = week;
      currentWeekDate = current.date;
      currentWeekOpen = current.open;
      currentWeekHigh = current.high;
      currentWeekLow = current.low;
    } else {
      currentWeekHigh = Math.max(currentWeekHigh, current.high);
      currentWeekLow = Math.min(currentWeekLow, current.low);
    }
    
    if (i === data.length - 1) {
      weeklyData.push({
        date: currentWeekDate,
        open: currentWeekOpen,
        high: currentWeekHigh,
        low: currentWeekLow,
        close: current.close,
      });
    }
  }
  return weeklyData;
}

// ============================================================
// Component
// ============================================================

export default function CandlestickChart({
  data,
  height = 400,
  showGrid = true,
  title,
  symbol,
  timeFrame = "ALL",
  onTimeFrameChange,
  headerAction,
}: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const { theme } = useTheme();
  const { formatCurrency, currency, exchangeRate } = useCurrency();
  const isDark = theme === "dark";

  const [chartType, setChartType] = useState<"STANDARD" | "HEIKIN_ASHI">("HEIKIN_ASHI");

  // Process data (Applying Heikin Ashi if selected)
  // Note: We use daily data for all ranges to ensure smooth charting,
  // and we just adjust the visible range on the chart itself.
  const processedData = useMemo(() => {
    let result = data;
    if (chartType === "HEIKIN_ASHI") {
      result = calculateHeikinAshi(result);
    }
    return result;
  }, [data, chartType]);

  // Transform for Lightweight Charts
  const chartData: CandlestickData[] = useMemo(() => 
    processedData.map((d) => ({
      time: d.date as CandlestickData["time"],
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    })),
  [processedData]);

  // Helper to set visible range based on timeframe
  const applyTimeFrameRange = useCallback((chart: IChartApi, tf: string, dataLength: number) => {
    if (dataLength === 0) return;
    let visibleCandles = dataLength;
    
    // Approximate trading days
    switch (tf) {
      case "1D": visibleCandles = dataLength; break; // Show all fetched intraday candles
      case "1W": visibleCandles = 5; break;
      case "1M": visibleCandles = 21; break;
      case "3M": visibleCandles = 63; break;
      case "6M": visibleCandles = 126; break;
      case "1Y": visibleCandles = 252; break;
      case "ALL": visibleCandles = dataLength; break;
    }

    if (tf === "ALL" || visibleCandles >= dataLength) {
      chart.timeScale().fitContent();
    } else {
      chart.timeScale().setVisibleLogicalRange({
        from: dataLength - visibleCandles,
        to: dataLength - 1,
      });
    }
  }, []);

  // Initialize chart
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      ...getChartOptions(isDark),
      width: containerRef.current.clientWidth,
      height,
    });

    if (!showGrid) {
      chart.applyOptions({
        grid: {
          vertLines: { visible: false },
          horzLines: { visible: false },
        },
      });
    }

    const colors = isDark ? CANDLE_COLORS.dark : CANDLE_COLORS.light;
    const series = chart.addSeries(CandlestickSeries, colors);

    series.setData(chartData);

    // Initial fit based on timeframe
    applyTimeFrameRange(chart, timeFrame, chartData.length);

    chartRef.current = chart;
    seriesRef.current = series;

    // Responsive resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        chart.applyOptions({ width });
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Re-run only on mount, data updates handled below

  // Update theme
  useEffect(() => {
    if (!chartRef.current || !seriesRef.current) return;
    chartRef.current.applyOptions(getChartOptions(isDark));
    const colors = isDark ? CANDLE_COLORS.dark : CANDLE_COLORS.light;
    seriesRef.current.applyOptions(colors);
  }, [isDark]);

  // Update data & range when state changes
  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return;
    seriesRef.current.setData(chartData);
    applyTimeFrameRange(chartRef.current, timeFrame, chartData.length);
  }, [chartData, timeFrame, applyTimeFrameRange]);

  // Compute summary from actual underlying data (not HA data, to show real prices)
  const realLastCandle = data.length > 0 ? data[data.length - 1] : null;
  const realPrevCandle = data.length > 1 ? data[data.length - 2] : null;
  const priceChange = realLastCandle && realPrevCandle
    ? realLastCandle.close - realPrevCandle.close
    : null;
  const priceChangePercent = priceChange !== null && realPrevCandle
    ? (priceChange / realPrevCandle.close) * 100
    : null;

  return (
    <div className="glass-card p-5 sm:p-6 animate-fade-in-up opacity-0 stagger-2">
      {/* Header */}
      {(title || symbol) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            {symbol && (
              <CompanyLogo symbol={symbol} name={title} size="lg" />
            )}
            <div>
              <div className="flex items-center gap-2">
                {symbol && (
                  <h3 className="text-xl font-extrabold text-foreground font-mono tracking-tight">{symbol}</h3>
                )}
                <span className="flex h-2 w-2 relative" title="Live Market Feed Active">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                {headerAction && (
                  <div className="ml-2">
                    {headerAction}
                  </div>
                )}
              </div>

              {title && (
                <p className="text-xs text-muted font-medium mt-0.5">
                  {title}
                </p>
              )}
            </div>
          </div>

          {/* Live Price Badge */}
          {realLastCandle && (
            <div className="text-left sm:text-right">
              <p className="text-2xl sm:text-3xl font-extrabold font-mono text-foreground tracking-tight tabular-nums">
                {formatCurrency(realLastCandle.close)}
              </p>
              {currency === "THB" && (
                <p className="text-[11px] font-mono text-muted/80">
                  USD: ${realLastCandle.close.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              )}
              {priceChange !== null && priceChangePercent !== null && (
                <p
                  className={`text-xs font-mono font-semibold tabular-nums mt-0.5 flex items-center sm:justify-end gap-1 ${
                    priceChange >= 0 ? "text-profit" : "text-loss"
                  }`}
                >
                  <span>{priceChange >= 0 ? "▲" : "▼"}</span>
                  <span>
                    {priceChange >= 0 ? "+" : ""}
                    {currency === "THB" ? (priceChange * exchangeRate).toFixed(2) : priceChange.toFixed(2)}
                  </span>
                  <span className="opacity-80">
                    ({priceChange >= 0 ? "+" : ""}
                    {priceChangePercent.toFixed(2)}%)
                  </span>
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        {/* Type Toggle */}
        <div className="flex items-center bg-muted-bg/60 p-1 rounded-xl border border-border/50">
          <button
            onClick={() => setChartType("STANDARD")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              chartType === "STANDARD" 
                ? "bg-card-bg text-foreground shadow-sm font-bold border border-border/40" 
                : "text-muted hover:text-foreground"
            }`}
          >
            Candles
          </button>
          <button
            onClick={() => setChartType("HEIKIN_ASHI")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              chartType === "HEIKIN_ASHI" 
                ? "bg-card-bg text-foreground shadow-sm font-bold border border-border/40" 
                : "text-muted hover:text-foreground"
            }`}
          >
            Heikin Ashi
          </button>
        </div>

        {/* Timeframe Toggle */}
        <div className="flex items-center gap-1 bg-muted-bg/40 p-1 rounded-xl border border-border/40">
          {(["1D", "1W", "1M", "3M", "6M", "1Y", "ALL"] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeFrameChange?.(tf)}
              className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer ${
                timeFrame === tf
                  ? "bg-accent text-white shadow-sm font-bold"
                  : "text-muted hover:text-foreground hover:bg-muted-bg"
              }`}
            >
              {tf === "ALL" ? "ALL" : tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div
        ref={containerRef}
        className="w-full rounded-2xl overflow-hidden border border-border/60 bg-card-bg/30 shadow-inner"
        style={{ height }}
      />
    </div>
  );
}

