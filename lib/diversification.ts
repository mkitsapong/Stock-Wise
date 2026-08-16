import { RealTimeHolding } from "@/hooks/usePortfolioQuotes";

// ============================================================
// Sector & Asset Mapping Dictionary
// ============================================================

export const SECTOR_MAP: Record<string, string> = {
  // Technology
  AAPL: "Technology",
  MSFT: "Technology",
  NVDA: "Technology",
  GOOGL: "Technology",
  GOOG: "Technology",
  META: "Technology",
  NFLX: "Technology",
  AMD: "Technology",
  INTC: "Technology",
  AVGO: "Technology",
  CRM: "Technology",
  PLTR: "Technology",
  SHOP: "Technology",
  SNOW: "Technology",
  ORCL: "Technology",
  ADBE: "Technology",
  MSTR: "Technology",
  TSM: "Technology",
  ASML: "Technology",

  // Aerospace & Defense
  RKLB: "Aerospace & Defense",
  BA: "Aerospace & Defense",
  LMT: "Aerospace & Defense",
  RTX: "Aerospace & Defense",
  NOC: "Aerospace & Defense",

  // Healthcare & Biotech
  HIMS: "Healthcare",
  TEM: "AI / Healthcare",
  LLY: "Healthcare",
  UNH: "Healthcare",
  JNJ: "Healthcare",
  PFE: "Healthcare",
  ABBV: "Healthcare",
  MRK: "Healthcare",
  TMO: "Healthcare",
  ISRG: "Healthcare",
  BDMS: "Healthcare",
  "BDMS.BK": "Healthcare",
  "BH.BK": "Healthcare",

  // Consumer & Retail
  AMZN: "Consumer & Retail",
  TSLA: "Consumer & Automotive",
  WMT: "Consumer & Retail",
  COST: "Consumer & Retail",
  HD: "Consumer & Retail",
  NKE: "Consumer & Retail",
  MCD: "Consumer & Retail",
  SBUX: "Consumer & Retail",
  TJX: "Consumer & Retail",
  "CPALL.BK": "Consumer & Retail",
  "CRC.BK": "Consumer & Retail",
  "BJC.BK": "Consumer & Retail",

  // Financials & Fintech
  JPM: "Financials & Banking",
  BAC: "Financials & Banking",
  V: "Financials & Payments",
  MA: "Financials & Payments",
  PYPL: "Financials & Payments",
  SOFI: "Financials & Fintech",
  COIN: "Crypto / Fintech",
  "KBANK.BK": "Financials & Banking",
  "SCB.BK": "Financials & Banking",
  "BBL.BK": "Financials & Banking",
  "KTB.BK": "Financials & Banking",

  // Energy & Utilities
  XOM: "Energy",
  CVX: "Energy",
  COP: "Energy",
  "PTT.BK": "Energy & Utilities",
  "PTTEP.BK": "Energy & Utilities",
  "TOP.BK": "Energy & Utilities",
  "GULF.BK": "Energy & Utilities",
  "GPSC.BK": "Energy & Utilities",

  // Telecom & Media
  "ADVANC.BK": "Telecom & Media",
  "TRUE.BK": "Telecom & Media",
  T: "Telecom & Media",
  VZ: "Telecom & Media",

  // Transportation & Industrial
  "AOT.BK": "Transportation & Logistics",
  CAT: "Industrials",
  GE: "Industrials",
  UPS: "Transportation & Logistics",

  // ETFs & Funds
  QQQI: "ETF / Income",
  SPY: "ETF / Index",
  VOO: "ETF / Index",
  QQQ: "ETF / Tech Index",
  SCHD: "ETF / Dividend",
  JEPI: "ETF / Income",
  JEPQ: "ETF / Income",
  VTI: "ETF / Total Market",
  VT: "ETF / Global",
  IVV: "ETF / Index",
};

