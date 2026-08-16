import { RealTimeHolding } from "@/hooks/usePortfolioQuotes";

// ============================================================
// 1. SMART DEPOSIT REBALANCER ENGINE
// ============================================================

export interface RebalanceRecommendation {
  symbol: string;
  name: string;
  currentValue: number;
  currentShares: number;
  currentPrice: number;
  currentWeight: number; // %
  targetWeight: number;  // %
  recommendedBuyAmount: number; // in USD
  recommendedShares: number;
  newTotalValue: number;
  newWeight: number;    // %
  status: "UNDERWEIGHT" | "BALANCED" | "OVERWEIGHT";
}

export interface RebalancePlan {
  depositAmount: number;
  currentPortfolioValue: number;
  newPortfolioValue: number;
  recommendations: RebalanceRecommendation[];
  estimatedHealthScoreBefore: number;
  estimatedHealthScoreAfter: number;
  summaryNote: string;
  summaryNoteTh: string;
}

export function calculateDepositRebalancing(
  holdings: RealTimeHolding[],
  depositAmountUSD: number
): RebalancePlan {
  const currentTotalValue = holdings.reduce(
    (sum, h) => sum + (h.shares * (h.currentPrice || h.avgCost || 0)),
    0
  );

  const newTotalValue = currentTotalValue + depositAmountUSD;
  const n = holdings.length;

  if (n === 0) {
    return {
      depositAmount: depositAmountUSD,
      currentPortfolioValue: 0,
      newPortfolioValue: depositAmountUSD,
      recommendations: [],
      estimatedHealthScoreBefore: 0,
      estimatedHealthScoreAfter: 0,
      summaryNote: "No holdings in portfolio.",
      summaryNoteTh: "ยังไม่มีข้อมูลสินทรัพย์ในพอร์ต",
    };
  }

  // Target equal weight (or balanced weight per asset)
  const targetWeightPerAsset = 100 / n;
  const targetValuePerAsset = (newTotalValue * targetWeightPerAsset) / 100;

  // Calculate deficits (how much each asset needs to reach target value)
  const deficits: { holding: RealTimeHolding; currentVal: number; deficit: number }[] = [];
  let totalDeficit = 0;

  for (const h of holdings) {
    const val = h.shares * (h.currentPrice || h.avgCost || 0);
    const deficit = Math.max(0, targetValuePerAsset - val);
    deficits.push({ holding: h, currentVal: val, deficit });
    totalDeficit += deficit;
  }

  // Allocate deposit proportional to deficit
  const recommendations: RebalanceRecommendation[] = [];

  for (const item of deficits) {
    const h = item.holding;
    const price = h.currentPrice || h.avgCost || 1;
    const currentWeight = currentTotalValue > 0 ? (item.currentVal / currentTotalValue) * 100 : 0;

    let buyAmount = 0;
    if (totalDeficit > 0) {
      buyAmount = (item.deficit / totalDeficit) * depositAmountUSD;
    } else {
      // If already balanced, split equally
      buyAmount = depositAmountUSD / n;
    }

    const recommendedShares = price > 0 ? Math.round((buyAmount / price) * 100) / 100 : 0;
    const actualBuyVal = recommendedShares * price;
    const newTotalItemVal = item.currentVal + actualBuyVal;
    const newWeight = newTotalValue > 0 ? (newTotalItemVal / newTotalValue) * 100 : 0;

    let status: "UNDERWEIGHT" | "BALANCED" | "OVERWEIGHT" = "BALANCED";
    if (currentWeight < targetWeightPerAsset - 4) status = "UNDERWEIGHT";
    else if (currentWeight > targetWeightPerAsset + 4) status = "OVERWEIGHT";

    recommendations.push({
      symbol: h.symbol,
      name: h.name || h.symbol,
      currentValue: item.currentVal,
      currentShares: h.shares,
      currentPrice: price,
      currentWeight,
      targetWeight: targetWeightPerAsset,
      recommendedBuyAmount: Math.round(buyAmount * 100) / 100,
      recommendedShares,
      newTotalValue: Math.round(newTotalItemVal * 100) / 100,
      newWeight,
      status,
    });
  }

  // Sort recommendations by highest recommended buy amount
  recommendations.sort((a, b) => b.recommendedBuyAmount - a.recommendedBuyAmount);

  const topBuy = recommendations[0];
  const summaryNote = `Prioritize buying ${topBuy?.symbol || "assets"} to optimize portfolio balance and lower concentration risk.`;
  const summaryNoteTh = `แนะนำเน้นซื้อ ${topBuy?.symbol || "สินทรัพย์ที่สัดส่วนน้อย"} เป็นหลัก เพื่อลดความเสี่ยงจากการกระจุกตัวและปรับสมดุลพอร์ตให้อัตโนมัติ`;

  return {
    depositAmount: depositAmountUSD,
    currentPortfolioValue: currentTotalValue,
    newPortfolioValue: newTotalValue,
    recommendations,
    estimatedHealthScoreBefore: Math.min(95, Math.round(65 + Math.min(30, n * 5))),
    estimatedHealthScoreAfter: Math.min(98, Math.round(75 + Math.min(23, n * 5))),
    summaryNote,
    summaryNoteTh,
  };
}

