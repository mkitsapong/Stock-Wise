import { Transaction } from "@/context/TransactionContext";

export type LifetimeTimeFrame = "7D" | "1M" | "3M" | "6M" | "YTD" | "1Y" | "5Y" | "ALL";
export type DailyPriceMap = Record<string, Record<string, number>>; // symbol -> { "YYYY-MM-DD": closePrice }

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
 * Generate coordinated historical curves for Portfolio, S&P 500, and Invested Capital.
 * When priceHistoryMap is available, calculates real daily mark-to-market valuation
 * using historical daily close prices. Falls back to smooth interpolation if offline/loading.
 */
export function generateLifetimePortfolioData(
  transactions: Transaction[],
  currentTotalValue: number,
  currentCostBasis: number,
  timeframe: LifetimeTimeFrame = "ALL",
  priceHistoryMap?: DailyPriceMap
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

  // Pre-index transactions by date for O(1) daily lookup
  const txByDate: Record<string, Transaction[]> = {};
  for (const tx of sortedTxs) {
    if (!txByDate[tx.date]) txByDate[tx.date] = [];
    txByDate[tx.date].push(tx);
  }

  // Running holdings map
  const holdingMap: Record<string, { shares: number; totalCostUSD: number }> = {};
  const lastKnownPrice: Record<string, number> = {};

  // Running S&P 500 benchmark units (Dollar-Weighted PME)
  let sp500Units = 0;
  let lastKnownSp500Price: number = 0;

  // Find initial S&P 500 price baseline from historical data
  const sp500History = priceHistoryMap?.["^GSPC"] || {};
  const sp500Dates = Object.keys(sp500History).sort();
  if (sp500Dates.length > 0) {
    lastKnownSp500Price = sp500History[sp500Dates[0]] || 5000;
  }

  const fullTimeline: LifetimeDataPoint[] = [];
  let cumulativeInvested = 0;

  // Overall growth ratio used for fallback interpolation if no priceHistoryMap
  const overallGrowthRatio =
    finalCostBasis > 0 ? finalPortfolioValue / finalCostBasis : 1;

  const hasRealPriceData =
    priceHistoryMap &&
    Object.keys(priceHistoryMap).length > 0 &&
    Boolean(priceHistoryMap["^GSPC"] && Object.keys(priceHistoryMap["^GSPC"]).length > 0);

  for (let i = totalDays; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];

    // Update S&P 500 price for this day if available
    if (sp500History[dateStr]) {
      lastKnownSp500Price = sp500History[dateStr];
    }

    // ── 1. Process transactions on this day ─────────────────────────────────────
    for (const tx of txByDate[dateStr] ?? []) {
      const priceUSD = tx.priceUSD ?? tx.price ?? 0;
      const amount = tx.shares * priceUSD;
      const sym = tx.symbol.toUpperCase();

      if (tx.type === "BUY") {
        cumulativeInvested += amount;

        if (!holdingMap[sym]) {
          holdingMap[sym] = { shares: 0, totalCostUSD: 0 };
        }
        holdingMap[sym].shares += tx.shares;
        holdingMap[sym].totalCostUSD += amount;
        if (priceUSD > 0) {
          lastKnownPrice[sym] = priceUSD;
        }

        // Mirror this investment into S&P 500 benchmark units
        const spPriceAtBuy = sp500History[dateStr] || lastKnownSp500Price || 5000;
        if (spPriceAtBuy > 0) {
          sp500Units += amount / spPriceAtBuy;
        }
      } else if (tx.type === "SELL") {
        const holding = holdingMap[sym];
        if (holding && holding.shares > 0) {
          const sharesToSell = Math.min(tx.shares, holding.shares);
          const avgCostPerShare = holding.totalCostUSD / holding.shares;
          const costReduction = sharesToSell * avgCostPerShare;

          cumulativeInvested = Math.max(0, cumulativeInvested - costReduction);
          holding.shares -= sharesToSell;
          holding.totalCostUSD =
            holding.shares > 0 ? holding.shares * avgCostPerShare : 0;

          // Deduct equivalent value from S&P 500 units
          const spPriceAtSell = sp500History[dateStr] || lastKnownSp500Price || 5000;
          if (spPriceAtSell > 0) {
            const unitsToDeduct = costReduction / spPriceAtSell;
            sp500Units = Math.max(0, sp500Units - unitsToDeduct);
          }
        }
      }
    }

    // ── 2. Calculate Portfolio Value & Benchmark Value ──────────────────────────
    let portfolioValue = 0;
    let sp500Value = 0;

    if (hasRealPriceData) {
      // Calculate true mark-to-market daily portfolio value
      let dayVal = 0;
      for (const [sym, holding] of Object.entries(holdingMap)) {
        if (holding.shares <= 0) continue;

        const symHistory = priceHistoryMap?.[sym];
        if (symHistory && symHistory[dateStr]) {
          lastKnownPrice[sym] = symHistory[dateStr];
        }

        const priceToUse =
          lastKnownPrice[sym] ||
          (holding.shares > 0 ? holding.totalCostUSD / holding.shares : 0);

        dayVal += holding.shares * priceToUse;
      }

      portfolioValue = dayVal > 0 ? dayVal : cumulativeInvested;
      sp500Value = sp500Units > 0 && lastKnownSp500Price > 0
        ? sp500Units * lastKnownSp500Price
        : cumulativeInvested;
    } else {
      // Fallback: smooth interpolation if real quotes are offline / still fetching
      const dayProgress = totalDays > 0 ? (totalDays - i) / totalDays : 1;
      const growthFactor =
        cumulativeInvested > 0 ? Math.pow(overallGrowthRatio, dayProgress) : 1;
      portfolioValue = cumulativeInvested * growthFactor;
      sp500Value = cumulativeInvested * Math.pow(1 + 0.10, ((totalDays - i) / 365));
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

  // Anchor final endpoint to live quote stats for perfect synchronization
  if (fullTimeline.length > 0) {
    const last = fullTimeline[fullTimeline.length - 1];
    if (finalPortfolioValue > 0) {
      last.portfolioValue = Math.round(finalPortfolioValue * 100) / 100;
    }
    if (finalCostBasis > 0) {
      last.invested = Math.round(finalCostBasis * 100) / 100;
    }
  }

  // ── 3. Filter by selected timeframe ─────────────────────────────────────────
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

  // ── 4. Performance Summary ──────────────────────────────────────────────────
  const firstPt = chartData[0];
  const lastPt = chartData[chartData.length - 1];

  let portfolioChange = 0;
  let portfolioChangePercent = 0;
  let sp500Change = 0;
  let sp500ChangePercent = 0;

  if (timeframe === "ALL") {
    // Return measured relative to total invested capital (absolute dollar & percentage gain)
    const investedBase = Math.max(1, lastPt.invested);
    portfolioChange = lastPt.portfolioValue - lastPt.invested;
    portfolioChangePercent = (portfolioChange / investedBase) * 100;

    sp500Change = lastPt.sp500Value - lastPt.invested;
    sp500ChangePercent = (sp500Change / investedBase) * 100;
  } else {
    // Modified Dietz return: accurately accounts for capital deposits/withdrawals within the window
    const capitalInflow = Math.max(0, lastPt.invested - firstPt.invested);
    const netPortfolioGain = (lastPt.portfolioValue - firstPt.portfolioValue) - capitalInflow;
    const netSp500Gain = (lastPt.sp500Value - firstPt.sp500Value) - capitalInflow;

    portfolioChange = netPortfolioGain;
    sp500Change = netSp500Gain;

    const avgPortfolioCapital = firstPt.portfolioValue + 0.5 * capitalInflow;
    portfolioChangePercent =
      avgPortfolioCapital > 0 ? (netPortfolioGain / avgPortfolioCapital) * 100 : 0;

    const avgSpCapital = firstPt.sp500Value + 0.5 * capitalInflow;
    sp500ChangePercent =
      avgSpCapital > 0 ? (netSp500Gain / avgSpCapital) * 100 : 0;
  }

  const outperformanceAmount = portfolioChange - sp500Change;
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