export const SECTOR_COLORS: Record<string, string> = {
  "Technology": "#6366f1",            // Indigo
  "Aerospace & Defense": "#06b6d4",   // Cyan
  "Healthcare": "#10b981",            // Emerald
  "AI / Healthcare": "#8b5cf6",       // Violet
  "Consumer & Retail": "#f59e0b",     // Amber
  "Consumer & Automotive": "#f97316", // Orange
  "Financials & Banking": "#3b82f6",  // Blue
  "Financials & Payments": "#0284c7", // Sky Blue
  "Financials & Fintech": "#0ea5e9",  // Sky
  "Energy & Utilities": "#eab308",    // Yellow
  "Energy": "#d97706",                // Amber dark
  "Telecom & Media": "#ec4899",       // Pink
  "Transportation & Logistics": "#14b8a6", // Teal
  "Industrials": "#64748b",           // Slate
  "ETF / Income": "#22c55e",          // Green
  "ETF / Index": "#38bdf8",           // Light Blue
  "ETF / Tech Index": "#818cf8",      // Light Indigo
  "ETF / Dividend": "#34d399",        // Light Emerald
  "Crypto / Fintech": "#a855f7",      // Purple
  "Other / Equities": "#94a3b8",      // Gray
};

export function getHoldingSector(symbol: string, existingSector?: string): string {
  const upper = symbol.toUpperCase().trim();
  if (SECTOR_MAP[upper]) return SECTOR_MAP[upper];
  if (upper.endsWith(".BK")) {
    const base = upper.replace(".BK", "");
    if (SECTOR_MAP[base]) return SECTOR_MAP[base];
    return "Thai Equities (SET)";
  }
  if (existingSector && existingSector !== "General") return existingSector;
  return "Other / Equities";
}

export function getHoldingMarket(symbol: string): "US" | "THAI" | "ETF" | "CRYPTO" {
  const upper = symbol.toUpperCase().trim();
  if (upper.endsWith(".BK") || upper.endsWith(".SET")) return "THAI";
  if (upper.includes("BTC") || upper.includes("ETH") || upper === "COIN") return "CRYPTO";
  if (["QQQI", "SPY", "VOO", "QQQ", "SCHD", "JEPI", "JEPQ", "VTI", "VT", "IVV"].includes(upper)) return "ETF";
  return "US";
}

// ============================================================
// Diversification Analysis Types
// ============================================================

export interface SectorItem {
  name: string;
  value: number;
  percentage: number;
  color: string;
  holdingCount: number;
  symbols: string[];
}

export interface HoldingConcentrationItem {
  symbol: string;
  name: string;
  value: number;
  percentage: number;
  sector: string;
  riskLevel: "LOW" | "MODERATE" | "HIGH"; // HIGH: >25%, MODERATE: 12-25%, LOW: <12%
}

export interface MarketMixItem {
  market: string;
  value: number;
  percentage: number;
  color: string;
  count: number;
}

export interface DiversificationHealth {
  score: number; // 0 - 100
  grade: "A+" | "A" | "B" | "C" | "D";
  status: string;
  statusTh: string;
  colorClass: string;
  topHoldingWeight: number; // %
  top3HoldingsWeight: number; // %
  maxSectorWeight: number; // %
  sectorCount: number;
  positionCount: number;
  hhiIndex: number; // Herfindahl-Hirschman Index (0 - 10,000)
}

export interface DiversificationInsight {
  id: string;
  type: "WARNING" | "TIP" | "STRENGTH" | "INFO";
  title: string;
  titleTh: string;
  description: string;
  descriptionTh: string;
  impact: string;
}

// ============================================================
// Calculation Functions
// ============================================================

export function calculateSectorBreakdown(holdings: RealTimeHolding[]): SectorItem[] {
  const totalValue = holdings.reduce((sum, h) => sum + (h.realTimeValue ?? (h.shares * (h.currentPrice || h.avgCost))), 0);
  if (totalValue <= 0) return [];

  const map: Record<string, { value: number; count: number; symbols: string[] }> = {};

  holdings.forEach((h) => {
    const val = h.realTimeValue ?? (h.shares * (h.currentPrice || h.avgCost));
    const sector = getHoldingSector(h.symbol, h.sector);

    if (!map[sector]) {
      map[sector] = { value: 0, count: 0, symbols: [] };
    }
    map[sector].value += val;
    map[sector].count += 1;
    map[sector].symbols.push(h.symbol);
  });

  return Object.entries(map)
    .map(([name, data]) => ({
      name,
      value: data.value,
      percentage: (data.value / totalValue) * 100,
      color: SECTOR_COLORS[name] || "#6366f1",
      holdingCount: data.count,
      symbols: data.symbols,
    }))
    .sort((a, b) => b.value - a.value);
}