// ============================================================
// 2. MONTE CARLO PROBABILISTIC FORECAST ENGINE
// ============================================================

export interface MonteCarloYearPoint {
  year: number;
  label: string; // "Year 1", "Year 5", etc.
  totalInvested: number; // Cost basis
  percentile10: number;  // Conservative / Bear (10th percentile)
  percentile50: number;  // Expected / Median (50th percentile)
  percentile90: number;  // Bull / Best Case (90th percentile)
}

export interface MonteCarloResult {
  years: number;
  initialValue: number;
  monthlyDeposit: number;
  totalInvestedEnd: number;
  expectedValueEnd: number;
  bullValueEnd: number;
  bearValueEnd: number;
  points: MonteCarloYearPoint[];
  expectedTotalReturnPercent: number;
}

export function runMonteCarloSimulation(
  initialValue: number,
  monthlyDeposit: number,
  years: number = 10,
  dividendYield: number = 2.5,
  dripEnabled: boolean = true
): MonteCarloResult {
  const effectiveReturnMean = 0.10 + (dripEnabled ? dividendYield / 100 : 0); // 10% base market return + DRIP
  const volatility = 0.165; // 16.5% market standard deviation
  const numSimulations = 500;

  const annualTimelines: number[][] = []; // [simIndex][yearIndex]

  for (let s = 0; s < numSimulations; s++) {
    const yearlyValues: number[] = [initialValue];
    let runningVal = initialValue;

    for (let y = 1; y <= years; y++) {
      for (let m = 1; m <= 12; m++) {
        // Box-Muller normal distribution random factor
        const u1 = Math.random() || 0.0001;
        const u2 = Math.random() || 0.0001;
        const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

        const monthlyMean = effectiveReturnMean / 12;
        const monthlyVol = volatility / Math.sqrt(12);
        const monthlyReturn = monthlyMean + (monthlyVol * z);

        runningVal = (runningVal + monthlyDeposit) * (1 + monthlyReturn);
        if (runningVal < 0) runningVal = 0;
      }
      yearlyValues.push(runningVal);
    }
    annualTimelines.push(yearlyValues);
  }

  // Calculate percentiles per year
  const points: MonteCarloYearPoint[] = [];

  for (let y = 0; y <= years; y++) {
    const yearValues = annualTimelines.map((sim) => sim[y]).sort((a, b) => a - b);
    const p10Index = Math.floor(numSimulations * 0.10);
    const p50Index = Math.floor(numSimulations * 0.50);
    const p90Index = Math.floor(numSimulations * 0.90);

    const totalInvested = initialValue + (monthlyDeposit * 12 * y);

    points.push({
      year: y,
      label: y === 0 ? "Today" : `Year ${y}`,
      totalInvested: Math.round(totalInvested),
      percentile10: Math.round(yearValues[p10Index] || totalInvested * 0.8),
      percentile50: Math.round(yearValues[p50Index] || totalInvested * 1.5),
      percentile90: Math.round(yearValues[p90Index] || totalInvested * 2.8),
    });
  }

  const lastPoint = points[points.length - 1];
  const expectedReturnPct = lastPoint.totalInvested > 0
    ? ((lastPoint.percentile50 - lastPoint.totalInvested) / lastPoint.totalInvested) * 100
    : 0;

  return {
    years,
    initialValue,
    monthlyDeposit,
    totalInvestedEnd: lastPoint.totalInvested,
    expectedValueEnd: lastPoint.percentile50,
    bullValueEnd: lastPoint.percentile90,
    bearValueEnd: lastPoint.percentile10,
    points,
    expectedTotalReturnPercent: expectedReturnPct,
  };
}

// ============================================================
// 3. RISK STRESS TEST ENGINE (HISTORICAL CRISIS SIMULATOR)
// ============================================================

export interface CrisisScenario {
  id: string;
  name: string;
  nameTh: string;
  year: string;
  description: string;
  descriptionTh: string;
  benchmarkDrop: number; // e.g. -50%
  sectorImpacts: Record<string, number>; // Sector -> % drop
}

