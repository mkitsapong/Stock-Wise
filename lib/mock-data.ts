// ============================================================
// Types
// ============================================================

export interface Holding {
  symbol: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice?: number;
  dayChange?: number;       // dollar change today
  dayChangePercent?: number; // percent change today
  sector: string;
  hasDividend?: boolean;
  dividendYield?: number;   // annual yield %
  lastDividendDate?: string;
  annualDividend?: number;  // per share
}

export interface WatchlistItem {
  symbol: string;
  name: string;
  currentPrice: number;
  dayChange: number;
  dayChangePercent: number;
  targetBuyPrice: number;
  sparklineData: number[]; // 7 days of prices
}

export interface Transaction {
  id: string;
  date: string;
  type: "BUY" | "SELL";
  symbol: string;
  shares: number;
  price: number;
  total: number;
}

export interface PortfolioSnapshot {
  date: string;
  value: number;
}

// ============================================================
// Portfolio Holdings
// ============================================================

export const holdings: Holding[] = [
  {
    symbol: "NFLX",
    name: "Netflix Inc.",
    shares: 8,
    avgCost: 485.20,
    currentPrice: 1105.40,
    dayChange: 18.72,
    dayChangePercent: 1.72,
    sector: "Technology",
  },
  {
    symbol: "RKLB",
    name: "Rocket Lab USA",
    shares: 150,
    avgCost: 12.85,
    currentPrice: 38.92,
    dayChange: 1.45,
    dayChangePercent: 3.87,
    sector: "Aerospace",
  },
  {
    symbol: "HIMS",
    name: "Hims & Hers Health",
    shares: 100,
    avgCost: 18.40,
    currentPrice: 68.25,
    dayChange: -2.15,
    dayChangePercent: -3.05,
    sector: "Healthcare",
  },
  {
    symbol: "TEM",
    name: "Tempus AI Inc.",
    shares: 60,
    avgCost: 42.50,
    currentPrice: 95.80,
    dayChange: 3.20,
    dayChangePercent: 3.46,
    sector: "AI / Healthcare",
  },
  {
    symbol: "QQQI",
    name: "NEOS Nasdaq-100 ETF",
    shares: 200,
    avgCost: 48.90,
    currentPrice: 52.35,
    dayChange: 0.28,
    dayChangePercent: 0.54,
    sector: "ETF / Income",
    hasDividend: true,
    dividendYield: 13.8,
    lastDividendDate: "2026-07-25",
    annualDividend: 6.72,
  },
];

// ============================================================
// Derived Portfolio Stats
// ============================================================

export function getPortfolioStats() {
  let totalValue = 0;
  let totalCost = 0;
  let dayChangeTotal = 0;

  for (const h of holdings) {
    const value = h.shares * h.currentPrice;
    const cost = h.shares * h.avgCost;
    totalValue += value;
    totalCost += cost;
    dayChangeTotal += h.shares * h.dayChange;
  }

  const unrealizedPL = totalValue - totalCost;
  const unrealizedPLPercent = ((unrealizedPL / totalCost) * 100);
  const dayChangePercent = (dayChangeTotal / (totalValue - dayChangeTotal)) * 100;

  return {
    totalValue,
    totalCost,
    unrealizedPL,
    unrealizedPLPercent,
    dayChangeTotal,
    dayChangePercent,
  };
}

// ============================================================
// Sector Allocation (for Donut Chart)
// ============================================================

export function getSectorAllocation() {
  const sectors: Record<string, number> = {};
  for (const h of holdings) {
    const value = h.shares * h.currentPrice;
    sectors[h.sector] = (sectors[h.sector] || 0) + value;
  }
  return Object.entries(sectors).map(([name, value]) => ({ name, value }));
}

// ============================================================
// Portfolio Growth (Line Chart)
// ============================================================

