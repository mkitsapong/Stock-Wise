import { RealTimeHolding } from "@/hooks/usePortfolioQuotes";

export type DividendFrequency = "Monthly" | "Quarterly" | "Semi-Annual" | "Annual";

export interface DividendMeta {
  hasDividend: boolean;
  annualDividend: number; // per share (in base currency of stock, usually USD or THB)
  dividendYield: number;   // annual yield %
  frequency: DividendFrequency;
  payoutMonths: number[];  // 1 to 12 (Jan=1, Dec=12)
  lastDividendDate?: string;
  nextExDate?: string;
  nextPayDate?: string;
  payoutRatio?: number;    // % (e.g. 55%)
  growthYears?: number;    // consecutive years of dividend growth
}

// Built-in verified dividend database
export const DIVIDEND_DATABASE: Record<string, DividendMeta> = {
  // High Yield / Monthly Income ETFs
  QQQI: {
    hasDividend: true,
    annualDividend: 7.12,
    dividendYield: 14.1,
    frequency: "Monthly",
    payoutMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    lastDividendDate: "2026-07-28",
    nextExDate: "2026-08-25",
    nextPayDate: "2026-08-31",
    payoutRatio: 90,
    growthYears: 2,
  },
  JEPI: {
    hasDividend: true,
    annualDividend: 4.25,
    dividendYield: 7.4,
    frequency: "Monthly",
    payoutMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    lastDividendDate: "2026-08-01",
    nextExDate: "2026-09-01",
    nextPayDate: "2026-09-06",
    payoutRatio: 85,
    growthYears: 3,
  },
  JEPQ: {
    hasDividend: true,
    annualDividend: 5.10,
    dividendYield: 9.3,
    frequency: "Monthly",
    payoutMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    lastDividendDate: "2026-08-01",
    nextExDate: "2026-09-01",
    nextPayDate: "2026-09-06",
    payoutRatio: 88,
    growthYears: 3,
  },
  O: {
    hasDividend: true,
    annualDividend: 3.16,
    dividendYield: 5.4,
    frequency: "Monthly",
    payoutMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    lastDividendDate: "2026-07-31",
    nextExDate: "2026-08-30",
    nextPayDate: "2026-09-15",
    payoutRatio: 74,
    growthYears: 29,
  },
  MAIN: {
    hasDividend: true,
    annualDividend: 2.94,
    dividendYield: 6.2,
    frequency: "Monthly",
    payoutMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    lastDividendDate: "2026-07-20",
    nextExDate: "2026-08-20",
    nextPayDate: "2026-09-15",
    payoutRatio: 68,
    growthYears: 13,
  },
  SCHD: {
    hasDividend: true,
    annualDividend: 2.88,
    dividendYield: 3.5,
    frequency: "Quarterly",
    payoutMonths: [3, 6, 9, 12],
    lastDividendDate: "2026-06-24",
    nextExDate: "2026-09-24",
    nextPayDate: "2026-09-30",
    payoutRatio: 60,
    growthYears: 12,
  },

  // US Equities with Dividends
  MCD: {
    hasDividend: true,
    annualDividend: 7.08,
    dividendYield: 2.3,
    frequency: "Quarterly",
    payoutMonths: [3, 6, 9, 12],
    lastDividendDate: "2026-06-03",
    nextExDate: "2026-09-02",
    nextPayDate: "2026-09-16",
    payoutRatio: 56,
    growthYears: 47,
  },
  LLY: {
    hasDividend: true,
    annualDividend: 5.20,
    dividendYield: 0.6,
    frequency: "Quarterly",
    payoutMonths: [3, 6, 9, 12],
    lastDividendDate: "2026-05-15",
    nextExDate: "2026-08-15",
    nextPayDate: "2026-09-10",
    payoutRatio: 62,
    growthYears: 10,
  },
  AAPL: {
    hasDividend: true,
    annualDividend: 1.00,
    dividendYield: 0.45,
    frequency: "Quarterly",
    payoutMonths: [2, 5, 8, 11],
    lastDividendDate: "2026-08-08",
    nextExDate: "2026-11-07",
    nextPayDate: "2026-11-14",
    payoutRatio: 15,
    growthYears: 12,
  },
  MSFT: {
    hasDividend: true,
    annualDividend: 3.00,
    dividendYield: 0.72,
    frequency: "Quarterly",
    payoutMonths: [3, 6, 9, 12],
    lastDividendDate: "2026-08-14",
    nextExDate: "2026-11-19",
    nextPayDate: "2026-12-11",
    payoutRatio: 25,
    growthYears: 19,
  },
  NVDA: {
    hasDividend: true,
    annualDividend: 0.04,
    dividendYield: 0.03,
    frequency: "Quarterly",
    payoutMonths: [3, 6, 9, 12],
    lastDividendDate: "2026-06-11",
    nextExDate: "2026-09-11",
    nextPayDate: "2026-10-02",
    payoutRatio: 2,
    growthYears: 6,
  },
  JNJ: {
    hasDividend: true,
    annualDividend: 4.96,
    dividendYield: 3.1,
    frequency: "Quarterly",
    payoutMonths: [3, 6, 9, 12],
    lastDividendDate: "2026-05-20",
    nextExDate: "2026-08-26",
    nextPayDate: "2026-09-09",
    payoutRatio: 48,
    growthYears: 62,
  },
  KO: {
    hasDividend: true,
    annualDividend: 1.94,
    dividendYield: 2.9,
    frequency: "Quarterly",
    payoutMonths: [4, 7, 10, 12],
    lastDividendDate: "2026-06-14",
    nextExDate: "2026-09-13",
    nextPayDate: "2026-10-01",
    payoutRatio: 68,
    growthYears: 62,
  },
  PG: {
    hasDividend: true,
    annualDividend: 4.03,
    dividendYield: 2.4,
    frequency: "Quarterly",
    payoutMonths: [2, 5, 8, 11],
    lastDividendDate: "2026-07-18",
    nextExDate: "2026-10-18",
    nextPayDate: "2026-11-15",
    payoutRatio: 60,
    growthYears: 67,
  },
  VZ: {
    hasDividend: true,
    annualDividend: 2.66,
    dividendYield: 6.5,
    frequency: "Quarterly",
    payoutMonths: [2, 5, 8, 11],
    lastDividendDate: "2026-07-09",
    nextExDate: "2026-10-09",
    nextPayDate: "2026-11-01",
    payoutRatio: 55,
    growthYears: 18,
  },
  MO: {
    hasDividend: true,
    annualDividend: 4.08,
    dividendYield: 8.1,
    frequency: "Quarterly",
    payoutMonths: [1, 4, 7, 10],
    lastDividendDate: "2026-06-14",
    nextExDate: "2026-09-14",
    nextPayDate: "2026-10-10",
    payoutRatio: 78,
    growthYears: 54,
  },

  // Thai Stocks (SET .BK)
  "PTT.BK": {
    hasDividend: true,
    annualDividend: 2.00,
    dividendYield: 5.8,
    frequency: "Semi-Annual",
    payoutMonths: [4, 9],
    lastDividendDate: "2026-04-25",
    nextExDate: "2026-09-04",
    nextPayDate: "2026-09-26",
    payoutRatio: 45,
    growthYears: 5,
  },
  "SCB.BK": {
    hasDividend: true,
    annualDividend: 10.44,
    dividendYield: 7.4,
    frequency: "Semi-Annual",
    payoutMonths: [4, 9],
    lastDividendDate: "2026-04-20",
    nextExDate: "2026-09-02",
    nextPayDate: "2026-09-22",
    payoutRatio: 65,
    growthYears: 4,
  },
  "BDMS.BK": {
    hasDividend: true,
    annualDividend: 0.70,
    dividendYield: 2.6,
    frequency: "Semi-Annual",
    payoutMonths: [4, 9],
    lastDividendDate: "2026-04-18",
    nextExDate: "2026-09-12",
    nextPayDate: "2026-09-28",
    payoutRatio: 50,
    growthYears: 7,
  },
  "CPALL.BK": {
    hasDividend: true,
    annualDividend: 1.00,
    dividendYield: 1.8,
    frequency: "Annual",
    payoutMonths: [5],
    lastDividendDate: "2026-05-10",
    nextExDate: "2027-04-28",
    nextPayDate: "2027-05-20",
    payoutRatio: 48,
    growthYears: 8,
  },
  "ADVANC.BK": {
    hasDividend: true,
    annualDividend: 8.61,
    dividendYield: 3.9,
    frequency: "Semi-Annual",
    payoutMonths: [4, 8],
    lastDividendDate: "2026-04-12",
    nextExDate: "2026-08-18",
    nextPayDate: "2026-09-03",
    payoutRatio: 82,
    growthYears: 10,
  },
};

