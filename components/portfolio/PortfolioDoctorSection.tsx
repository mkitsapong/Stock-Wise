"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { usePortfolioQuotes } from "@/hooks/usePortfolioQuotes";
import { useCurrency } from "@/context/CurrencyContext";
import {
  calculateDepositRebalancing,
  runMonteCarloSimulation,
  runPortfolioStressTest,
  CRISIS_SCENARIOS,
} from "@/lib/portfolio-doctor";
import { formatPercent, cn } from "@/lib/utils";
import CompanyLogo from "@/components/common/CompanyLogo";

type DoctorSubTab = "REBALANCER" | "MONTE_CARLO" | "STRESS_TEST";

export default function PortfolioDoctorSection() {
  const { holdings, portfolioStats, isLoading } = usePortfolioQuotes();
  const { formatCurrency, formatSignedCurrency, currency, exchangeRate, currencySymbol } = useCurrency();

  const [activeTab, setActiveTab] = useState<DoctorSubTab>("REBALANCER");

  // 1. Rebalancer State
  const [rawDepositInput, setRawDepositInput] = useState<string>("1000");
  const depositAmountUSD = useMemo(() => {
    const val = parseFloat(rawDepositInput) || 0;
    return currency === "THB" ? val / (exchangeRate || 34) : val;
  }, [rawDepositInput, currency, exchangeRate]);

  const rebalancePlan = useMemo(
    () => calculateDepositRebalancing(holdings, depositAmountUSD),
    [holdings, depositAmountUSD]
  );

  // 2. Monte Carlo State
  const [monteCarloYears, setMonteCarloYears] = useState<number>(10);
  const [rawMonthlyDeposit, setRawMonthlyDeposit] = useState<string>("500");
  const [dripEnabled, setDripEnabled] = useState<boolean>(true);

  const monthlyDepositUSD = useMemo(() => {
    const val = parseFloat(rawMonthlyDeposit) || 0;
    return currency === "THB" ? val / (exchangeRate || 34) : val;
  }, [rawMonthlyDeposit, currency, exchangeRate]);

  const monteCarloResult = useMemo(
    () =>
      runMonteCarloSimulation(
        portfolioStats.totalValue,
        monthlyDepositUSD,
        monteCarloYears,
        3.2,
        dripEnabled
      ),
    [portfolioStats.totalValue, monthlyDepositUSD, monteCarloYears, dripEnabled]
  );

  // 3. Stress Test State
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("gfc_2008");
  const stressTestResult = useMemo(
    () => runPortfolioStressTest(holdings, selectedScenarioId),
    [holdings, selectedScenarioId]
  );

  if (holdings.length === 0 && !isLoading) {
    return (
      <div className="glass-card p-8 rounded-3xl text-center animate-fade-in-up">
        <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent mx-auto flex items-center justify-center mb-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-foreground mb-1">ยังไม่มีข้อมูลสินทรัพย์สำหรับจำลองและวิเคราะห์</h3>
        <p className="text-xs text-muted max-w-sm mx-auto">
          เพิ่มรายการซื้อขายหุ้นในแท็บ Transactions เพื่อเริ่มระบบ AI Portfolio Doctor และแบบจำลองความเสี่ยง
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      
      {/* 🌟 1. AI Doctor Header Banner & Navigation */}
      <div className="glass-card p-6 sm:p-7 rounded-3xl border border-border/80 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-1/4 w-80 h-36 bg-accent/15 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-32 bg-purple-500/10 rounded-full blur-[50px] pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-accent/20 to-purple-500/20 border border-accent/30 text-accent font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                AI Doctor & Rebalance Engine
              </span>
              <span className="text-xs text-muted font-medium">Smart Financial Modeling</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
              <span>AI Portfolio Doctor & Simulator</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted font-medium mt-1">
              ระบบจำลองการเติมเงินปรับสมดุลพอร์ต พยากรณ์ความน่าจะเป็น 30 ปี และทดสอบวิกฤตเศรษฐกิจ
            </p>
          </div>

          {/* Sub-Tab Switcher */}
          <div className="flex items-center bg-card-bg/90 backdrop-blur-2xl p-1 rounded-2xl border border-border/80 shadow-md overflow-x-auto scrollbar-none self-start lg:self-center">
            <button
              onClick={() => setActiveTab("REBALANCER")}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer",
                activeTab === "REBALANCER"
                  ? "bg-accent text-white font-bold shadow-md shadow-accent/25 scale-[1.01]"
                  : "text-muted hover:text-foreground hover:bg-white/5"
              )}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <span>Deposit Rebalancer</span>
            </button>

            <button
              onClick={() => setActiveTab("MONTE_CARLO")}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer",
                activeTab === "MONTE_CARLO"
                  ? "bg-accent text-white font-bold shadow-md shadow-accent/25 scale-[1.01]"
                  : "text-muted hover:text-foreground hover:bg-white/5"
              )}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
              </svg>
              <span>Monte Carlo (5-30Y)</span>
            </button>

            <button
              onClick={() => setActiveTab("STRESS_TEST")}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer",
                activeTab === "STRESS_TEST"
                  ? "bg-accent text-white font-bold shadow-md shadow-accent/25 scale-[1.01]"
                  : "text-muted hover:text-foreground hover:bg-white/5"
              )}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span>Risk Stress Test</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: SMART DEPOSIT REBALANCER */}
      {/* ============================================================ */}
      {activeTab === "REBALANCER" && (
        <div className="space-y-6">
          {/* Controls Card */}
          <div className="glass-card p-5 sm:p-7 rounded-3xl border border-border/80 shadow-lg space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Smart Deposit Allocation Calculator
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  ระบุจำนวนเงินที่จะเติมเข้าพอร์ต ระบบ AI จะคำนวณสัดส่วนการซื้อหุ้นที่เหมาะสมที่สุดเพื่อปรับสมดุลโดยไม่ต้องขายหุ้นเดิม
                </p>
              </div>

              {/* Deposit Input & Preset Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-muted text-sm">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    value={rawDepositInput}
                    onChange={(e) => setRawDepositInput(e.target.value)}
                    placeholder="1000"
                    className="pl-8 pr-4 py-2 bg-card-bg border border-border/80 rounded-xl text-sm font-mono font-bold text-foreground focus:outline-none focus:border-accent w-full sm:w-44"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                  {(currency === "THB" ? ["10000", "30000", "50000", "100000"] : ["500", "1000", "2500", "5000"]).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRawDepositInput(preset)}
                      className={cn(
                        "px-2.5 py-1.5 text-xs font-mono font-semibold rounded-lg border transition-all cursor-pointer",
                        rawDepositInput === preset
                          ? "bg-accent text-white border-accent shadow-sm"
                          : "bg-muted-bg/60 border-border/60 text-muted hover:text-foreground"
                      )}
                    >
                      {currencySymbol}{parseInt(preset).toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Diagnosis Summary Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-accent/10 via-purple-500/5 to-transparent border border-accent/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-accent/20 text-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                  💡
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">AI Rebalancing Diagnosis</h4>
                  <p className="text-xs text-muted mt-0.5 leading-relaxed">
                    {rebalancePlan.summaryNoteTh}
                  </p>
                </div>
              </div>

              {/* Health Score Evolution */}
              <div className="flex items-center gap-3 bg-card-bg/90 border border-border/60 px-4 py-2 rounded-xl text-xs font-mono flex-shrink-0">
                <span className="text-muted font-sans">Health Score:</span>
                <span className="font-bold text-muted line-through">{rebalancePlan.estimatedHealthScoreBefore}</span>
                <span className="text-muted">→</span>
                <span className="font-extrabold text-profit text-sm">
                  {rebalancePlan.estimatedHealthScoreAfter} / 100 🟢
                </span>
              </div>
            </div>
          </div>

          {/* Actionable Allocation Plan Cards */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-foreground">
              Recommended Buy Action Plan (แผนการกระจายซื้อ {formatCurrency(depositAmountUSD)})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rebalancePlan.recommendations.map((item) => {
                const isUnder = item.status === "UNDERWEIGHT";
                const isOver = item.status === "OVERWEIGHT";

                return (
                  <div
                    key={item.symbol}
                    className="p-5 rounded-2xl bg-card-bg/60 border border-border/60 hover:border-border transition-all shadow-sm space-y-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CompanyLogo symbol={item.symbol} name={item.name} size="md" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-foreground text-sm sm:text-base">
                              {item.symbol}
                            </span>
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase",
                                isUnder
                                  ? "bg-profit/10 text-profit border border-profit/20"
                                  : isOver
                                  ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                  : "bg-muted-bg text-muted"
                              )}
                            >
                              {isUnder ? "Underweight (เน้นซื้อ)" : isOver ? "Overweight (ลดสัดส่วน)" : "Balanced"}
                            </span>
                          </div>
                          <span className="text-xs text-muted truncate max-w-[170px] block">
                            {item.name} · {item.currentShares} หุ้น ({formatCurrency(item.currentValue)})
                          </span>
                        </div>
                      </div>

                      {/* Recommended Buy Amount Badge */}
                      <div className="text-right">
                        <span className="text-[10px] text-muted uppercase font-bold block">Recommend Buy</span>
                        <span className="text-sm font-mono font-extrabold text-profit tabular-nums">
                          +{formatCurrency(item.recommendedBuyAmount)}
                        </span>
                        <span className="text-[11px] font-mono text-muted block">
                          ~{item.recommendedShares} หุ้น
                        </span>
                      </div>
                    </div>

                    {/* Weight Evolution Progress Bars */}
                    <div className="space-y-1.5 pt-1 border-t border-border/40 text-xs font-mono">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted font-sans">Weight Evolution:</span>
                        <span className="text-foreground font-bold">
                          {item.currentWeight.toFixed(1)}% → <strong className="text-accent">{item.newWeight.toFixed(1)}%</strong>
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-border/40 overflow-hidden flex">
                        <div
                          className="h-full bg-accent transition-all duration-500"
                          style={{ width: `${Math.min(100, item.newWeight)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: MONTE CARLO PROBABILISTIC SIMULATOR */}
      {/* ============================================================ */}
      {activeTab === "MONTE_CARLO" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="glass-card p-5 sm:p-7 rounded-3xl border border-border/80 shadow-lg space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Monte Carlo Wealth Horizon Forecast
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  แบบจำลองความน่าจะเป็น 500 เส้นทาง พยากรณ์มูลค่าพอร์ตในอนาคตตามความผันผวนและเงินเติมรายเดือน
                </p>
              </div>

              {/* Parameter Selectors */}
              <div className="flex flex-wrap items-center gap-4">
                {/* Years Selector */}
                <div className="flex items-center gap-1 bg-muted-bg/80 p-1 rounded-xl border border-border/60">
                  {[5, 10, 15, 20, 30].map((yr) => (
                    <button
                      key={yr}
                      onClick={() => setMonteCarloYears(yr)}
                      className={cn(
                        "px-2.5 py-1 text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer",
                        monteCarloYears === yr
                          ? "bg-card-bg text-accent font-bold shadow-md border border-border/50"
                          : "text-muted hover:text-foreground"
                      )}
                    >
                      {yr}Y
                    </button>
                  ))}
                </div>

                {/* Monthly Deposit Input */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted font-medium font-sans">Monthly DCA:</span>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-muted text-xs">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      value={rawMonthlyDeposit}
                      onChange={(e) => setRawMonthlyDeposit(e.target.value)}
                      placeholder="500"
                      className="pl-7 pr-3 py-1.5 bg-card-bg border border-border/80 rounded-xl text-xs font-mono font-bold text-foreground focus:outline-none focus:border-accent w-28"
                    />
                  </div>
                </div>

                {/* DRIP Toggle */}
                <button
                  type="button"
                  onClick={() => setDripEnabled((prev) => !prev)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer",
                    dripEnabled
                      ? "bg-profit/15 text-profit border-profit/30 font-bold"
                      : "bg-muted-bg/60 text-muted border-border/60"
                  )}
                >
                  <span>DRIP:</span>
                  <span>{dripEnabled ? "ON (ทบต้น)" : "OFF"}</span>
                </button>
              </div>
            </div>

            {/* 4 Outcome Forecast Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-card-bg/80 border border-border/60">
                <span className="text-[10px] uppercase font-bold text-muted block mb-1">
                  Total Invested (เงินต้น)
                </span>
                <span className="text-base sm:text-lg font-bold font-mono text-purple-400 tabular-nums block">
                  {formatCurrency(monteCarloResult.totalInvestedEnd)}
                </span>
                <span className="text-[10px] text-muted">เงินต้นสะสมใน {monteCarloYears} ปี</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-card-bg/80 border border-border/60">
                <span className="text-[10px] uppercase font-bold text-muted block mb-1">
                  Expected (50th %ile)
                </span>
                <span className="text-base sm:text-lg font-extrabold font-mono text-accent tabular-nums block">
                  {formatCurrency(monteCarloResult.expectedValueEnd)}
                </span>
                <span className="text-[10px] text-profit font-mono font-bold">
                  +{monteCarloResult.expectedTotalReturnPercent.toFixed(0)}% ROI
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-card-bg/80 border border-border/60">
                <span className="text-[10px] uppercase font-bold text-muted block mb-1">
                  Bull Case (90th %ile)
                </span>
                <span className="text-base sm:text-lg font-extrabold font-mono text-profit tabular-nums block">
                  {formatCurrency(monteCarloResult.bullValueEnd)}
                </span>
                <span className="text-[10px] text-profit font-mono font-bold">ตลาดกระทิง / เติบโตสูง</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-card-bg/80 border border-border/60">
                <span className="text-[10px] uppercase font-bold text-muted block mb-1">
                  Conservative (10th %ile)
                </span>
                <span className="text-base sm:text-lg font-extrabold font-mono text-amber-500 tabular-nums block">
                  {formatCurrency(monteCarloResult.bearValueEnd)}
                </span>
                <span className="text-[10px] text-muted font-mono">ตลาดชะลอตัว / อนุรักษ์นิยม</span>
              </div>
            </div>
          </div>

          {/* Monte Carlo Fan Chart */}
          <div className="glass-card p-5 sm:p-7 rounded-3xl border border-border/80 shadow-lg">
            <div className="h-[340px] sm:h-[380px] w-full -ml-3">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={monteCarloResult.points}
                  margin={{ top: 10, right: 10, bottom: 5, left: 10 }}
                >
                  <defs>
                    <linearGradient id="monteCarloBullGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3ea874" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#3ea874" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(148, 163, 184, 0.08)"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "rgba(148, 163, 184, 0.7)", fontSize: 11, fontFamily: "var(--font-jetbrains)" }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "rgba(148, 163, 184, 0.7)", fontSize: 11, fontFamily: "var(--font-jetbrains)" }}
                    tickFormatter={(val: number) => {
                      const rate = currency === "THB" ? exchangeRate : 1;
                      const display = val * rate;
                      if (display >= 1000000) return `${currencySymbol}${(display / 1000000).toFixed(1)}M`;
                      if (display >= 1000) return `${currencySymbol}${(display / 1000).toFixed(0)}k`;
                      return `${currencySymbol}${Math.round(display)}`;
                    }}
                    width={56}
                  />

                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const pt = payload[0].payload as (typeof monteCarloResult.points)[0];
                      return (
                        <div className="glass-card !rounded-2xl p-4 shadow-2xl border border-border/80 min-w-[220px] text-xs font-mono space-y-2">
                          <div className="pb-1.5 border-b border-border/40 font-sans font-bold text-foreground">
                            {pt.label} ({pt.year} Years Projected)
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-profit font-sans flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-profit" /> Bull (90th):
                              </span>
                              <span className="font-bold text-profit">{formatCurrency(pt.percentile90)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-accent font-sans flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-accent" /> Expected (50th):
                              </span>
                              <span className="font-bold text-accent">{formatCurrency(pt.percentile50)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-amber-500 font-sans flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-amber-500" /> Bear (10th):
                              </span>
                              <span className="font-bold text-amber-500">{formatCurrency(pt.percentile10)}</span>
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-border/40 text-purple-400">
                              <span className="font-sans">Total Invested:</span>
                              <span className="font-bold">{formatCurrency(pt.totalInvested)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />

                  {/* Bull Area */}
                  <Area
                    type="monotone"
                    dataKey="percentile90"
                    stroke="#3ea874"
                    strokeWidth={2}
                    fill="url(#monteCarloBullGradient)"
                  />

                  {/* Median Expected Line */}
                  <Line
                    type="monotone"
                    dataKey="percentile50"
                    stroke="#38bdf8"
                    strokeWidth={2.5}
                    dot={false}
                  />

                  {/* Bear Conservative Line */}
                  <Line
                    type="monotone"
                    dataKey="percentile10"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    dot={false}
                  />

                  {/* Invested Line */}
                  <Line
                    type="monotone"
                    dataKey="totalInvested"
                    stroke="#a855f7"
                    strokeWidth={1.8}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: RISK STRESS TEST ENGINE */}
      {/* ============================================================ */}
      {activeTab === "STRESS_TEST" && (
        <div className="space-y-6">
          {/* Crisis Scenario Selector Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {CRISIS_SCENARIOS.map((sc) => {
              const isSelected = selectedScenarioId === sc.id;
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => setSelectedScenarioId(sc.id)}
                  className={cn(
                    "p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden",
                    isSelected
                      ? "bg-card-bg border-loss/80 shadow-lg ring-1 ring-loss/30"
                      : "bg-card-bg/50 border-border/60 hover:border-border"
                  )}
                >
                  <span className="text-[10px] font-mono font-bold text-muted block mb-0.5">
                    {sc.year}
                  </span>
                  <h4 className="text-xs font-bold text-foreground truncate mb-1">
                    {sc.nameTh}
                  </h4>
                  <span className="text-xs font-mono font-bold text-loss">
                    Market {sc.benchmarkDrop}%
                  </span>
                </button>
              );
            })}
          </div>

          {/* Stress Test Hero Result Card */}
          <div className="glass-card p-6 sm:p-7 rounded-3xl border border-loss/30 bg-loss/5 relative overflow-hidden shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-loss/10 border border-loss/20 text-loss font-mono text-[10px] font-bold uppercase tracking-wider">
                    {stressTestResult.scenario.name}
                  </span>
                  <span className={cn(
                    "px-2 py-0.5 rounded-md text-[10px] font-mono font-extrabold uppercase border",
                    stressTestResult.resilienceRating === "VERY RESILIENT"
                      ? "bg-profit/10 text-profit border-profit/20"
                      : stressTestResult.resilienceRating === "MODERATE"
                      ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      : "bg-loss/10 text-loss border-loss/20"
                  )}>
                    {stressTestResult.resilienceRating}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-foreground">
                  Estimated Drawdown: <span className="text-loss">-{stressTestResult.portfolioLossPercent.toFixed(1)}%</span> ({formatSignedCurrency(-stressTestResult.portfolioLossAmount)})
                </h3>
                <p className="text-xs text-muted mt-1 leading-relaxed max-w-xl">
                  {stressTestResult.aiDoctorAdviceTh}
                </p>
              </div>

              {/* Before vs After Impact Pill */}
              <div className="flex items-center gap-4 bg-card-bg/90 border border-border/60 p-4 rounded-2xl shadow-sm text-xs font-mono">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted block">Current Value</span>
                  <span className="text-sm font-bold text-foreground tabular-nums">
                    {formatCurrency(stressTestResult.portfolioInitialValue)}
                  </span>
                </div>
                <span className="text-muted text-base">→</span>
                <div>
                  <span className="text-[10px] uppercase font-bold text-loss block">Stressed Value</span>
                  <span className="text-sm font-bold text-loss tabular-nums">
                    {formatCurrency(stressTestResult.portfolioProjectedValue)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Asset Damage Breakdown Cards */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-foreground">
              Asset-by-Asset Crisis Impact Breakdown (ความเสียหายรายสินทรัพย์)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stressTestResult.assetResults.map((asset) => (
                <div
                  key={asset.symbol}
                  className="p-4 rounded-2xl bg-card-bg/60 border border-border/60 hover:border-border transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <CompanyLogo symbol={asset.symbol} name={asset.name} size="sm" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-foreground text-sm">
                          {asset.symbol}
                        </span>
                        <span className="text-[10px] text-muted bg-muted-bg px-2 py-0.5 rounded-md">
                          {asset.sector}
                        </span>
                      </div>
                      <span className="text-xs text-muted">
                        Value: {formatCurrency(asset.currentValue)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={cn(
                      "text-sm font-mono font-extrabold block tabular-nums",
                      asset.estimatedLossPercent < 0 ? "text-loss" : "text-profit"
                    )}>
                      {asset.estimatedLossPercent >= 0 ? "+" : ""}{asset.estimatedLossPercent.toFixed(1)}%
                    </span>
                    <span className="text-xs font-mono text-muted tabular-nums">
                      After: {formatCurrency(asset.projectedValue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