function generateGrowthData(): PortfolioSnapshot[] {
  const data: PortfolioSnapshot[] = [];
  const now = new Date(2026, 7, 11); // Aug 11, 2026
  const startValue = 28000;
  let value = startValue;

  for (let i = 365; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Simulate realistic growth with some volatility
    const trend = 0.0008; // ~30% annual
    const volatility = (Math.sin(i * 0.15) * 0.008) + (Math.cos(i * 0.07) * 0.005);
    const noise = (Math.sin(i * 2.3) * 0.003);
    value = value * (1 + trend + volatility + noise);

    data.push({
      date: date.toISOString().split("T")[0],
      value: Math.round(value * 100) / 100,
    });
  }

  return data;
}

export const portfolioGrowth = generateGrowthData();

export function getGrowthData(period: "1M" | "6M" | "YTD") {
  const now = new Date(2026, 7, 11);
  let cutoff: Date;

  switch (period) {
    case "1M":
      cutoff = new Date(now);
      cutoff.setMonth(cutoff.getMonth() - 1);
      break;
    case "6M":
      cutoff = new Date(now);
      cutoff.setMonth(cutoff.getMonth() - 6);
      break;
    case "YTD":
      cutoff = new Date(2026, 0, 1);
      break;
  }

  const cutoffStr = cutoff.toISOString().split("T")[0];
  return portfolioGrowth.filter((d) => d.date >= cutoffStr);
}

// ============================================================
// Top Movers
// ============================================================

export function getTopGainers() {
  return [...holdings]
    .filter((h) => h.dayChangePercent > 0)
    .sort((a, b) => b.dayChangePercent - a.dayChangePercent)
    .slice(0, 5);
}

export function getTopLosers() {
  return [...holdings]
    .filter((h) => h.dayChangePercent < 0)
    .sort((a, b) => a.dayChangePercent - b.dayChangePercent)
    .slice(0, 5);
}

// ============================================================
// Watchlist
// ============================================================

export const watchlistItems: WatchlistItem[] = [
  {
    symbol: "TJX",
    name: "TJX Companies",
    currentPrice: 132.45,
    dayChange: 1.85,
    dayChangePercent: 1.42,
    targetBuyPrice: 120.00,
    sparklineData: [128.5, 129.8, 131.2, 130.0, 132.1, 131.5, 132.45],
  },
  {
    symbol: "PLANB",
    name: "Plan B Technologies",
    currentPrice: 8.92,
    dayChange: -0.34,
    dayChangePercent: -3.67,
    targetBuyPrice: 7.50,
    sparklineData: [9.80, 9.45, 9.20, 9.10, 8.85, 9.05, 8.92],
  },
  {
    symbol: "PLTR",
    name: "Palantir Technologies",
    currentPrice: 178.30,
    dayChange: 5.60,
    dayChangePercent: 3.24,
    targetBuyPrice: 150.00,
    sparklineData: [168.2, 170.5, 172.8, 175.1, 173.9, 176.4, 178.30],
  },
  {
    symbol: "SOFI",
    name: "SoFi Technologies",
    currentPrice: 18.75,
    dayChange: 0.42,
    dayChangePercent: 2.29,
    targetBuyPrice: 15.00,
    sparklineData: [17.2, 17.8, 18.1, 17.9, 18.3, 18.5, 18.75],
  },
  {
    symbol: "MSTR",
    name: "MicroStrategy",
    currentPrice: 1850.00,
    dayChange: -42.50,
    dayChangePercent: -2.25,
    targetBuyPrice: 1500.00,
    sparklineData: [1920, 1895, 1870, 1885, 1860, 1840, 1850],
  },
  {
    symbol: "SHOP",
    name: "Shopify Inc.",
    currentPrice: 98.40,
    dayChange: 2.15,
    dayChangePercent: 2.23,
    targetBuyPrice: 85.00,
    sparklineData: [93.5, 94.8, 96.2, 95.0, 97.1, 97.8, 98.40],
  },
];

// ============================================================
// Transactions
// ============================================================

