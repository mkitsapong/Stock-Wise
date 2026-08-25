"use client";

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  ColorType,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type DeepPartial,
  type ChartOptions,
  type LogicalRange,
} from "lightweight-charts";
import { useTheme } from "@/components/layout/ThemeProvider";
import { useCurrency } from "@/context/CurrencyContext";
import CompanyLogo from "@/components/common/CompanyLogo";
import {
  calculateEMA,
  calculateBollingerBands,
  calculateRSI,
  calculateMACD,
} from "@/lib/indicators";
import { cn } from "@/lib/utils";

// ============================================================
// Types
// ============================================================

export interface CandlestickDataPoint {
  date: string | number; // "YYYY-MM-DD" format or unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
}

interface CandlestickChartProps {
  /** Array of OHLC data points sorted by date ascending */
  data: CandlestickDataPoint[];
  /** Chart height in pixels (default: 420) */
  height?: number;
  /** Show grid lines (default: true) */
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
  /** Optional meta info for live price and daily previous close */
  meta?: {
    regularMarketPrice?: number;
    previousClose?: number;
    chartPreviousClose?: number;
  } | null;
}

export interface ActiveIndicators {
  ema50: boolean;
  ema100: boolean;
  ema200: boolean;
  bb: boolean;
  rsi: boolean;
  macd: boolean;
}

// ============================================================
// Theme Configs
// ============================================================

