import type { Time, LineData, HistogramData } from "lightweight-charts";
import type { CandlestickDataPoint } from "@/components/charts/CandlestickChart";

export interface IndicatorPoint {
  time: Time;
  value: number;
}

export interface BollingerBandsResult {
  upper: LineData<Time>[];
  middle: LineData<Time>[];
  lower: LineData<Time>[];
}

export interface MACDResult {
  macd: LineData<Time>[];
  signal: LineData<Time>[];
  histogram: (HistogramData<Time> & { color?: string })[];
}

/**
 * Calculates Exponential Moving Average (EMA) starting from the very first candle
 */
export function calculateEMA(data: CandlestickDataPoint[], period: number): LineData<Time>[] {
  if (!data || data.length === 0) return [];

  const result: LineData<Time>[] = [];
  const k = 2 / (period + 1);

  // Initialize EMA with the first candle's close so the line starts from the beginning
  let prevEMA = data[0].close;

  result.push({
    time: data[0].date as Time,
    value: Number(prevEMA.toFixed(4)),
  });

  // Calculate EMA progressively for all subsequent candles
  for (let i = 1; i < data.length; i++) {
    const currentPrice = data[i].close;
    const currentEMA = currentPrice * k + prevEMA * (1 - k);
    result.push({
      time: data[i].date as Time,
      value: Number(currentEMA.toFixed(4)),
    });
    prevEMA = currentEMA;
  }

  return result;
}

/**
 * Calculates Bollinger Bands (SMA 20 + 2 Standard Deviations)
 */
export function calculateBollingerBands(
  data: CandlestickDataPoint[],
  period = 20,
  stdDevMultiplier = 2
): BollingerBandsResult {
  const upper: LineData<Time>[] = [];
  const middle: LineData<Time>[] = [];
  const lower: LineData<Time>[] = [];

  if (!data || data.length === 0) {
    return { upper, middle, lower };
  }

  for (let i = 0; i < data.length; i++) {
    const windowStart = Math.max(0, i - period + 1);
    const slice = data.slice(windowStart, i + 1);
    const count = slice.length;
    const sum = slice.reduce((acc, curr) => acc + curr.close, 0);
    const mean = sum / count;

    const variance =
      slice.reduce((acc, curr) => acc + Math.pow(curr.close - mean, 2), 0) / count;
    const stdDev = Math.sqrt(variance);

    const time = data[i].date as Time;
    const upperVal = mean + stdDevMultiplier * stdDev;
    const lowerVal = mean - stdDevMultiplier * stdDev;

    middle.push({ time, value: Number(mean.toFixed(4)) });
    upper.push({ time, value: Number(upperVal.toFixed(4)) });
    lower.push({ time, value: Number(lowerVal.toFixed(4)) });
  }

  return { upper, middle, lower };
}

/**
 * Calculates Relative Strength Index (RSI) with Wilder's Smoothing
 */
export function calculateRSI(data: CandlestickDataPoint[], period = 14): LineData<Time>[] {
  if (!data || data.length <= 1) return [];

  const result: LineData<Time>[] = [];

  if (data.length <= period) {
    // When history is shorter than period, compute simple price change ratio
    let gains = 0;
    let losses = 0;
    for (let i = 1; i < data.length; i++) {
      const change = data[i].close - data[i - 1].close;
      if (change >= 0) gains += change;
      else losses += Math.abs(change);
    }
    const rs = losses === 0 ? 100 : gains / losses;
    const rsi = 100 - 100 / (1 + rs);
    result.push({
      time: data[data.length - 1].date as Time,
      value: Number(rsi.toFixed(2)),
    });
    return result;
  }

  let gains = 0;
  let losses = 0;

  // Calculate first average gain and loss
  for (let i = 1; i <= period; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change >= 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  const firstRS = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const firstRSI = 100 - 100 / (1 + firstRS);

  result.push({
    time: data[period].date as Time,
    value: Number(firstRSI.toFixed(2)),
  });

  // Wilder's smoothing for remaining points
  for (let i = period + 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    const currentGain = change > 0 ? change : 0;
    const currentLoss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);

    result.push({
      time: data[i].date as Time,
      value: Number(rsi.toFixed(2)),
    });
  }

  return result;
}

/**
 * Calculates MACD (Moving Average Convergence Divergence)
 * Standard parameters: Fast = 12, Slow = 26, Signal = 9
 */
export function calculateMACD(
  data: CandlestickDataPoint[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): MACDResult {
  const result: MACDResult = {
    macd: [],
    signal: [],
    histogram: [],
  };

  if (!data || data.length === 0) {
    return result;
  }

  // Calculate Fast & Slow EMA on closes (starting from candle 0)
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);

  // Map slow EMA times to fast EMA values
  const fastMap = new Map<Time, number>();
  for (const f of fastEMA) {
    fastMap.set(f.time, f.value);
  }

  // MACD Line = Fast EMA - Slow EMA
  const macdDataRaw: { time: Time; value: number }[] = [];
  for (const s of slowEMA) {
    const fVal = fastMap.get(s.time);
    if (fVal !== undefined) {
      macdDataRaw.push({
        time: s.time,
        value: Number((fVal - s.value).toFixed(4)),
      });
    }
  }

  if (macdDataRaw.length === 0) {
    return result;
  }

  const k = 2 / (signalPeriod + 1);
  let prevSignal = macdDataRaw[0].value;

  const signalLine: LineData<Time>[] = [];
  const macdLine: LineData<Time>[] = [];
  const histogram: (HistogramData<Time> & { color?: string })[] = [];

  for (let i = 0; i < macdDataRaw.length; i++) {
    const currentMacd = macdDataRaw[i].value;
    const currentSignal = i === 0 ? currentMacd : currentMacd * k + prevSignal * (1 - k);
    const hist = Number((currentMacd - currentSignal).toFixed(4));
    const time = macdDataRaw[i].time;

    macdLine.push({ time, value: currentMacd });
    signalLine.push({ time, value: Number(currentSignal.toFixed(4)) });
    histogram.push({
      time,
      value: hist,
      color: hist >= 0 ? "rgba(16, 185, 129, 0.75)" : "rgba(244, 63, 94, 0.75)",
    });

    prevSignal = currentSignal;
  }

  return {
    macd: macdLine,
    signal: signalLine,
    histogram,
  };
}