export const CRISIS_SCENARIOS: CrisisScenario[] = [
  {
    id: "gfc_2008",
    name: "2008 Global Financial Crisis",
    nameTh: "วิกฤตแฮมเบอร์เกอร์ 2008",
    year: "2008 - 2009",
    description: "Subprime mortgage collapse triggered a worldwide banking liquidity crisis.",
    descriptionTh: "วิกฤตซับไพรม์และสภาพคล่องสถาบันการเงินทั่วโลก หุ้นร่วงหนักเป็นประวัติการณ์",
    benchmarkDrop: -50.2,
    sectorImpacts: {
      "Technology": -46.0,
      "Semiconductors": -52.0,
      "Financials / Banking": -78.0,
      "Energy & Utilities": -38.0,
      "Healthcare": -28.0,
      "Consumer Staples": -22.0,
      "Consumer Discretionary": -42.0,
      "Thai SET Equities": -48.0,
      "ETF / Dividend": -32.0,
      "Aerospace & Defense": -35.0,
      "Crypto & Web3": -85.0,
      "Other": -40.0,
    },
  },
  {
    id: "covid_2020",
    name: "2020 COVID-19 Flash Crash",
    nameTh: "วิกฤตโรคระบาดโควิด 2020",
    year: "Feb - Mar 2020",
    description: "Fastest 30% drop in stock market history due to global lockdowns.",
    descriptionTh: "การล็อกดาวน์ทั่วโลกทำให้ตลาดหุ้นร่วงเร็วที่สุดในประวัติศาสตร์ 34% ใน 1 เดือน",
    benchmarkDrop: -34.0,
    sectorImpacts: {
      "Technology": -22.0,
      "Semiconductors": -28.0,
      "Energy & Utilities": -55.0,
      "Consumer Discretionary": -38.0,
      "Healthcare": -14.0,
      "Consumer Staples": -12.0,
      "Thai SET Equities": -36.0,
      "ETF / Dividend": -25.0,
      "Aerospace & Defense": -48.0,
      "Crypto & Web3": -45.0,
      "Other": -30.0,
    },
  },
  {
    id: "fed_2022",
    name: "2022 Fed Rate Hike & Tech Pullback",
    nameTh: "วิกฤตเงินเฟ้อและขึ้นดอกเบี้ย 2022",
    year: "2022",
    description: "Aggressive Fed rate hikes to combat 40-year high inflation compressed tech valuations.",
    descriptionTh: "เฟดขึ้นดอกเบี้ยนโยบายอย่างรวดเร็วเพื่อสู้เงินเฟ้อ ส่งผลให้หุ้นเทคโนโลยีและสินทรัพย์เสี่ยงปรับฐานหนัก",
    benchmarkDrop: -19.4,
    sectorImpacts: {
      "Technology": -33.0,
      "Semiconductors": -37.0,
      "Energy & Utilities": +45.0, // Energy gained in 2022!
      "Healthcare": -4.0,
      "Consumer Staples": -2.0,
      "Thai SET Equities": -5.0,
      "ETF / Dividend": -8.0,
      "Aerospace & Defense": +12.0,
      "Crypto & Web3": -65.0,
      "Other": -18.0,
    },
  },
  {
    id: "dotcom_2000",
    name: "2000 Dot-com Bubble Burst",
    nameTh: "วิกฤตฟองสบู่ดอทคอม 2000",
    year: "2000 - 2002",
    description: "Speculative tech bubble burst with NASDAQ losing ~78% while value/defensives held.",
    descriptionTh: "ฟองสบู่หุ้นอินเทอร์เน็ตแตก ดัชนี NASDAQ ร่วงกว่า 78% ในขณะที่หุ้นมูลค่าและสินค้าจำเป็นยังคงทนทาน",
    benchmarkDrop: -44.0,
    sectorImpacts: {
      "Technology": -75.0,
      "Semiconductors": -80.0,
      "Consumer Staples": +14.0,
      "Healthcare": +10.0,
      "Energy & Utilities": +22.0,
      "Thai SET Equities": -35.0,
      "ETF / Dividend": +5.0,
      "Aerospace & Defense": +8.0,
      "Crypto & Web3": -90.0,
      "Other": -40.0,
    },
  },
  {
    id: "stagflation",
    name: "Severe Stagflation Shock",
    nameTh: "วิกฤตเศรษฐกิจถดถอยและของแพง (Stagflation)",
    year: "Hypothetical",
    description: "High inflation combined with stagnant economic growth and low consumer confidence.",
    descriptionTh: "เงินเฟ้อสูงต่อเนื่องพร้อมกับเศรษฐกิจชะลอตัวและกำลังซื้อถดถอย",
    benchmarkDrop: -25.0,
    sectorImpacts: {
      "Technology": -28.0,
      "Semiconductors": -30.0,
      "Energy & Utilities": +20.0,
      "Consumer Staples": -6.0,
      "Healthcare": -8.0,
      "Thai SET Equities": -18.0,
      "ETF / Dividend": -10.0,
      "Aerospace & Defense": -5.0,
      "Crypto & Web3": -40.0,
      "Other": -22.0,
    },
  },
];