export function calculateHoldingConcentration(holdings: RealTimeHolding[]): HoldingConcentrationItem[] {
  const totalValue = holdings.reduce((sum, h) => sum + (h.realTimeValue ?? (h.shares * (h.currentPrice || h.avgCost))), 0);
  if (totalValue <= 0) return [];

  return holdings
    .map((h) => {
      const val = h.realTimeValue ?? (h.shares * (h.currentPrice || h.avgCost));
      const percentage = (val / totalValue) * 100;
      let riskLevel: "LOW" | "MODERATE" | "HIGH" = "LOW";
      if (percentage > 25) riskLevel = "HIGH";
      else if (percentage >= 12) riskLevel = "MODERATE";

      return {
        symbol: h.symbol,
        name: h.name || h.symbol,
        value: val,
        percentage,
        sector: getHoldingSector(h.symbol, h.sector),
        riskLevel,
      };
    })
    .sort((a, b) => b.value - a.value);
}

export function calculateMarketMix(holdings: RealTimeHolding[]): MarketMixItem[] {
  const totalValue = holdings.reduce((sum, h) => sum + (h.realTimeValue ?? (h.shares * (h.currentPrice || h.avgCost))), 0);
  if (totalValue <= 0) return [];

  const map: Record<string, { value: number; count: number; color: string }> = {
    "US Equities": { value: 0, count: 0, color: "#6366f1" },
    "Thai Equities (SET)": { value: 0, count: 0, color: "#a855f7" },
    "ETFs & Funds": { value: 0, count: 0, color: "#10b981" },
    "Crypto & Other": { value: 0, count: 0, color: "#f59e0b" },
  };

  holdings.forEach((h) => {
    const val = h.realTimeValue ?? (h.shares * (h.currentPrice || h.avgCost));
    const market = getHoldingMarket(h.symbol);

    if (market === "US") {
      map["US Equities"].value += val;
      map["US Equities"].count += 1;
    } else if (market === "THAI") {
      map["Thai Equities (SET)"].value += val;
      map["Thai Equities (SET)"].count += 1;
    } else if (market === "ETF") {
      map["ETFs & Funds"].value += val;
      map["ETFs & Funds"].count += 1;
    } else {
      map["Crypto & Other"].value += val;
      map["Crypto & Other"].count += 1;
    }
  });

  return Object.entries(map)
    .filter(([_, data]) => data.value > 0)
    .map(([market, data]) => ({
      market,
      value: data.value,
      percentage: (data.value / totalValue) * 100,
      color: data.color,
      count: data.count,
    }))
    .sort((a, b) => b.value - a.value);
}