export interface EnrichedDividendHolding extends RealTimeHolding {
  hasDividend: boolean;
  annualDividend: number;
  dividendYield: number;
  yieldOnCost: number;
  annualIncome: number;
  monthlyAverageIncome: number;
  frequency: DividendFrequency;
  payoutMonths: number[];
  lastDividendDate?: string;
  nextExDate?: string;
  nextPayDate?: string;
  payoutRatio?: number;
  growthYears?: number;
  isCustomOverride?: boolean;
}

export interface MonthlyCashflowPoint {
  monthIndex: number; // 0 to 11
  monthName: string;  // "Jan", "Feb", etc.
  projectedIncome: number;
  symbols: string[];
}

export interface PortfolioDividendSummary {
  totalAnnualIncome: number;
  monthlyAverageIncome: number;
  portfolioDividendYield: number; // weighted by market value
  portfolioYieldOnCost: number;   // weighted by cost basis
  dividendPayingCount: number;
  totalHoldingsCount: number;
  dividendShareRatio: number;     // % of portfolio value that pays dividends
  monthlySchedule: MonthlyCashflowPoint[];
  dividendHoldings: EnrichedDividendHolding[];
}

/**
 * Get custom user overrides from localStorage
 */
export function getDividendOverrides(): Record<string, Partial<DividendMeta>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("stockwise_dividend_overrides");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Save custom user override to localStorage
 */