export const transactions: Transaction[] = [
  {
    id: "txn-001",
    date: "2026-08-10",
    type: "BUY",
    symbol: "TEM",
    shares: 20,
    price: 94.80,
    total: 1896.00,
  },
  {
    id: "txn-002",
    date: "2026-08-05",
    type: "BUY",
    symbol: "QQQI",
    shares: 50,
    price: 51.90,
    total: 2595.00,
  },
  {
    id: "txn-003",
    date: "2026-07-28",
    type: "SELL",
    symbol: "HIMS",
    shares: 25,
    price: 72.10,
    total: 1802.50,
  },
  {
    id: "txn-004",
    date: "2026-07-20",
    type: "BUY",
    symbol: "RKLB",
    shares: 50,
    price: 35.40,
    total: 1770.00,
  },
  {
    id: "txn-005",
    date: "2026-07-15",
    type: "BUY",
    symbol: "NFLX",
    shares: 3,
    price: 1050.00,
    total: 3150.00,
  },
  {
    id: "txn-006",
    date: "2026-07-01",
    type: "BUY",
    symbol: "TEM",
    shares: 40,
    price: 38.50,
    total: 1540.00,
  },
  {
    id: "txn-007",
    date: "2026-06-18",
    type: "BUY",
    symbol: "HIMS",
    shares: 50,
    price: 22.30,
    total: 1115.00,
  },
  {
    id: "txn-008",
    date: "2026-06-10",
    type: "BUY",
    symbol: "QQQI",
    shares: 100,
    price: 47.80,
    total: 4780.00,
  },
  {
    id: "txn-009",
    date: "2026-05-25",
    type: "BUY",
    symbol: "RKLB",
    shares: 100,
    price: 10.20,
    total: 1020.00,
  },
  {
    id: "txn-010",
    date: "2026-05-12",
    type: "BUY",
    symbol: "NFLX",
    shares: 5,
    price: 460.00,
    total: 2300.00,
  },
  {
    id: "txn-011",
    date: "2026-04-30",
    type: "BUY",
    symbol: "QQQI",
    shares: 50,
    price: 49.20,
    total: 2460.00,
  },
  {
    id: "txn-012",
    date: "2026-04-15",
    type: "BUY",
    symbol: "HIMS",
    shares: 75,
    price: 16.80,
    total: 1260.00,
  },
];

// ============================================================
// Sector Colors (for charts)
// ============================================================

export const SECTOR_COLORS: Record<string, string> = {
  "Technology": "#6366f1",       // indigo
  "Aerospace": "#06b6d4",       // cyan
  "Healthcare": "#f59e0b",      // amber
  "AI / Healthcare": "#8b5cf6", // violet
  "ETF / Income": "#10b981",    // emerald
};

// ============================================================
// Candlestick OHLC Data (for Lightweight Charts)
// ============================================================

export interface OHLCData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

/**
 * Generate realistic OHLC candlestick data for a given symbol
 */
export function generateCandlestickData(
  symbol: string,
  days = 90
): OHLCData[] {
  // Base prices per symbol
  const basePrices: Record<string, number> = {
    NFLX: 980,
    RKLB: 28,
    HIMS: 45,
    TEM: 70,
    QQQI: 48,
    TJX: 125,
    PLTR: 155,
    SOFI: 15,
    MSTR: 1600,
    SHOP: 85,
  };

  const basePrice = basePrices[symbol] || 100;
  const data: OHLCData[] = [];
  const now = new Date(2026, 7, 11); // Aug 11, 2026

  let price = basePrice;

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Skip weekends
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue;

    // Daily volatility (2-4% range)
    const volatility = basePrice * 0.025;
    const trend = Math.sin(i * 0.05) * 0.002 + 0.001; // slight uptrend

    const open = price;
    const change = (Math.random() - 0.48 + trend) * volatility;
    const close = open + change;

    // Intraday range
    const highExtra = Math.random() * volatility * 0.6;
    const lowExtra = Math.random() * volatility * 0.6;
    const high = Math.max(open, close) + highExtra;
    const low = Math.min(open, close) - lowExtra;

    data.push({
      date: date.toISOString().split("T")[0],
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
    });

    price = close; // next day opens near previous close
  }

  return data;
}