export function calculateDiversificationHealth(holdings: RealTimeHolding[]): DiversificationHealth {
  const totalValue = holdings.reduce((sum, h) => sum + (h.realTimeValue ?? (h.shares * (h.currentPrice || h.avgCost))), 0);

  if (holdings.length === 0 || totalValue <= 0) {
    return {
      score: 0,
      grade: "D",
      status: "High Concentration Risk",
      statusTh: "ไม่มีข้อมูลสินทรัพย์ในพอร์ต",
      colorClass: "text-muted",
      topHoldingWeight: 0,
      top3HoldingsWeight: 0,
      maxSectorWeight: 0,
      sectorCount: 0,
      positionCount: 0,
      hhiIndex: 0,
    };
  }

  // Calculate Holding Weights & HHI (Herfindahl-Hirschman Index)
  const weights = holdings.map((h) => {
    const val = h.realTimeValue ?? (h.shares * (h.currentPrice || h.avgCost));
    return (val / totalValue) * 100;
  }).sort((a, b) => b - a);

  const topHoldingWeight = weights[0] || 0;
  const top3HoldingsWeight = weights.slice(0, 3).reduce((a, b) => a + b, 0);

  // HHI is sum of squares of percentages (ranges 0 to 10,000)
  // Low concentration: HHI < 1500 (Score 100-80)
  // Moderate: HHI 1500 - 2500 (Score 80-60)
  // High: HHI > 2500 (Score < 60)
  const hhiIndex = weights.reduce((sum, w) => sum + Math.pow(w, 2), 0);

  // Sector Breadth
  const sectors = calculateSectorBreakdown(holdings);
  const sectorCount = sectors.length;
  const maxSectorWeight = sectors[0]?.percentage || 0;
  const positionCount = holdings.length;

  // Compute composite score (0 - 100)
  // 1. Concentration Score (40% weight): Best if HHI < 1200 & top holding < 15%
  let concentrationScore = 100;
  if (topHoldingWeight > 40) {
    concentrationScore = Math.max(20, 100 - (topHoldingWeight - 40) * 2.5 - 35);
  } else if (topHoldingWeight > 25) {
    concentrationScore = 75 - (topHoldingWeight - 25) * 2;
  } else if (topHoldingWeight > 15) {
    concentrationScore = 90 - (topHoldingWeight - 15) * 1.5;
  }

  // 2. Sector Diversity Score (30% weight): Best if >= 4 sectors and max sector < 35%
  let sectorScore = 100;
  if (sectorCount === 1) sectorScore = 30;
  else if (sectorCount === 2) sectorScore = 55;
  else if (sectorCount === 3) sectorScore = 75;
  else if (sectorCount >= 4) sectorScore = 95;

  if (maxSectorWeight > 50) {
    sectorScore -= (maxSectorWeight - 50) * 1.2;
  }

  // 3. Position Count Score (30% weight): Best if 5-15 positions
  let positionScore = 100;
  if (positionCount === 1) positionScore = 20;
  else if (positionCount === 2) positionScore = 40;
  else if (positionCount === 3) positionScore = 60;
  else if (positionCount === 4) positionScore = 78;
  else if (positionCount >= 5 && positionCount <= 20) positionScore = 98;
  else if (positionCount > 20) positionScore = 85; // Too many micro positions

  const rawScore = Math.round((concentrationScore * 0.4) + (sectorScore * 0.35) + (positionScore * 0.25));
  const score = Math.min(100, Math.max(10, rawScore));

  let grade: "A+" | "A" | "B" | "C" | "D" = "C";
  let status: DiversificationHealth["status"] = "Moderate Concentration";
  let statusTh: DiversificationHealth["statusTh"] = "มีความกระจุกตัวปานกลาง";
  let colorClass = "text-amber-500";

  if (score >= 90) {
    grade = "A+";
    status = "Excellent Diversification";
    statusTh = "กระจายความเสี่ยงยอดเยี่ยม";
    colorClass = "text-profit";
  } else if (score >= 80) {
    grade = "A";
    status = "Good Diversification";
    statusTh = "กระจายความเสี่ยงได้ดี";
    colorClass = "text-emerald-400";
  } else if (score >= 65) {
    grade = "B";
    status = "Moderate Concentration";
    statusTh = "มีความกระจุกตัวปานกลาง";
    colorClass = "text-amber-500";
  } else if (score >= 50) {
    grade = "C";
    status = "High Concentration Risk";
    statusTh = "มีความเสี่ยงจากการกระจุกตัวสูง";
    colorClass = "text-orange-500";
  } else {
    grade = "D";
    status = "High Concentration Risk";
    statusTh = "พอร์ตกระจุกตัวสูงมาก";
    colorClass = "text-loss";
  }

  return {
    score,
    grade,
    status,
    statusTh,
    colorClass,
    topHoldingWeight,
    top3HoldingsWeight,
    maxSectorWeight,
    sectorCount,
    positionCount,
    hhiIndex: Math.round(hhiIndex),
  };
}

