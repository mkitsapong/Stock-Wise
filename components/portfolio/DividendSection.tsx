"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { usePortfolioQuotes } from "@/hooks/usePortfolioQuotes";
import { useCurrency } from "@/context/CurrencyContext";
import {
  calculatePortfolioDividendSummary,
  saveDividendOverride,
  DividendFrequency,
  EnrichedDividendHolding,
} from "@/lib/dividends";
import { formatPercent, cn } from "@/lib/utils";
import CompanyLogo from "@/components/common/CompanyLogo";

export default function DividendSection() {
  const { holdings, isLoading } = usePortfolioQuotes();
  const { formatCurrency, formatSignedCurrency, currency, exchangeRate, currencySymbol } = useCurrency();

  const [viewSchedule, setViewSchedule] = useState<"MONTHLY" | "QUARTERLY">("MONTHLY");
  const [editingHolding, setEditingHolding] = useState<EnrichedDividendHolding | null>(null);
  const [customDividend, setCustomDividend] = useState<string>("");
  const [customYield, setCustomYield] = useState<string>("");
  const [customFreq, setCustomFreq] = useState<DividendFrequency>("Quarterly");

  // Calculate full dividend summary
  const dividendSummary = useMemo(
    () => calculatePortfolioDividendSummary(holdings),
    [holdings]
  );

  const {
    totalAnnualIncome,
    monthlyAverageIncome,
    portfolioDividendYield,
    portfolioYieldOnCost,
    dividendPayingCount,
    totalHoldingsCount,
    monthlySchedule,
    dividendHoldings,
  } = dividendSummary;

  // Quarterly aggregated schedule
  const quarterlySchedule = useMemo(() => {
    const quarters = [
      { monthIndex: 0, monthName: "Q1 (Jan-Mar)", projectedIncome: 0, symbols: new Set<string>() },
      { monthIndex: 1, monthName: "Q2 (Apr-Jun)", projectedIncome: 0, symbols: new Set<string>() },
      { monthIndex: 2, monthName: "Q3 (Jul-Sep)", projectedIncome: 0, symbols: new Set<string>() },
      { monthIndex: 3, monthName: "Q4 (Oct-Dec)", projectedIncome: 0, symbols: new Set<string>() },
    ];

    monthlySchedule.forEach((m, idx) => {
      const qIdx = Math.floor(idx / 3);
      quarters[qIdx].projectedIncome += m.projectedIncome;
      m.symbols.forEach((s) => quarters[qIdx].symbols.add(s));
    });

    return quarters.map((q) => ({
      monthIndex: q.monthIndex,
      monthName: q.monthName,
      projectedIncome: q.projectedIncome,
      symbols: Array.from(q.symbols),
    }));
  }, [monthlySchedule]);

  const nonDividendHoldings = useMemo(
    () => holdings.filter((h) => !h.hasDividend || h.dividendYield === 0),
    [holdings]
  );

  const handleOpenEdit = (h: EnrichedDividendHolding) => {
    setEditingHolding(h);
    setCustomDividend(h.annualDividend ? h.annualDividend.toString() : "");
    setCustomYield(h.dividendYield ? h.dividendYield.toString() : "");
    setCustomFreq(h.frequency || "Quarterly");
  };

  const handleSaveEdit = () => {
    if (!editingHolding) return;
    const annualDiv = parseFloat(customDividend) || 0;
    const yieldPct = parseFloat(customYield) || 0;

    let payoutMonths = [3, 6, 9, 12];
    if (customFreq === "Monthly") payoutMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    if (customFreq === "Semi-Annual") payoutMonths = [4, 9];
    if (customFreq === "Annual") payoutMonths = [5];

    saveDividendOverride(editingHolding.symbol, {
      hasDividend: annualDiv > 0 || yieldPct > 0,
      annualDividend: annualDiv,
      dividendYield: yieldPct,
      frequency: customFreq,
      payoutMonths,
    });

    setEditingHolding(null);
    window.location.reload(); // reload to refresh all context calculations
  };

  // If no holdings at all
  if (holdings.length === 0 && !isLoading) {
    return (
      <div className="glass-card p-8 rounded-3xl text-center animate-fade-in-up">
        <div className="w-12 h-12 rounded-2xl bg-profit/10 text-profit mx-auto flex items-center justify-center mb-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-foreground mb-1">ยังไม่มีข้อมูลสินทรัพย์สำหรับคำนวณเงินปันผล</h3>
        <p className="text-xs text-muted max-w-sm mx-auto">
          เพิ่มรายการซื้อขายหุ้นในแท็บ Transactions เพื่อเริ่มระบบจำลองกระแสเงินสดและเงินปันผลรายปี
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      
      {/* 1. Dividend Hero Stats Banner */}
      <div className="glass-card p-6 sm:p-7 rounded-3xl border border-border/80 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-1/4 w-80 h-40 bg-profit/10 rounded-full blur-[70px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-32 bg-accent/10 rounded-full blur-[60px] pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-profit/10 border border-profit/20 text-profit font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-profit animate-pulse" />
                Dividend Cash Flow Hub
              </span>
              <span className="text-xs text-muted font-medium">
                {dividendPayingCount} จาก {totalHoldingsCount} สินทรัพย์จ่ายปันผล
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Dividend Income & Yield Analytics
            </h2>
            <p className="text-xs sm:text-sm text-muted font-medium mt-1">
              ประมาณการกระแสเงินสดจากเงินปันผลรายปี รายเดือน และอัตราผลตอบแทนต่อต้นทุนจริง (Yield on Cost)
            </p>
          </div>

          {/* 4 Hero Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
            {/* Annual Income */}
            <div className="p-3.5 rounded-2xl bg-card-bg/80 border border-border/60 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-muted block mb-1">
                Annual Income
              </span>
              <span className="text-lg sm:text-xl font-extrabold font-mono text-profit tabular-nums block">
                {formatCurrency(totalAnnualIncome)}
              </span>
              <span className="text-[10px] text-muted block mt-0.5">ต่อปี</span>
            </div>

            {/* Monthly Avg */}
            <div className="p-3.5 rounded-2xl bg-card-bg/80 border border-border/60 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-muted block mb-1">
                Monthly Average
              </span>
              <span className="text-lg sm:text-xl font-extrabold font-mono text-foreground tabular-nums block">
                {formatCurrency(monthlyAverageIncome)}
              </span>
              <span className="text-[10px] text-muted block mt-0.5">เฉลี่ยต่อเดือน</span>
            </div>

            {/* Portfolio Yield */}
            <div className="p-3.5 rounded-2xl bg-card-bg/80 border border-border/60 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-muted block mb-1">
                Dividend Yield
              </span>
              <span className="text-lg sm:text-xl font-extrabold font-mono text-accent tabular-nums block">
                {portfolioDividendYield.toFixed(2)}%
              </span>
              <span className="text-[10px] text-muted block mt-0.5">Yield ปัจจุบัน</span>
            </div>

            {/* Yield on Cost */}
            <div className="p-3.5 rounded-2xl bg-card-bg/80 border border-border/60 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-muted block mb-1">
                Yield on Cost
              </span>
              <span className="text-lg sm:text-xl font-extrabold font-mono text-purple-400 tabular-nums block">
                {portfolioYieldOnCost.toFixed(2)}%
              </span>
              <span className="text-[10px] text-muted block mt-0.5">เทียบเงินต้น (YOC)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 12-Month Projected Dividend Cash Flow Chart */}
      <div className="glass-card p-5 sm:p-7 rounded-3xl border border-border/80 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-foreground">
              12-Month Projected Dividend Calendar
            </h3>
            <p className="text-xs text-muted mt-0.5">
              กราฟจำลองรายรับเงินปันผลที่จะได้รับในแต่ละเดือนตลอดทั้งปี
            </p>
          </div>

          {/* Toggle Monthly vs Quarterly */}
          <div className="flex items-center bg-muted-bg/80 p-1 rounded-xl border border-border/60">
            <button
              onClick={() => setViewSchedule("MONTHLY")}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                viewSchedule === "MONTHLY"
                  ? "bg-card-bg text-accent font-bold shadow-md border border-border/50"
                  : "text-muted hover:text-foreground"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setViewSchedule("QUARTERLY")}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                viewSchedule === "QUARTERLY"
                  ? "bg-card-bg text-accent font-bold shadow-md border border-border/50"
                  : "text-muted hover:text-foreground"
              )}
            >
              Quarterly
            </button>
          </div>
        </div>

        {/* Recharts Bar Chart */}
        <div className="h-[280px] w-full -ml-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={viewSchedule === "MONTHLY" ? monthlySchedule : quarterlySchedule}
              margin={{ top: 10, right: 10, bottom: 5, left: 10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(148, 163, 184, 0.08)"
                vertical={false}
              />
              <XAxis
                dataKey="monthName"
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
                  if (display >= 1000) return `${currencySymbol}${(display / 1000).toFixed(0)}k`;
                  return `${currencySymbol}${Math.round(display)}`;
                }}
                width={54}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload as (typeof monthlySchedule)[0];
                  return (
                    <div className="glass-card !rounded-2xl p-4 shadow-2xl border border-border/80 min-w-[200px] text-xs font-mono space-y-1.5">
                      <div className="flex items-center justify-between pb-1.5 border-b border-border/40 font-sans">
                        <span className="font-bold text-foreground">{item.monthName}</span>
                        <span className="text-[10px] text-profit bg-profit/10 px-2 py-0.5 rounded-md font-mono font-bold">
                          Est. Payout
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-muted font-sans">Expected:</span>
                        <span className="font-bold text-profit text-sm tabular-nums">
                          {formatCurrency(item.projectedIncome)}
                        </span>
                      </div>
                      {item.symbols && item.symbols.length > 0 && (
                        <div className="pt-1.5 border-t border-border/40 text-[11px] text-muted">
                          Paying: <strong className="text-foreground">{item.symbols.join(", ")}</strong>
                        </div>
                      )}
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="projectedIncome"
                fill="#3ea874"
                radius={[8, 8, 0, 0]}
              >
                {(viewSchedule === "MONTHLY" ? monthlySchedule : quarterlySchedule).map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.projectedIncome > 0 ? "#3ea874" : "rgba(148, 163, 184, 0.15)"}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Detailed Dividend Holdings Breakdown Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground">
              Dividend-Paying Holdings ({dividendHoldings.length})
            </h3>
            <p className="text-xs text-muted">
              รายละเอียดเงินปันผลรายตัว อัตราผลตอบแทน และรอบการจ่าย
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dividendHoldings.map((h) => {
            const totalValue = h.shares * (h.currentPrice || h.avgCost || 0);

            return (
              <div
                key={h.symbol}
                className="p-5 rounded-2xl bg-card-bg/60 border border-border/60 hover:border-border transition-all shadow-sm space-y-4"
              >
                {/* Top Row: Symbol & Quick Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CompanyLogo symbol={h.symbol} name={h.name} size="md" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-foreground text-sm sm:text-base">
                          {h.symbol}
                        </span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase",
                          h.frequency === "Monthly"
                            ? "bg-profit/10 text-profit border border-profit/20"
                            : h.frequency === "Quarterly"
                            ? "bg-accent/10 text-accent border border-accent/20"
                            : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        )}>
                          {h.frequency}
                        </span>
                      </div>
                      <span className="text-xs text-muted truncate max-w-[180px] block">
                        {h.name} · {h.shares} หุ้น ({formatCurrency(totalValue)})
                      </span>
                    </div>
                  </div>

                  {/* Edit Dividend Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(h)}
                    className="px-2.5 py-1 text-[11px] font-semibold text-muted hover:text-foreground bg-muted-bg hover:bg-card-bg border border-border/50 rounded-lg transition-colors cursor-pointer"
                  >
                    Edit Rate
                  </button>
                </div>

                {/* 4 Stats Grid */}
                <div className="grid grid-cols-4 gap-2 text-center pt-1 border-t border-border/40">
                  <div className="p-2 rounded-xl bg-card-bg border border-border/40">
                    <span className="text-[9px] uppercase font-bold text-muted block">Div Yield</span>
                    <span className="text-xs sm:text-sm font-bold font-mono text-profit tabular-nums">
                      {h.dividendYield.toFixed(1)}%
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-card-bg border border-border/40">
                    <span className="text-[9px] uppercase font-bold text-muted block">Yield on Cost</span>
                    <span className="text-xs sm:text-sm font-bold font-mono text-purple-400 tabular-nums">
                      {h.yieldOnCost.toFixed(1)}%
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-card-bg border border-border/40">
                    <span className="text-[9px] uppercase font-bold text-muted block">Annual Income</span>
                    <span className="text-xs sm:text-sm font-bold font-mono text-foreground tabular-nums">
                      {formatCurrency(h.annualIncome)}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-card-bg border border-border/40">
                    <span className="text-[9px] uppercase font-bold text-muted block">Monthly Est.</span>
                    <span className="text-xs sm:text-sm font-bold font-mono text-foreground tabular-nums">
                      {formatCurrency(h.monthlyAverageIncome)}
                    </span>
                  </div>
                </div>

                {/* Dates & Ex-Div info */}
                <div className="flex items-center justify-between text-[11px] font-mono text-muted pt-1">
                  <span>Last Div: {h.lastDividendDate || "N/A"}</span>
                  <span>Next Pay: <strong className="text-foreground">{h.nextPayDate || "N/A"}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Non-Dividend Holdings with Quick Enable */}
      {nonDividendHoldings.length > 0 && (
        <div className="p-5 rounded-2xl bg-card-bg/40 border border-border/40 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-foreground">
                Other Holdings ({nonDividendHoldings.length})
              </h4>
              <p className="text-[11px] text-muted">
                หุ้นที่ยังไม่ได้เปิดระบบเงินปันผล สามารถคลิก "Add Dividend" เพื่อระบุอัตราเงินปันผลได้
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {nonDividendHoldings.map((nh) => (
              <button
                key={nh.symbol}
                onClick={() => handleOpenEdit(nh as EnrichedDividendHolding)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted-bg hover:bg-accent/15 border border-border/60 text-xs font-mono text-muted hover:text-foreground transition-all cursor-pointer"
              >
                <span className="font-bold">{nh.symbol}</span>
                <span className="text-[10px] text-accent">+ Add Dividend</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 🌟 Custom Dividend Edit Modal */}
      {editingHolding && (
        <div className="fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-4 animate-fade-in-up">
          <div className="glass-card border border-border/90 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <div className="flex items-center gap-2.5">
                <CompanyLogo symbol={editingHolding.symbol} name={editingHolding.name} size="sm" />
                <div>
                  <h3 className="font-bold text-foreground text-sm font-mono">
                    Edit Dividend: {editingHolding.symbol}
                  </h3>
                  <p className="text-xs text-muted">{editingHolding.name}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingHolding(null)}
                className="text-muted hover:text-foreground p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted block mb-1">
                  Annual Dividend Per Share ($ หรือ ฿)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={customDividend}
                  onChange={(e) => {
                    setCustomDividend(e.target.value);
                    const val = parseFloat(e.target.value);
                    const price = editingHolding.currentPrice || editingHolding.avgCost || 1;
                    if (val && price > 0) {
                      setCustomYield(((val / price) * 100).toFixed(2));
                    }
                  }}
                  placeholder="e.g. 7.12"
                  className="w-full bg-card-bg border border-border/80 rounded-xl px-3.5 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted block mb-1">
                  Dividend Yield (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={customYield}
                  onChange={(e) => setCustomYield(e.target.value)}
                  placeholder="e.g. 14.1"
                  className="w-full bg-card-bg border border-border/80 rounded-xl px-3.5 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted block mb-1">
                  Payment Frequency (ความถี่การจ่าย)
                </label>
                <select
                  value={customFreq}
                  onChange={(e) => setCustomFreq(e.target.value as DividendFrequency)}
                  className="w-full bg-card-bg border border-border/80 rounded-xl px-3.5 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-accent"
                >
                  <option value="Monthly">Monthly (รายเดือน - 12 ครั้ง/ปี)</option>
                  <option value="Quarterly">Quarterly (รายไตรมาส - 4 ครั้ง/ปี)</option>
                  <option value="Semi-Annual">Semi-Annual (รายครึ่งปี - 2 ครั้ง/ปี)</option>
                  <option value="Annual">Annual (รายปี - 1 ครั้ง/ปี)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/50">
              <button
                type="button"
                onClick={() => setEditingHolding(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:text-foreground bg-muted-bg/60 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-profit hover:bg-profit/90 shadow-md cursor-pointer"
              >
                Save & Update
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