export function saveDividendOverride(symbol: string, meta: Partial<DividendMeta>) {
  if (typeof window === "undefined") return;
  try {
    const current = getDividendOverrides();
    current[symbol] = { ...current[symbol], ...meta };
    localStorage.setItem("stockwise_dividend_overrides", JSON.stringify(current));
  } catch (e) {
    console.error("Failed to save dividend override", e);
  }
}

/**
 * Enrich holding with accurate dividend metadata
 */
export function enrichHoldingWithDividends(
  holding: RealTimeHolding,
  overrides: Record<string, Partial<DividendMeta>> = {}
): EnrichedDividendHolding {
  const sym = holding.symbol.toUpperCase();
  const dbData = DIVIDEND_DATABASE[sym] || DIVIDEND_DATABASE[holding.symbol];
  const customData = overrides[sym] || overrides[holding.symbol];

  const currentPrice = holding.currentPrice || holding.avgCost || 1;
  const avgCost = holding.avgCost || 1;
  const shares = holding.shares || 0;
  const positionValue = shares * currentPrice;

  let hasDividend = false;
  let annualDividend = 0;
  let dividendYield = 0;
  let frequency: DividendFrequency = "Quarterly";
  let payoutMonths = [3, 6, 9, 12];
  let lastDividendDate: string | undefined = undefined;
  let nextExDate: string | undefined = undefined;
  let nextPayDate: string | undefined = undefined;
  let payoutRatio: number | undefined = undefined;
  let growthYears: number | undefined = undefined;
  let isCustomOverride = false;

  if (customData) {
    hasDividend = customData.hasDividend ?? (dbData?.hasDividend ?? true);
    annualDividend = customData.annualDividend ?? (dbData?.annualDividend ?? 0);
    dividendYield = customData.dividendYield ?? (annualDividend > 0 ? (annualDividend / currentPrice) * 100 : dbData?.dividendYield ?? 0);
    frequency = customData.frequency ?? (dbData?.frequency ?? "Quarterly");
    payoutMonths = customData.payoutMonths ?? (dbData?.payoutMonths ?? [3, 6, 9, 12]);
    lastDividendDate = customData.lastDividendDate ?? dbData?.lastDividendDate;
    nextExDate = customData.nextExDate ?? dbData?.nextExDate;
    nextPayDate = customData.nextPayDate ?? dbData?.nextPayDate;
    isCustomOverride = true;
  } else if (dbData) {
    hasDividend = dbData.hasDividend;
    annualDividend = dbData.annualDividend;
    dividendYield = dbData.dividendYield;
    frequency = dbData.frequency;
    payoutMonths = dbData.payoutMonths;
    lastDividendDate = dbData.lastDividendDate;
    nextExDate = dbData.nextExDate;
    nextPayDate = dbData.nextPayDate;
    payoutRatio = dbData.payoutRatio;
    growthYears = dbData.growthYears;
  } else if (holding.hasDividend || (holding.dividendYield && holding.dividendYield > 0)) {
    hasDividend = true;
    dividendYield = holding.dividendYield || 2.5;
    annualDividend = holding.annualDividend || (currentPrice * (dividendYield / 100));
    frequency = "Quarterly";
    payoutMonths = [3, 6, 9, 12];
  }

  // Calculate annual income and Yield on Cost
  const annualIncome = hasDividend ? annualDividend * shares : 0;
  const monthlyAverageIncome = annualIncome / 12;
  const yieldOnCost = (hasDividend && avgCost > 0) ? (annualDividend / avgCost) * 100 : 0;

  return {
    ...holding,
    hasDividend,
    annualDividend,
    dividendYield,
    yieldOnCost,
    annualIncome,
    monthlyAverageIncome,
    frequency,
    payoutMonths,
    lastDividendDate,
    nextExDate,
    nextPayDate,
    payoutRatio,
    growthYears,
    isCustomOverride,
  };
}