function getChartOptions(
  isDark: boolean,
  hideTimeScale = false,
  isIntraday = false
): DeepPartial<ChartOptions> {
  return {
    layout: {
      background: {
        type: ColorType.Solid,
        color: "transparent",
      },
      textColor: isDark ? "#94a3b8" : "#64748b",
      fontFamily: "'Inter', sans-serif",
      fontSize: 11,
    },
    grid: {
      vertLines: {
        color: isDark ? "rgba(148, 163, 184, 0.06)" : "rgba(148, 163, 184, 0.12)",
      },
      horzLines: {
        color: isDark ? "rgba(148, 163, 184, 0.06)" : "rgba(148, 163, 184, 0.12)",
      },
    },
    crosshair: {
      mode: 0, // Normal
      vertLine: {
        color: isDark ? "rgba(129, 140, 248, 0.4)" : "rgba(99, 102, 241, 0.4)",
        width: 1,
        style: LineStyle.Dashed,
        labelBackgroundColor: isDark ? "#1e293b" : "#1e293b",
      },
      horzLine: {
        color: isDark ? "rgba(129, 140, 248, 0.4)" : "rgba(99, 102, 241, 0.4)",
        width: 1,
        style: LineStyle.Dashed,
        labelBackgroundColor: isDark ? "#1e293b" : "#1e293b",
      },
    },
    timeScale: {
      visible: !hideTimeScale,
      borderColor: isDark ? "rgba(148, 163, 184, 0.1)" : "rgba(148, 163, 184, 0.2)",
      timeVisible: isIntraday,
      secondsVisible: false,
      rightOffset: 4,
      barSpacing: isIntraday ? 12 : 8,
      minBarSpacing: 2,
    },
    rightPriceScale: {
      borderColor: isDark ? "rgba(148, 163, 184, 0.1)" : "rgba(148, 163, 184, 0.2)",
      autoScale: true,
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
    upColor: "#34d399", // emerald-400
    downColor: "#fb7185", // rose-400
    borderUpColor: "#34d399",
    borderDownColor: "#fb7185",
    wickUpColor: "#34d399",
    wickDownColor: "#fb7185",
  },
  light: {
    upColor: "#10b981", // emerald-500
    downColor: "#f43f5e", // rose-500
    borderUpColor: "#10b981",
    borderDownColor: "#f43f5e",
    wickUpColor: "#10b981",
    wickDownColor: "#f43f5e",
  },
};

// Indicator Color Palette
const INDICATOR_COLORS = {
  ema50: "#f59e0b", // Amber 500
  ema100: "#06b6d4", // Cyan 500
  ema200: "#a855f7", // Purple 500
  bbUpper: "rgba(56, 189, 248, 0.75)", // Sky 400
  bbMiddle: "rgba(2, 132, 199, 0.85)", // Sky 600
  bbLower: "rgba(56, 189, 248, 0.75)", // Sky 400
  rsi: "#ec4899", // Pink 500
  macd: "#3b82f6", // Blue 500
  macdSignal: "#f97316", // Orange 500
};

// ============================================================
// Data Transformation Utils
// ============================================================

function calculateHeikinAshi(data: CandlestickDataPoint[]): CandlestickDataPoint[] {
  if (data.length === 0) return [];
  const haData: CandlestickDataPoint[] = [];

  const first = data[0];
  haData.push({
    date: first.date,
    open: (first.open + first.close) / 2,
    close: (first.open + first.high + first.low + first.close) / 4,
    high: first.high,
    low: first.low,
  });

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

// ============================================================
// Component
// ============================================================

export default function CandlestickChart({
  data,
  meta,
  height = 420,
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

  // Sub-chart refs for RSI & MACD
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);
  const rsiSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  const macdContainerRef = useRef<HTMLDivElement>(null);
  const macdChartRef = useRef<IChartApi | null>(null);
  const macdLineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const macdSignalSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const macdHistSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  // Main Overlay Series Refs
  const ema50SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ema100SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ema200SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bbUpperSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bbMiddleSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bbLowerSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  const isSyncingRef = useRef(false);

  const { theme } = useTheme();
  const { formatCurrency, currency, exchangeRate } = useCurrency();
  const isDark = theme === "dark";

  const isIntraday = timeFrame === "1D" || timeFrame === "1W";
  const [chartType, setChartType] = useState<"STANDARD" | "HEIKIN_ASHI">("HEIKIN_ASHI");

  // Indicator States (Default: EMA 50, 100, 200 & RSI 14 enabled)
  const [indicators, setIndicators] = useState<ActiveIndicators>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("stockwise_chart_indicators");
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      ema50: true,
      ema100: true,
      ema200: true,
      bb: false,
      rsi: true,
      macd: false,
    };
  });

  const toggleIndicator = (key: keyof ActiveIndicators) => {
    setIndicators((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("stockwise_chart_indicators", JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });
  };

  // Process data (Candlestick / Heikin Ashi)
  const processedData = useMemo(() => {
    let result = data;
    if (chartType === "HEIKIN_ASHI") {
      result = calculateHeikinAshi(result);
    }
    return result;
  }, [data, chartType]);

  // Clean & strictly ascending sorted chart data
  const chartData: CandlestickData[] = useMemo(() => {
    if (!processedData || processedData.length === 0) return [];

    const map = new Map<string | number, CandlestickData>();
    for (const d of processedData) {
      if (!d || d.date === undefined || d.date === null) continue;
      map.set(d.date, {
        time: d.date as CandlestickData["time"],
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      });
    }

    const sorted = Array.from(map.values()).sort((a, b) => {
      const tA = typeof a.time === "string" ? new Date(a.time).getTime() : Number(a.time);
      const tB = typeof b.time === "string" ? new Date(b.time).getTime() : Number(b.time);
      return tA - tB;
    });

    const strictlyAscending: CandlestickData[] = [];
    let lastTime: number | null = null;

    for (const item of sorted) {
      const t = typeof item.time === "string" ? new Date(item.time).getTime() : Number(item.time);
      if (lastTime === null || t > lastTime) {
        strictlyAscending.push(item);
        lastTime = t;
      }
    }

    return strictlyAscending;
  }, [processedData]);

  // Compute Technical Indicators from raw data
  const ema50Data = useMemo(() => calculateEMA(data, 50), [data]);
  const ema100Data = useMemo(() => calculateEMA(data, 100), [data]);
  const ema200Data = useMemo(() => calculateEMA(data, 200), [data]);
  const bbData = useMemo(() => calculateBollingerBands(data, 20, 2), [data]);
  const rsiData = useMemo(() => calculateRSI(data, 14), [data]);
  const macdData = useMemo(() => calculateMACD(data, 12, 26, 9), [data]);

  // Latest calculated indicator values for badges
  const latestEMA50 = ema50Data.length > 0 ? ema50Data[ema50Data.length - 1].value : null;
  const latestEMA100 = ema100Data.length > 0 ? ema100Data[ema100Data.length - 1].value : null;
  const latestEMA200 = ema200Data.length > 0 ? ema200Data[ema200Data.length - 1].value : null;
  const latestRSI = rsiData.length > 0 ? rsiData[rsiData.length - 1].value : null;
  const latestMACD = macdData.macd.length > 0 ? macdData.macd[macdData.macd.length - 1].value : null;
  const latestSignal = macdData.signal.length > 0 ? macdData.signal[macdData.signal.length - 1].value : null;

  // Timeframe range helper
  const applyTimeFrameRange = useCallback((chart: IChartApi, tf: string, dataLength: number) => {
    if (dataLength === 0) return;

    const executeRange = () => {
      if (tf === "1D" || tf === "1W" || tf === "ALL") {
        chart.timeScale().fitContent();
        rsiChartRef.current?.timeScale().fitContent();
        macdChartRef.current?.timeScale().fitContent();
        return;
      }

      let visibleCandles = dataLength;
      switch (tf) {
        case "1M": visibleCandles = 22; break;
        case "3M": visibleCandles = 65; break;
        case "6M": visibleCandles = 130; break;
        case "1Y": visibleCandles = 252; break;
      }

      if (visibleCandles >= dataLength) {
        chart.timeScale().fitContent();
        rsiChartRef.current?.timeScale().fitContent();
        macdChartRef.current?.timeScale().fitContent();
      } else {
        const range: LogicalRange = {
          from: Math.max(0, dataLength - visibleCandles) as any,
          to: (dataLength - 1 + 2) as any,
        };
        chart.timeScale().setVisibleLogicalRange(range);
        rsiChartRef.current?.timeScale().setVisibleLogicalRange(range);
        macdChartRef.current?.timeScale().setVisibleLogicalRange(range);
      }
    };

    // Execute immediately and in next frame to guarantee correct layout calculation
    executeRange();
    requestAnimationFrame(executeRange);
  }, []);

  // Synchronize time scales across main chart, RSI, and MACD
  const syncRange = useCallback((range: LogicalRange | null, sourceChart: IChartApi) => {
    if (!range || isSyncingRef.current) return;
    isSyncingRef.current = true;

    const charts = [chartRef.current, rsiChartRef.current, macdChartRef.current].filter(
      (c): c is IChartApi => c !== null && c !== sourceChart
    );

    for (const c of charts) {
      c.timeScale().setVisibleLogicalRange(range);
    }

    isSyncingRef.current = false;
  }, []);

  // 1. Initialize Main Chart
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      ...getChartOptions(isDark, indicators.rsi || indicators.macd, isIntraday),
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

    if (chartData.length > 0) {
      try {
        series.setData(chartData);
        applyTimeFrameRange(chart, timeFrame, chartData.length);
      } catch (err) {
        console.error("CandlestickChart initial setData error:", err);
      }
    }

    chartRef.current = chart;
    seriesRef.current = series;

    // Time scale sync
    chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      syncRange(range, chart);
    });

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        chart.applyOptions({ width: entry.contentRect.width });
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      try {
        chart.remove();
      } catch (e) {}
      chartRef.current = null;
      seriesRef.current = null;
      ema50SeriesRef.current = null;
      ema100SeriesRef.current = null;
      ema200SeriesRef.current = null;
      bbUpperSeriesRef.current = null;
      bbMiddleSeriesRef.current = null;
      bbLowerSeriesRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update chart options when timeframe (intraday vs daily) or theme changes
  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.applyOptions({
      ...getChartOptions(isDark, indicators.rsi || indicators.macd, isIntraday),
    });
    seriesRef.current?.applyOptions(isDark ? CANDLE_COLORS.dark : CANDLE_COLORS.light);
  }, [isDark, isIntraday, indicators.rsi, indicators.macd]);

  // 2. Manage Main Overlay Series (EMA 50, 100, 200, Bollinger Bands)
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const safeRemove = (series: ISeriesApi<any> | null) => {
      if (series && chart) {
        try {
          chart.removeSeries(series);
        } catch (e) {}
      }
    };

    // EMA 50
    if (indicators.ema50 && ema50Data.length > 0) {
      if (!ema50SeriesRef.current) {
        ema50SeriesRef.current = chart.addSeries(LineSeries, {
          color: INDICATOR_COLORS.ema50,
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: true,
          title: "EMA 50",
        });
      }
      ema50SeriesRef.current.setData(ema50Data);
    } else {
      safeRemove(ema50SeriesRef.current);
      ema50SeriesRef.current = null;
    }

    // EMA 100
    if (indicators.ema100 && ema100Data.length > 0) {
      if (!ema100SeriesRef.current) {
        ema100SeriesRef.current = chart.addSeries(LineSeries, {
          color: INDICATOR_COLORS.ema100,
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: true,
          title: "EMA 100",
        });
      }
      ema100SeriesRef.current.setData(ema100Data);
    } else {
      safeRemove(ema100SeriesRef.current);
      ema100SeriesRef.current = null;
    }

    // EMA 200
    if (indicators.ema200 && ema200Data.length > 0) {
      if (!ema200SeriesRef.current) {
        ema200SeriesRef.current = chart.addSeries(LineSeries, {
          color: INDICATOR_COLORS.ema200,
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: true,
          title: "EMA 200",
        });
      }
      ema200SeriesRef.current.setData(ema200Data);
    } else {
      safeRemove(ema200SeriesRef.current);
      ema200SeriesRef.current = null;
    }

    // Bollinger Bands
    if (indicators.bb && bbData.middle.length > 0) {
      if (!bbUpperSeriesRef.current) {
        bbUpperSeriesRef.current = chart.addSeries(LineSeries, {
          color: INDICATOR_COLORS.bbUpper,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          priceLineVisible: false,
          lastValueVisible: false,
          title: "BB Upper",
        });
        bbMiddleSeriesRef.current = chart.addSeries(LineSeries, {
          color: INDICATOR_COLORS.bbMiddle,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          title: "BB Mid",
        });
        bbLowerSeriesRef.current = chart.addSeries(LineSeries, {
          color: INDICATOR_COLORS.bbLower,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          priceLineVisible: false,
          lastValueVisible: false,
          title: "BB Lower",
        });
      }
      bbUpperSeriesRef.current.setData(bbData.upper);
      bbMiddleSeriesRef.current?.setData(bbData.middle);
      bbLowerSeriesRef.current?.setData(bbData.lower);
    } else {
      safeRemove(bbUpperSeriesRef.current);
      safeRemove(bbMiddleSeriesRef.current);
      safeRemove(bbLowerSeriesRef.current);
      bbUpperSeriesRef.current = null;
      bbMiddleSeriesRef.current = null;
      bbLowerSeriesRef.current = null;
    }
  }, [indicators, ema50Data, ema100Data, ema200Data, bbData]);

  // 3. Initialize & Manage RSI Sub-Chart
  useEffect(() => {
    if (!indicators.rsi) {
      if (rsiChartRef.current) {
        try {
          rsiChartRef.current.remove();
        } catch (e) {}
        rsiChartRef.current = null;
        rsiSeriesRef.current = null;
      }
      return;
    }

    if (!rsiContainerRef.current) return;

    const rsiChart = createChart(rsiContainerRef.current, {
      ...getChartOptions(isDark, indicators.macd, isIntraday),
      width: rsiContainerRef.current.clientWidth,
      height: 120,
    });

    rsiChart.priceScale("right").applyOptions({
      scaleMargins: { top: 0.1, bottom: 0.1 },
      autoScale: false,
    });

    const rsiSeries = rsiChart.addSeries(LineSeries, {
      color: INDICATOR_COLORS.rsi,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
      title: "RSI (14)",
      autoscaleInfoProvider: () => ({
        priceRange: { minValue: 0, maxValue: 100 },
      }),
    });

    rsiSeries.createPriceLine({
      price: 70,
      color: "rgba(244, 63, 94, 0.6)",
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: "70 (OB)",
    });
    rsiSeries.createPriceLine({
      price: 30,
      color: "rgba(16, 185, 129, 0.6)",
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: "30 (OS)",
    });

    if (rsiData.length > 0) {
      rsiSeries.setData(rsiData);
    }

    if (chartRef.current) {
      const currentRange = chartRef.current.timeScale().getVisibleLogicalRange();
      if (currentRange) {
        rsiChart.timeScale().setVisibleLogicalRange(currentRange);
      }
    }

    rsiChart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      syncRange(range, rsiChart);
    });

    rsiChartRef.current = rsiChart;
    rsiSeriesRef.current = rsiSeries;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        rsiChart.applyOptions({ width: entry.contentRect.width });
      }
    });
    resizeObserver.observe(rsiContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      try {
        rsiChart.remove();
      } catch (e) {}
      rsiChartRef.current = null;
      rsiSeriesRef.current = null;
    };
  }, [indicators.rsi, indicators.macd, isDark, isIntraday, rsiData, syncRange]);

  // 4. Initialize & Manage MACD Sub-Chart
  useEffect(() => {
    if (!indicators.macd) {
      if (macdChartRef.current) {
        try {
          macdChartRef.current.remove();
        } catch (e) {}
        macdChartRef.current = null;
        macdLineSeriesRef.current = null;
        macdSignalSeriesRef.current = null;
        macdHistSeriesRef.current = null;
      }
      return;
    }

    if (!macdContainerRef.current) return;

    const macdChart = createChart(macdContainerRef.current, {
      ...getChartOptions(isDark, false, isIntraday),
      width: macdContainerRef.current.clientWidth,
      height: 130,
    });

    const macdHistSeries = macdChart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceLineVisible: false,
      lastValueVisible: false,
      title: "Histogram",
    });

    const macdLineSeries = macdChart.addSeries(LineSeries, {
      color: INDICATOR_COLORS.macd,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
      title: "MACD",
    });

    const macdSignalSeries = macdChart.addSeries(LineSeries, {
      color: INDICATOR_COLORS.macdSignal,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
      title: "Signal",
    });

    if (macdData.histogram.length > 0) {
      macdHistSeries.setData(macdData.histogram);
      macdLineSeries.setData(macdData.macd);
      macdSignalSeries.setData(macdData.signal);
    }

    if (chartRef.current) {
      const currentRange = chartRef.current.timeScale().getVisibleLogicalRange();
      if (currentRange) {
        macdChart.timeScale().setVisibleLogicalRange(currentRange);
      }
    }

    macdChart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      syncRange(range, macdChart);
    });

    macdChartRef.current = macdChart;
    macdLineSeriesRef.current = macdLineSeries;
    macdSignalSeriesRef.current = macdSignalSeries;
    macdHistSeriesRef.current = macdHistSeries;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        macdChart.applyOptions({ width: entry.contentRect.width });
      }
    });
    resizeObserver.observe(macdContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      try {
        macdChart.remove();
      } catch (e) {}
      macdChartRef.current = null;
      macdLineSeriesRef.current = null;
      macdSignalSeriesRef.current = null;
      macdHistSeriesRef.current = null;
    };
  }, [indicators.macd, isDark, isIntraday, macdData, syncRange]);

  // Update data & range when state changes
  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return;
    if (chartData.length > 0) {
      try {
        seriesRef.current.setData(chartData);
        applyTimeFrameRange(chartRef.current, timeFrame, chartData.length);
      } catch (err) {
        console.error("CandlestickChart update setData error:", err);
      }
    }
  }, [chartData, timeFrame, applyTimeFrameRange]);

  // Real underlying summary stats (consistent 1-day daily change)
  const realLastCandle = data.length > 0 ? data[data.length - 1] : null;
  const currentPrice = meta?.regularMarketPrice ?? realLastCandle?.close ?? null;
  const prevClose = meta?.previousClose ?? (data.length > 1 ? data[data.length - 2].close : null);
  const priceChange = currentPrice !== null && prevClose !== null ? currentPrice - prevClose : null;
  const priceChangePercent =
    priceChange !== null && prevClose !== null && prevClose > 0 ? (priceChange / prevClose) * 100 : null;

  return (
    <div className="glass-card p-5 sm:p-6 animate-fade-in-up opacity-0 stagger-2">
      {/* Header */}
      {(title || symbol) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            {symbol && <CompanyLogo symbol={symbol} name={title} size="lg" />}
            <div>
              <div className="flex items-center gap-2">
                {symbol && (
                  <h3 className="text-xl font-extrabold text-foreground font-mono tracking-tight">
                    {symbol}
                  </h3>
                )}
                <span className="flex h-2 w-2 relative" title="Live Market Feed Active">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                {headerAction && <div className="ml-2">{headerAction}</div>}
              </div>

              {title && <p className="text-xs text-muted font-medium mt-0.5">{title}</p>}
            </div>
          </div>

          {/* Live Price Badge */}
          {currentPrice !== null && (
            <div className="text-left sm:text-right">
              <p className="text-2xl sm:text-3xl font-extrabold font-mono text-foreground tracking-tight tabular-nums">
                {formatCurrency(currentPrice)}
              </p>
              {currency === "THB" && (
                <p className="text-[11px] font-mono text-muted/80">
                  USD: $
                  {currentPrice.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
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
                    {currency === "THB"
                      ? (priceChange * exchangeRate).toFixed(2)
                      : priceChange.toFixed(2)}
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

      {/* Toolbar: Indicators & Controls */}
      <div className="flex flex-col gap-3 mb-4 pb-3 border-b border-border/40">
        {/* Top Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left: Chart Type */}
          <div className="flex items-center gap-2">
            {/* Chart Type Toggle */}
            <div className="flex items-center gap-1 bg-muted-bg/40 p-1 rounded-xl border border-border/40">
              <button
                onClick={() => setChartType("STANDARD")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  chartType === "STANDARD"
                    ? "bg-card-bg text-foreground shadow-sm font-bold border border-border/40"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Candles
              </button>
              <button
                onClick={() => setChartType("HEIKIN_ASHI")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  chartType === "HEIKIN_ASHI"
                    ? "bg-card-bg text-foreground shadow-sm font-bold border border-border/40"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Heikin Ashi
              </button>
            </div>
          </div>

          {/* Right: Timeframe Toggle */}
          <div className="flex items-center gap-1 bg-muted-bg/40 p-1 rounded-xl border border-border/40 overflow-x-auto scrollbar-none">
            {(["1D", "1W", "1M", "3M", "6M", "1Y", "ALL"] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeFrameChange?.(tf)}
                className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
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

        {/* Technical Indicators Pill Bar */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none max-w-full pb-1">
          <span className="hidden sm:inline-block text-[10px] font-bold text-muted uppercase tracking-wider mr-1 shrink-0">
            Indicators:
          </span>
          {/* EMA 50 */}
          <button
            onClick={() => toggleIndicator("ema50")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold font-mono transition-all border cursor-pointer shrink-0 whitespace-nowrap",
              indicators.ema50 && latestEMA50 !== null
                ? "bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-xs"
                : "bg-muted-bg/30 text-muted/70 border-border/40 hover:text-foreground hover:bg-muted-bg/60"
            )}
          >
            <span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span>
            <span>EMA 50</span>
            {latestEMA50 !== null && indicators.ema50 && (
              <span className="text-[10px] opacity-90">({latestEMA50.toFixed(2)})</span>
            )}
          </button>

          {/* EMA 100 */}
          <button
            onClick={() => toggleIndicator("ema100")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold font-mono transition-all border cursor-pointer shrink-0 whitespace-nowrap",
              indicators.ema100 && latestEMA100 !== null
                ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-xs"
                : "bg-muted-bg/30 text-muted/70 border-border/40 hover:text-foreground hover:bg-muted-bg/60"
            )}
          >
            <span className="w-2 h-2 rounded-full bg-[#06b6d4]"></span>
            <span>EMA 100</span>
            {latestEMA100 !== null && indicators.ema100 && (
              <span className="text-[10px] opacity-90">({latestEMA100.toFixed(2)})</span>
            )}
          </button>

          {/* EMA 200 */}
          <button
            onClick={() => toggleIndicator("ema200")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold font-mono transition-all border cursor-pointer shrink-0 whitespace-nowrap",
              indicators.ema200 && latestEMA200 !== null
                ? "bg-purple-500/10 text-purple-400 border-purple-500/30 shadow-xs"
                : "bg-muted-bg/30 text-muted/70 border-border/40 hover:text-foreground hover:bg-muted-bg/60"
            )}
          >
            <span className="w-2 h-2 rounded-full bg-[#a855f7]"></span>
            <span>EMA 200</span>
            {latestEMA200 !== null && indicators.ema200 && (
              <span className="text-[10px] opacity-90">({latestEMA200.toFixed(2)})</span>
            )}
          </button>

          {/* Bollinger Bands */}
          <button
            onClick={() => toggleIndicator("bb")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold font-mono transition-all border cursor-pointer shrink-0 whitespace-nowrap",
              indicators.bb && bbData.middle.length > 0
                ? "bg-sky-500/10 text-sky-400 border-sky-500/30 shadow-xs"
                : "bg-muted-bg/30 text-muted/70 border-border/40 hover:text-foreground hover:bg-muted-bg/60"
            )}
          >
            <span className="w-2 h-2 rounded-full bg-[#0284c7]"></span>
            <span>Bollinger (20,2)</span>
          </button>

          {/* RSI */}
          <button
            onClick={() => toggleIndicator("rsi")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold font-mono transition-all border cursor-pointer shrink-0 whitespace-nowrap",
              indicators.rsi && latestRSI !== null
                ? "bg-pink-500/10 text-pink-400 border-pink-500/30 shadow-xs"
                : "bg-muted-bg/30 text-muted/70 border-border/40 hover:text-foreground hover:bg-muted-bg/60"
            )}
          >
            <span className="w-2 h-2 rounded-full bg-[#ec4899]"></span>
            <span>RSI (14)</span>
            {latestRSI !== null && indicators.rsi && (
              <span
                className={cn(
                  "text-[10px] px-1 rounded font-bold",
                  latestRSI >= 70
                    ? "bg-rose-500/20 text-rose-300"
                    : latestRSI <= 30
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "opacity-85"
                )}
              >
                {latestRSI.toFixed(1)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Chart Canvas Stack */}
      <div className="flex flex-col gap-2 rounded-2xl overflow-hidden border border-border/60 bg-card-bg/30 p-2 shadow-inner">
        {/* 1. Main Candlestick Chart */}
        <div ref={containerRef} className="w-full relative" style={{ height }} />

        {/* 2. RSI Sub-Chart (if active) */}
        {indicators.rsi && (
          <div className="relative border-t border-border/40 pt-2">
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-[11px] font-mono font-bold text-pink-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                RSI (14): {latestRSI !== null ? latestRSI.toFixed(2) : "--"}
              </span>
              <div className="flex items-center gap-2 text-[10px] font-mono text-muted">
                <span className="text-rose-400">Overbought: 70</span>
                <span>·</span>
                <span className="text-emerald-400">Oversold: 30</span>
              </div>
            </div>
            <div ref={rsiContainerRef} className="w-full" style={{ height: 120 }} />
          </div>
        )}

        {/* 3. MACD Sub-Chart (if active) */}
        {indicators.macd && (
          <div className="relative border-t border-border/40 pt-2">
            <div className="flex items-center justify-between px-2 mb-1">
              <div className="flex items-center gap-3 text-[11px] font-mono font-bold">
                <span className="text-blue-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  MACD: {latestMACD !== null ? latestMACD.toFixed(2) : "--"}
                </span>
                <span className="text-orange-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                  Signal: {latestSignal !== null ? latestSignal.toFixed(2) : "--"}
                </span>
              </div>
              <span className="text-[10px] font-mono text-muted">Fast: 12 · Slow: 26 · Signal: 9</span>
            </div>
            <div ref={macdContainerRef} className="w-full" style={{ height: 130 }} />
          </div>
        )}
      </div>
    </div>
  );
}
