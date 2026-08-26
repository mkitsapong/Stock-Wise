import { Transaction } from "@/context/TransactionContext";

export type LifetimeTimeFrame = "7D" | "1M" | "3M" | "6M" | "YTD" | "1Y" | "5Y" | "ALL";

export interface LifetimeDataPoint {
  date: string;        // "YYYY-MM-DD"
  displayDate: string; // "Feb 5"
  portfolioValue: number;
  invested: number;
  sp500Value: number;
}

export interface LifetimePerformanceSummary {
  startDate: string;
  endDate: string;
  formattedRange: string;
  portfolioStart: number;
  portfolioEnd: number;
  portfolioChange: number;
  portfolioChangePercent: number;
  sp500Start: number;
  sp500End: number;
  sp500Change: number;
  sp500ChangePercent: number;
  investedTotal: number;
  outperformanceAmount: number; // portfolio gain vs sp500 gain
  outperformancePercent: number; // portfolio return % vs sp500 return %
  isAhead: boolean;
}

/**
 * S&P 500 historical average annual return used for benchmark.
 * Widely used 10-year average (source: S&P 500 long-run average).
 */
const SP500_ANNUAL_RETURN = 0.10;

/**
 * Generate coordinated historical curves for Portfolio, S&P 500, and Invested Capital.
 *
 * Portfolio Value: TWRR-style log-linear approximation from cost basis →
 * currentTotalValue across the timeline. No simulated noise.
 *
 * S&P 500 Benchmark: Each BUY is treated as a simultaneous S&P 500 investment,
 * compounded at 10%/year (historical average). SELLs withdraw from benchmark
 * using FIFO cost reduction.
 *
 * Invested Capital: Running cumulative cost basis. SELL reduces it by the
 * avgCost of the shares sold (correct accounting), NOT the sell price.
 */
