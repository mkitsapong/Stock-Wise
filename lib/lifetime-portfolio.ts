import { Transaction } from "@/context/TransactionContext";

export type LifetimeTimeFrame = "7D" | "1M" | "3M" | "6M" | "YTD" | "1Y" | "5Y" | "ALL";

export interface LifetimeDataPoint {
  date: string;       // "YYYY-MM-DD"
  displayDate: string; // "Jan '26" or "Feb 12"
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
  outperformanceAmount: number; // portfolioChange - sp500Change
  outperformancePercent: number; // portfolioChangePercent - sp500ChangePercent
  isAhead: boolean;
}

/**
 * Generate coordinated historical curves for Portfolio, S&P 500, and Invested Capital
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
  
  // Find earliest transaction date or default to ~9 months ago
  let startDate = new Date(today);
  startDate.setMonth(startDate.getMonth() - 9);

  if (transactions.length > 0) {
    const dates = transactions.map((t) => new Date(t.date).getTime()).filter((d) => !isNaN(d));
    if (dates.length > 0) {
      const minDate = new Date(Math.min(...dates));
      minDate.setDate(minDate.getDate() - 7); // add 7 days padding before first deposit
      startDate = minDate;
    }
  }

  // Calculate total days between start and today
  const diffTime = Math.abs(today.getTime() - startDate.getTime());
  const totalDays = Math.max(30, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  // Build daily timeline
  const fullTimeline: LifetimeDataPoint[] = [];

  // Sort transactions chronologically
  const sortedTxs = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let cumulativeInvested = 0;
  let runningPortfolioVal = 0;
  let runningSp500Val = 0;

  // S&P 500 benchmark historical annualized return ~12% with realistic mild volatility
  // Portfolio simulated alpha has slightly higher volatility and outperformance matching the user's view
  for (let i = totalDays; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];

    // Check if any transactions occurred on or before this day
    const txsOnDay = sortedTxs.filter((t) => t.date === dateStr);
    for (const tx of txsOnDay) {
      const amount = tx.shares * tx.price;
      if (tx.type === "BUY") {
        cumulativeInvested += amount;
        runningPortfolioVal += amount;
        runningSp500Val += amount;
      } else if (tx.type === "SELL") {
        cumulativeInvested = Math.max(0, cumulativeInvested - amount);
        runningPortfolioVal = Math.max(0, runningPortfolioVal - amount);
        runningSp500Val = Math.max(0, runningSp500Val - amount);
      }
    }

    // Default fallback if no transactions added yet
    if (sortedTxs.length === 0 && cumulativeInvested === 0) {
      const targetCost = currentCostBasis > 0 ? currentCostBasis : 24000;
      // Step capital injections at 3 intervals
      if (i <= totalDays) cumulativeInvested = targetCost * 0.35;
      if (i <= Math.floor(totalDays * 0.65)) cumulativeInvested = targetCost * 0.75;
      if (i <= Math.floor(totalDays * 0.35)) cumulativeInvested = targetCost;
      runningPortfolioVal = cumulativeInvested;
      runningSp500Val = cumulativeInvested;
    }

    // Market evolution factor (volatility + trend)
    const dayProgress = (totalDays - i) / totalDays; // 0 to 1
    const sp500Drift = 1 + (Math.sin(i * 0.08) * 0.015) + (Math.cos(i * 0.03) * 0.01) + (dayProgress * 0.08);
    const portfolioDrift = 1 + (Math.sin(i * 0.12) * 0.035) + (Math.cos(i * 0.06) * 0.02) + (dayProgress * 0.22);

    const calcSp500 = cumulativeInvested * sp500Drift;
    const calcPortfolio = cumulativeInvested * portfolioDrift;

    // Format display date
    const monthShort = d.toLocaleDateString("en-US", { month: "short" });
    const yearShort = d.toLocaleDateString("en-US", { year: "2-digit" });
    const displayDate = `${monthShort} '${yearShort}`;

    fullTimeline.push({
      date: dateStr,
      displayDate,
      portfolioValue: Math.round(calcPortfolio * 100) / 100,
      invested: Math.round(cumulativeInvested * 100) / 100,
      sp500Value: Math.round(calcSp500 * 100) / 100,
    });
  }

  // Align final point with the actual real-time current portfolio value and cost basis
  if (fullTimeline.length > 0 && currentTotalValue > 0) {
    const lastPoint = fullTimeline[fullTimeline.length - 1];
    const scaleFactor = currentTotalValue / Math.max(1, lastPoint.portfolioValue);
    
    // Smoothly scale points so the final point matches currentTotalValue exactly
    for (let i = 0; i < fullTimeline.length; i++) {
      const weight = (i / (fullTimeline.length - 1)); // 0 at start, 1 at end
      const smoothFactor = 1 + (scaleFactor - 1) * weight;
      fullTimeline[i].portfolioValue = Math.round(fullTimeline[i].portfolioValue * smoothFactor * 100) / 100;
      if (currentCostBasis > 0 && i === fullTimeline.length - 1) {
        fullTimeline[i].invested = currentCostBasis;
      }
    }
  }

  // Filter based on selected timeframe
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

  // Performance Summary calculations
  const firstPt = chartData[0];
  const lastPt = chartData[chartData.length - 1];

  const portfolioChange = lastPt.portfolioValue - firstPt.portfolioValue;
  const portfolioChangePercent = firstPt.portfolioValue > 0
    ? (portfolioChange / firstPt.portfolioValue) * 100
    : 0;

  const sp500Change = lastPt.sp500Value - firstPt.sp500Value;
  const sp500ChangePercent = firstPt.sp500Value > 0
    ? (sp500Change / firstPt.sp500Value) * 100
    : 0;

  const outperformanceAmount = portfolioChange - sp500Change;
  const outperformancePercent = portfolioChangePercent - sp500ChangePercent;
  const isAhead = outperformanceAmount >= 0;

  const formatDateRange = (d1Str: string, d2Str: string) => {
    const d1 = new Date(d1Str);
    const d2 = new Date(d2Str);
    const f1 = d1.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
    const f2 = d2.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
    return `${f1} - ${f2}`;
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

  return {
    data: chartData,
    summary,
  };
}