export interface StressTestAssetResult {
  symbol: string;
  name: string;
  sector: string;
  currentValue: number;
  estimatedLoss: number;
  estimatedLossPercent: number;
  projectedValue: number;
}

export interface StressTestResult {
  scenario: CrisisScenario;
  portfolioInitialValue: number;
  portfolioLossAmount: number;
  portfolioLossPercent: number;
  portfolioProjectedValue: number;
  assetResults: StressTestAssetResult[];
  aiDoctorAdvice: string;
  aiDoctorAdviceTh: string;
  resilienceRating: "VERY RESILIENT" | "MODERATE" | "HIGH VULNERABILITY";
}

export function runPortfolioStressTest(
  holdings: RealTimeHolding[],
  scenarioId: string = "gfc_2008"
): StressTestResult {
  const scenario = CRISIS_SCENARIOS.find((s) => s.id === scenarioId) || CRISIS_SCENARIOS[0];
  const initialTotalVal = holdings.reduce(
    (sum, h) => sum + (h.shares * (h.currentPrice || h.avgCost || 0)),
    0
  );

  let totalLoss = 0;
  const assetResults: StressTestAssetResult[] = [];

  for (const h of holdings) {
    const val = h.shares * (h.currentPrice || h.avgCost || 0);
    const sector = h.sector || "Technology";
    const dropPercent = scenario.sectorImpacts[sector] ?? scenario.sectorImpacts["Other"] ?? scenario.benchmarkDrop;

    const changeAmount = (val * dropPercent) / 100;
    const projectedVal = Math.max(0, val + changeAmount);
    const lossAmount = val - projectedVal; // positive number representing loss

    totalLoss += lossAmount;

    assetResults.push({
      symbol: h.symbol,
      name: h.name || h.symbol,
      sector,
      currentValue: val,
      estimatedLoss: lossAmount,
      estimatedLossPercent: dropPercent,
      projectedValue: projectedVal,
    });
  }

  const overallLossPercent = initialTotalVal > 0 ? (totalLoss / initialTotalVal) * 100 : 0;
  const projectedPortfolioVal = Math.max(0, initialTotalVal - totalLoss);

  let resilienceRating: "VERY RESILIENT" | "MODERATE" | "HIGH VULNERABILITY" = "MODERATE";
  let aiDoctorAdvice = "";
  let aiDoctorAdviceTh = "";

  if (overallLossPercent < Math.abs(scenario.benchmarkDrop) - 6) {
    resilienceRating = "VERY RESILIENT";
    aiDoctorAdvice = `Your portfolio outperforms the benchmark by ${(Math.abs(scenario.benchmarkDrop) - overallLossPercent).toFixed(1)}% due to healthy diversification and defensive assets.`;
    aiDoctorAdviceTh = `พอร์ตโฟลิโอของคุณทนทานต่อวิกฤตนี้ได้ดีกว่าตลาดทั่วไป ${(Math.abs(scenario.benchmarkDrop) - overallLossPercent).toFixed(1)}% เนื่องจากมีสินทรัพย์ป้องกันความเสี่ยง`;
  } else if (overallLossPercent > Math.abs(scenario.benchmarkDrop) + 6) {
    resilienceRating = "HIGH VULNERABILITY";
    aiDoctorAdvice = `High concentration in high-beta assets causes an outsized loss. Consider adding defensive dividend aristocrats (e.g. Healthcare, Staples, Utilities).`;
    aiDoctorAdviceTh = `พอร์ตมีความเสี่ยงสูงเนื่องจากมีสัดส่วนหุ้นผันผวนสูง (High Beta) แนะนำเพิ่มหุ้นกลุ่ม Defensive หรือปันผล เช่น เฮลท์แคร์ และสินค้าจำเป็น`;
  } else {
    resilienceRating = "MODERATE";
    aiDoctorAdvice = `Your portfolio moves in tandem with the broader market. DCA (Dollar Cost Averaging) during such drawdowns creates significant recovery gains.`;
    aiDoctorAdviceTh = `พอร์ตมีความผันผวนใกล้เคียงกับตลาด การทยอยสะสม (DCA) ในช่วงวิกฤตจะช่วยสร้างผลตอบแทนฟื้นตัวอย่างก้าวกระโดด`;
  }

  return {
    scenario,
    portfolioInitialValue: initialTotalVal,
    portfolioLossAmount: totalLoss,
    portfolioLossPercent: overallLossPercent,
    portfolioProjectedValue: projectedPortfolioVal,
    assetResults: assetResults.sort((a, b) => b.estimatedLoss - a.estimatedLoss),
    aiDoctorAdvice,
    aiDoctorAdviceTh,
    resilienceRating,
  };
}