/**
 * Calculate full portfolio dividend statistics and 12-month projected cash flow
 */
export function calculatePortfolioDividendSummary(
  holdings: RealTimeHolding[]
): PortfolioDividendSummary {
  const overrides = typeof window !== "undefined" ? getDividendOverrides() : {};
  const enriched = holdings.map((h) => enrichHoldingWithDividends(h, overrides));

  const dividendHoldings = enriched.filter((h) => h.hasDividend && h.annualIncome > 0);

  const totalPortfolioValue = enriched.reduce(
    (sum, h) => sum + (h.shares * (h.currentPrice || h.avgCost || 0)),
    0
  );
  const totalCostBasis = enriched.reduce(
    (sum, h) => sum + (h.shares * (h.avgCost || 0)),
    0
  );

  const totalAnnualIncome = dividendHoldings.reduce((sum, h) => sum + h.annualIncome, 0);
  const monthlyAverageIncome = totalAnnualIncome / 12;

  const portfolioDividendYield = totalPortfolioValue > 0 ? (totalAnnualIncome / totalPortfolioValue) * 100 : 0;
  const portfolioYieldOnCost = totalCostBasis > 0 ? (totalAnnualIncome / totalCostBasis) * 100 : 0;

  const dividendValue = dividendHoldings.reduce(
    (sum, h) => sum + (h.shares * (h.currentPrice || h.avgCost || 0)),
    0
  );
  const dividendShareRatio = totalPortfolioValue > 0 ? (dividendValue / totalPortfolioValue) * 100 : 0;

  // Generate 12-Month Projected Schedule
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlySchedule: MonthlyCashflowPoint[] = monthNames.map((name, idx) => {
    const monthNum = idx + 1; // 1 to 12
    let projectedIncome = 0;
    const payingSymbols: string[] = [];

    for (const h of dividendHoldings) {
      if (h.payoutMonths.includes(monthNum)) {
        // Income per payout event
        const payoutsPerYear = Math.max(1, h.payoutMonths.length);
        const incomePerEvent = h.annualIncome / payoutsPerYear;
        projectedIncome += incomePerEvent;
        payingSymbols.push(h.symbol);
      }
    }

    return {
      monthIndex: idx,
      monthName: name,
      projectedIncome: Math.round(projectedIncome * 100) / 100,
      symbols: payingSymbols,
    };
  });

  return {
    totalAnnualIncome,
    monthlyAverageIncome,
    portfolioDividendYield,
    portfolioYieldOnCost,
    dividendPayingCount: dividendHoldings.length,
    totalHoldingsCount: holdings.length,
    dividendShareRatio,
    monthlySchedule,
    dividendHoldings: dividendHoldings.sort((a, b) => b.annualIncome - a.annualIncome),
  };
}