export function generateDiversificationInsights(
  holdings: RealTimeHolding[],
  health: DiversificationHealth,
  sectors: SectorItem[],
  concentrations: HoldingConcentrationItem[]
): DiversificationInsight[] {
  const insights: DiversificationInsight[] = [];

  // 1. Single Stock Concentration Warning
  const overweightHoldings = concentrations.filter((c) => c.percentage > 25);
  if (overweightHoldings.length > 0) {
    const topStock = overweightHoldings[0];
    insights.push({
      id: "overweight-stock",
      type: "WARNING",
      title: `Single-Stock Risk: ${topStock.symbol} (${topStock.percentage.toFixed(1)}%)`,
      titleTh: `ความเสี่ยงหุ้นรายตัว: ${topStock.symbol} กินสัดส่วน ${topStock.percentage.toFixed(1)}%`,
      description: `${topStock.symbol} represents a high portion of your portfolio. A pullback in this single asset could significantly impact your total returns. Consider capping individual weights below 15-20%.`,
      descriptionTh: `${topStock.symbol} มีสัดส่วนมากกว่า 25% ของพอร์ต หากหุ้นตัวนี้มีความผันผวนจะกระทบพอร์ตโดยตรง แนะนำพิจารณา Rebalance หรือจำกัดน้ำหนักไม่เกิน 15-20% ต่อตัว`,
      impact: "High Impact",
    });
  }

  // 2. Sector Dominance Warning
  if (sectors.length > 0 && sectors[0].percentage > 45) {
    const topSector = sectors[0];
    insights.push({
      id: "sector-concentration",
      type: "WARNING",
      title: `Heavy Sector Bias: ${topSector.name} (${topSector.percentage.toFixed(1)}%)`,
      titleTh: `สัดส่วนอุตสาหกรรมกระจุกตัว: ${topSector.name} (${topSector.percentage.toFixed(1)}%)`,
      description: `Your portfolio is heavily weighted towards ${topSector.name}. Macroeconomic or regulatory shifts in this sector could trigger elevated volatility across multiple holdings.`,
      descriptionTh: `พอร์ตมีการลงทุนในกลุ่ม ${topSector.name} สูงถึง ${topSector.percentage.toFixed(1)}% ควรพิจารณากระจายไปยังกลุ่ม Defensive เช่น Healthcare หรือ Consumer เพื่อสร้างสมดุล`,
      impact: "Moderate Impact",
    });
  }

  // 3. Sector Breadth Strength or Opportunity
  if (sectors.length >= 4) {
    insights.push({
      id: "good-breadth",
      type: "STRENGTH",
      title: `Strong Sector Breadth (${sectors.length} Sectors)`,
      titleTh: `กระจายกลุ่มอุตสาหกรรมได้ดี (${sectors.length} กลุ่ม)`,
      description: `Your investments span across ${sectors.length} distinct sectors (${sectors.map((s) => s.name).slice(0, 3).join(", ")}...), providing a healthy defense against sector-specific downturns.`,
      descriptionTh: `พอร์ตครอบคลุม ${sectors.length} อุตสาหกรรมหลัก ช่วยลดความเสี่ยงเฉพาะกลุ่มอุตสาหกรรมได้อย่างมีประสิทธิภาพ`,
      impact: "Positive Anchor",
    });
  } else if (sectors.length <= 2 && holdings.length >= 2) {
    insights.push({
      id: "low-breadth",
      type: "TIP",
      title: "Explore Uncorrelated Sectors",
      titleTh: "เพิ่มการกระจายไปยังกลุ่มอุตสาหกรรมอื่น",
      description: `You are only exposed to ${sectors.length} sector(s). Adding defensive assets (like Healthcare or Consumer Staples) or broad-market ETFs can improve risk-adjusted Sharpe ratio.`,
      descriptionTh: `ปัจจุบันพอร์ตมีเพียง ${sectors.length} กลุ่มอุตสาหกรรม แนะนำศึกษาการเพิ่มกลุ่มสินทรัพย์ที่มีความสัมพันธ์ต่ำ (Low Correlation) หรือดัชนีภาพรวม`,
      impact: "Rebalancing Idea",
    });
  }

  // 4. Dividend / Income Balance
  const dividendHoldings = holdings.filter((h) => h.hasDividend || h.symbol === "QQQI");
  const totalVal = holdings.reduce((sum, h) => sum + (h.realTimeValue ?? (h.shares * (h.currentPrice || h.avgCost))), 0);
  const dividendVal = dividendHoldings.reduce((sum, h) => sum + (h.realTimeValue ?? (h.shares * (h.currentPrice || h.avgCost))), 0);
  const dividendPct = totalVal > 0 ? (dividendVal / totalVal) * 100 : 0;

  if (dividendPct >= 15 && dividendPct <= 60) {
    insights.push({
      id: "healthy-income-mix",
      type: "STRENGTH",
      title: `Balanced Growth & Cash Flow (${dividendPct.toFixed(0)}% Dividend Yielding)`,
      titleTh: `สมดุลระหว่างหุ้นเติบโตและกระแสเงินสด (${dividendPct.toFixed(0)}% สินทรัพย์ปันผล)`,
      description: `You have ${dividendPct.toFixed(0)}% allocated to dividend-paying assets, generating steady cash flow while retaining capital growth potential.`,
      descriptionTh: `มีสัดส่วนสินทรัพย์จ่ายปันผล ${dividendPct.toFixed(0)}% สร้างกระแสเงินสดต่อเนื่องพร้อมกับโอกาสเติบโตของเงินต้น`,
      impact: "Healthy Mix",
    });
  }

  return insights;
}