export function generateLifetimePortfolioData(
  transactions: Transaction[],
  currentTotalValue: number,
  currentCostBasis: number,
  timeframe: LifetimeTimeFrame = "ALL"
): {
  data: LifetimeDataPoint[];
  summary: LifetimePerformanceSummary;
} {
  const today = new Date();

  // Sort transactions chronologically
  const sortedTxs = [...transactions]
    .filter((t) => t.date && !isNaN(new Date(t.date).getTime()))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Find earliest transaction date; default to 6 months ago if none
  let startDate = new Date(today);
  startDate.setMonth(startDate.getMonth() - 6);
  if (sortedTxs.length > 0) {
    startDate = new Date(sortedTxs[0].date);
  }

  const totalDays = Math.max(
    1,
    Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  const finalCostBasis = currentCostBasis > 0 ? currentCostBasis : 0;
  const finalPortfolioValue = currentTotalValue > 0 ? currentTotalValue : finalCostBasis;

  // Overall growth ratio used for log-linear interpolation
  // At dayProgress=0 → factor=1 (no gain), at dayProgress=1 → factor=overallGrowthRatio
  const overallGrowthRatio =
    finalCostBasis > 0 ? finalPortfolioValue / finalCostBasis : 1;

  // Pre-index transactions by date for O(1) daily lookup
  const txByDate: Record<string, Transaction[]> = {};
  for (const tx of sortedTxs) {
    if (!txByDate[tx.date]) txByDate[tx.date] = [];
    txByDate[tx.date].push(tx);
  }

  // Per-symbol holding map for correct SELL cost-basis reduction
  const holdingMap: Record<string, { shares: number; totalCostUSD: number }> = {};

  // S&P 500 benchmark contributions (amount + date of investment)
  // FIFO order: earlier contributions are at lower indices
  const sp500Contribs: Array<{ amountUSD: number; dateMs: number }> = [];

  const fullTimeline: LifetimeDataPoint[] = [];
  let cumulativeInvested = 0;

  for (let i = totalDays; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dMs = d.getTime();

    // ── Process transactions on this day ─────────────────────────────────────
    for (const tx of txByDate[dateStr] ?? []) {
      const priceUSD = tx.priceUSD ?? tx.price ?? 0;
      const amount = tx.shares * priceUSD;

      if (tx.type === "BUY") {
        cumulativeInvested += amount;

        if (!holdingMap[tx.symbol]) {
          holdingMap[tx.symbol] = { shares: 0, totalCostUSD: 0 };
        }
        holdingMap[tx.symbol].shares += tx.shares;
        holdingMap[tx.symbol].totalCostUSD += amount;

        // Mirror this investment in the S&P 500 benchmark
        sp500Contribs.push({ amountUSD: amount, dateMs: dMs });
      } else if (tx.type === "SELL") {
        const holding = holdingMap[tx.symbol];
        if (holding && holding.shares > 0) {
          const sharesToSell = Math.min(tx.shares, holding.shares);
          const avgCostPerShare = holding.totalCostUSD / holding.shares;
          // Fix #3: reduce cost basis by avgCost, not by sell price
          const costReduction = sharesToSell * avgCostPerShare;

          cumulativeInvested = Math.max(0, cumulativeInvested - costReduction);
          holding.shares -= sharesToSell;
          holding.totalCostUSD =
            holding.shares > 0 ? holding.shares * avgCostPerShare : 0;

          // Withdraw the equivalent cost from S&P 500 benchmark (FIFO)
          let remaining = costReduction;
          for (const contrib of sp500Contribs) {
            if (remaining <= 0) break;
            const deduct = Math.min(contrib.amountUSD, remaining);
            contrib.amountUSD -= deduct;
            remaining -= deduct;
          }
        }
      }
    }

    // ── Portfolio Value: log-linear interpolation ─────────────────────────────
    // Fix #1 & #2: replace sin/cos drift + post-hoc scaling with a clean
    // TWRR-style growth curve: value = basis × ratio^progress
    const dayProgress = totalDays > 0 ? (totalDays - i) / totalDays : 1;
    const growthFactor =
      cumulativeInvested > 0 ? Math.pow(overallGrowthRatio, dayProgress) : 1;
    const portfolioValue = cumulativeInvested * growthFactor;

    // ── S&P 500 Value: compound each contribution to this day ─────────────────
    let sp500Value = 0;
    for (const contrib of sp500Contribs) {
      if (contrib.amountUSD <= 0) continue;
      const daysHeld = Math.max(0, (dMs - contrib.dateMs) / (1000 * 60 * 60 * 24));
      sp500Value +=
        contrib.amountUSD * Math.pow(1 + SP500_ANNUAL_RETURN, daysHeld / 365);
    }

    const monthShort = d.toLocaleDateString("en-US", { month: "short" });
    fullTimeline.push({
      date: dateStr,
      displayDate: `${monthShort} ${d.getDate()}`,
      portfolioValue: Math.round(portfolioValue * 100) / 100,
      invested: Math.round(cumulativeInvested * 100) / 100,
      sp500Value: Math.round(sp500Value * 100) / 100,
    });
  }

  // Guarantee exact endpoint values (removes floating-point drift)
  if (fullTimeline.length > 0) {
    const last = fullTimeline[fullTimeline.length - 1];
    last.portfolioValue = finalPortfolioValue;
    if (finalCostBasis > 0) last.invested = finalCostBasis;
  }

  // ── Filter by selected timeframe ──────────────────────────────────────────
  let cutoffDate: Date;
  switch (timeframe) {
    case "7D":
      cutoffDate = new Date(today);
      cutoffDate.setDate(cutoffDate.getDate() - 7);
      break;
    case "1M":
      cutoffDate = new Date(today);
      cutoffDate.setMonth(cutoffDate.getMonth() - 1);
      break;
    case "3M":
      cutoffDate = new Date(today);
      cutoffDate.setMonth(cutoffDate.getMonth() - 3);
      break;
    case "6M":
      cutoffDate = new Date(today);
      cutoffDate.setMonth(cutoffDate.getMonth() - 6);
      break;
    case "YTD":
      cutoffDate = new Date(today.getFullYear(), 0, 1);
      break;
    case "1Y":
      cutoffDate = new Date(today);
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
      break;
    case "5Y":
      cutoffDate = new Date(today);
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 5);
      break;
    case "ALL":
    default:
      cutoffDate = startDate;
      break;
  }

  const cutoffStr = cutoffDate.toISOString().split("T")[0];
  const filteredData = fullTimeline.filter((p) => p.date >= cutoffStr);
  const chartData = filteredData.length > 0 ? filteredData : fullTimeline;

  // ── Performance Summary ───────────────────────────────────────────────────
  const firstPt = chartData[0];
  const lastPt = chartData[chartData.length - 1];

  let portfolioChange = 0;
  let portfolioChangePercent = 0;
  let sp500Change = 0;
  let sp500ChangePercent = 0;

  if (timeframe === "ALL") {
    // Return measured relative to total invested capital (absolute gain)
    const investedBase = Math.max(1, lastPt.invested);
    portfolioChange = lastPt.portfolioValue - lastPt.invested;
    portfolioChangePercent = (portfolioChange / investedBase) * 100;

    sp500Change = lastPt.sp500Value - lastPt.invested;
    sp500ChangePercent = (sp500Change / investedBase) * 100;
  } else {
    // Return measured from start of the selected window
    portfolioChange = lastPt.portfolioValue - firstPt.portfolioValue;
    portfolioChangePercent =
      firstPt.portfolioValue > 0
        ? (portfolioChange / firstPt.portfolioValue) * 100
        : 0;

    sp500Change = lastPt.sp500Value - firstPt.sp500Value;
    sp500ChangePercent =
      firstPt.sp500Value > 0
        ? (sp500Change / firstPt.sp500Value) * 100
        : 0;
  }

  const outperformanceAmount = lastPt.portfolioValue - lastPt.sp500Value;
  const outperformancePercent = portfolioChangePercent - sp500ChangePercent;
  const isAhead = outperformanceAmount >= 0;

  const formatDateRange = (d1Str: string, d2Str: string) => {
    const fmt = (s: string) =>
      new Date(s).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "2-digit",
      });
    return `${fmt(d1Str)} - ${fmt(d2Str)}`;
  };

  const summary: LifetimePerformanceSummary = {
    startDate: firstPt.date,
    endDate: lastPt.date,
    formattedRange: formatDateRange(firstPt.date, lastPt.date),
    portfolioStart: firstPt.portfolioValue,
    portfolioEnd: lastPt.portfolioValue,
    portfolioChange,
    portfolioChangePercent,
    sp500Start: firstPt.sp500Value,
    sp500End: lastPt.sp500Value,
    sp500Change,
    sp500ChangePercent,
    investedTotal: lastPt.invested,
    outperformanceAmount,
    outperformancePercent,
    isAhead,
  };

  return { data: chartData, summary };
}
