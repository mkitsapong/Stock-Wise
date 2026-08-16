"use client";

import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { usePortfolioQuotes } from "@/hooks/usePortfolioQuotes";
import { useCurrency } from "@/context/CurrencyContext";
import {
  calculateSectorBreakdown,
  calculateHoldingConcentration,
  calculateMarketMix,
  calculateDiversificationHealth,
  generateDiversificationInsights,
} from "@/lib/diversification";
import { formatPercent, cn } from "@/lib/utils";
import CompanyLogo from "@/components/common/CompanyLogo";

type ViewMode = "SECTOR" | "CONCENTRATION" | "MARKET";

export default function DiversificationSection() {
  const { holdings, isLoading } = usePortfolioQuotes();
  const { formatCurrency, currency } = useCurrency();
  const [viewMode, setViewMode] = useState<ViewMode>("SECTOR");
  const [activeSector, setActiveSector] = useState<string | null>(null);

  // Calculations
  const sectors = useMemo(() => calculateSectorBreakdown(holdings), [holdings]);
  const concentrations = useMemo(() => calculateHoldingConcentration(holdings), [holdings]);
  const marketMix = useMemo(() => calculateMarketMix(holdings), [holdings]);
  const health = useMemo(() => calculateDiversificationHealth(holdings), [holdings]);
  const insights = useMemo(
    () => generateDiversificationInsights(holdings, health, sectors, concentrations),
    [holdings, health, sectors, concentrations]
  );

  const totalPortfolioValue = useMemo(
    () => holdings.reduce((sum, h) => sum + (h.realTimeValue ?? (h.shares * (h.currentPrice || h.avgCost))), 0),
    [holdings]
  );

  if (holdings.length === 0 && !isLoading) {
    return (
      <div className="glass-card p-8 rounded-2xl text-center animate-fade-in-up">
        <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent mx-auto flex items-center justify-center mb-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
            <path d="M22 12A10 10 0 0 0 12 2v10z" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-foreground mb-1">ยังไม่มีข้อมูลสินทรัพย์สำหรับวิเคราะห์</h3>
        <p className="text-xs text-muted max-w-sm mx-auto">
          เพิ่มรายการซื้อขายหุ้นในแท็บ Transactions เพื่อเริ่มระบบประเมินการกระจายความเสี่ยง (Diversification Analysis)
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      
      {/* 1. Diversification Health Score Card */}
      <div className="glass-card p-5 sm:p-7 rounded-3xl relative overflow-hidden shadow-lg border border-border/80">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-[70px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-[60px] pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Left: Score & Grade Gauge */}
          <div className="flex items-center gap-5">
            <div className="relative flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-muted-bg/60 border border-border/80 shadow-inner flex-shrink-0">
              <svg className="w-20 h-20 sm:w-24 sm:h-24 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-muted/20"
                  strokeWidth="3.2"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={cn(
                    "transition-all duration-1000 ease-out",
                    health.score >= 80 ? "text-profit" : health.score >= 60 ? "text-amber-500" : "text-loss"
                  )}
                  strokeDasharray={`${health.score}, 100`}
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-foreground">
                  {health.score}
                </span>
                <span className="text-[9px] font-mono text-muted uppercase tracking-wider font-bold">
                  / 100
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  Diversification Health
                </span>
                <span className={cn(
                  "px-2 py-0.5 rounded-md text-[11px] font-mono font-extrabold border shadow-sm",
                  health.score >= 80 ? "bg-profit/10 text-profit border-profit/20" :
                  health.score >= 60 ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                  "bg-loss/10 text-loss border-loss/20"
                )}>
                  Grade {health.grade}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                {health.statusTh}
              </h2>
              <p className="text-xs text-muted mt-0.5">
                {health.status} · ประเมินจากความเสี่ยงกระจุกตัว หุ้นรายตัว และกลุ่มธุรกิจ
              </p>
            </div>
          </div>

          {/* Right: Key Breakdown Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-card-bg/80 border border-border/60 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-muted block mb-0.5">Top Holding</span>
              <span className={cn(
                "text-base font-mono font-extrabold tabular-nums block",
                health.topHoldingWeight > 25 ? "text-amber-500" : "text-foreground"
              )}>
                {health.topHoldingWeight.toFixed(1)}%
              </span>
              <span className="text-[10px] text-muted truncate block">
                {concentrations[0]?.symbol || "-"}
              </span>
            </div>

            <div className="p-3 bg-card-bg/80 border border-border/60 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-muted block mb-0.5">Top 3 Holdings</span>
              <span className={cn(
                "text-base font-mono font-extrabold tabular-nums block",
                health.top3HoldingsWeight > 60 ? "text-amber-500" : "text-foreground"
              )}>
                {health.top3HoldingsWeight.toFixed(1)}%
              </span>
              <span className="text-[10px] text-muted block">3 อันดับแรก</span>
            </div>

            <div className="p-3 bg-card-bg/80 border border-border/60 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-muted block mb-0.5">Sectors</span>
              <span className="text-base font-mono font-extrabold text-foreground tabular-nums block">
                {health.sectorCount} กลุ่ม
              </span>
              <span className="text-[10px] text-muted truncate block">
                Max {health.maxSectorWeight.toFixed(0)}%
              </span>
            </div>

            <div className="p-3 bg-card-bg/80 border border-border/60 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-muted block mb-0.5">Positions</span>
              <span className="text-base font-mono font-extrabold text-foreground tabular-nums block">
                {health.positionCount} ตัว
              </span>
              <span className="text-[10px] text-muted block">
                {health.positionCount >= 5 ? "Balanced" : "Focused"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Multi-View Allocation Breakdowns */}
      <div className="glass-card p-5 sm:p-7 rounded-3xl border border-border/80">
        
        {/* Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border/40">
          <div>
            <h3 className="text-base font-bold text-foreground">
              Portfolio Allocation & Concentration Breakdowns
            </h3>
            <p className="text-xs text-muted mt-0.5">
              สัดส่วนการกระจายสินทรัพย์ในพอร์ตโฟลิโอ (มูลค่ารวม {formatCurrency(totalPortfolioValue)})
            </p>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-muted-bg/80 p-1 rounded-xl border border-border/60 shadow-sm">
            <button
              onClick={() => setViewMode("SECTOR")}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                viewMode === "SECTOR"
                  ? "bg-card-bg text-accent font-bold shadow-md border border-border/50"
                  : "text-muted hover:text-foreground"
              )}
            >
              By Sector
            </button>
            <button
              onClick={() => setViewMode("CONCENTRATION")}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                viewMode === "CONCENTRATION"
                  ? "bg-card-bg text-accent font-bold shadow-md border border-border/50"
                  : "text-muted hover:text-foreground"
              )}
            >
              Single Holdings
            </button>
            <button
              onClick={() => setViewMode("MARKET")}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                viewMode === "MARKET"
                  ? "bg-card-bg text-accent font-bold shadow-md border border-border/50"
                  : "text-muted hover:text-foreground"
              )}
            >
              Market Mix
            </button>
          </div>
        </div>

        {/* VIEW 1: SECTOR BREAKDOWN */}
        {viewMode === "SECTOR" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Donut Chart */}
            <div className="lg:col-span-5 h-[280px] relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sectors}
                    cx="50%"
                    cy="50%"
                    innerRadius="62%"
                    outerRadius="90%"
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                    onMouseEnter={(data) => setActiveSector(data?.name ?? null)}
                    onMouseLeave={() => setActiveSector(null)}
                  >
                    {sectors.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={entry.color}
                        className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const item = payload[0].payload as (typeof sectors)[0];
                      return (
                        <div className="glass-card !rounded-2xl px-4 py-3 shadow-2xl border border-border/80">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                            <p className="text-xs font-bold text-foreground">{item.name}</p>
                          </div>
                          <p className="text-sm font-mono font-extrabold text-foreground">
                            {formatCurrency(item.value)}
                          </p>
                          <p className="text-[11px] font-mono text-muted mt-0.5">
                            {item.percentage.toFixed(1)}% · {item.holdingCount} หุ้น ({item.symbols.join(", ")})
                          </p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Centered Donut Label */}
              <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase font-bold text-muted">Sectors</span>
                <span className="text-2xl font-extrabold font-mono text-foreground">{sectors.length}</span>
              </div>
            </div>

            {/* Sector Breakdown List Cards */}
            <div className="lg:col-span-7 space-y-3">
              {sectors.map((sec) => {
                const isHovered = activeSector === sec.name;
                return (
                  <div
                    key={sec.name}
                    onMouseEnter={() => setActiveSector(sec.name)}
                    onMouseLeave={() => setActiveSector(null)}
                    className={cn(
                      "p-3.5 rounded-2xl bg-card-bg/60 border transition-all duration-200",
                      isHovered
                        ? "border-accent shadow-md bg-accent/5 scale-[1.01]"
                        : "border-border/60 hover:border-border"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: sec.color }} />
                        <span className="text-xs font-bold text-foreground">{sec.name}</span>
                        <span className="text-[10px] text-muted bg-muted-bg px-2 py-0.5 rounded-md font-mono">
                          {sec.holdingCount} หุ้น: {sec.symbols.join(", ")}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold font-mono text-foreground tabular-nums">
                          {formatCurrency(sec.value)}
                        </span>
                        <span className="text-xs font-mono font-bold text-accent ml-2 tabular-nums">
                          {sec.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-border/40 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, sec.percentage)}%`,
                          backgroundColor: sec.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: SINGLE HOLDINGS CONCENTRATION */}
        {viewMode === "CONCENTRATION" && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between text-xs text-muted mb-2 px-1">
              <span>Holding Asset & Sector</span>
              <span>Weight & Risk Level</span>
            </div>

            {concentrations.map((item) => {
              const riskTag = item.riskLevel;
              return (
                <div
                  key={item.symbol}
                  className="p-4 rounded-2xl bg-card-bg/60 border border-border/60 hover:border-border transition-all"
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-3">
                      <CompanyLogo symbol={item.symbol} name={item.name} size="sm" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold font-mono text-foreground">{item.symbol}</span>
                          <span className="text-[10px] text-muted bg-muted-bg px-2 py-0.5 rounded-md">
                            {item.sector}
                          </span>
                        </div>
                        <span className="text-xs text-muted truncate max-w-[200px] block font-medium">
                          {item.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <span className="text-sm font-bold font-mono text-foreground block tabular-nums">
                          {formatCurrency(item.value)}
                        </span>
                        <span className="text-xs font-mono font-bold text-accent tabular-nums">
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>

                      <span
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase border shadow-sm",
                          riskTag === "HIGH"
                            ? "bg-loss/10 text-loss border-loss/20"
                            : riskTag === "MODERATE"
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            : "bg-profit/10 text-profit border-profit/20"
                        )}
                      >
                        {riskTag === "HIGH" ? "Overweight >25%" : riskTag === "MODERATE" ? "Moderate" : "Safe <12%"}
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full h-2 rounded-full bg-border/40 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        riskTag === "HIGH" ? "bg-loss" : riskTag === "MODERATE" ? "bg-amber-500" : "bg-accent"
                      )}
                      style={{ width: `${Math.min(100, item.percentage)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* VIEW 3: MARKET & ASSET MIX */}
        {viewMode === "MARKET" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {marketMix.map((mix) => (
              <div
                key={mix.market}
                className="p-5 rounded-2xl bg-card-bg/60 border border-border/60 relative overflow-hidden"
              >
                <div
                  className="absolute top-0 right-0 w-24 h-24 rounded-full blur-[30px] opacity-20 pointer-events-none"
                  style={{ backgroundColor: mix.color }}
                />
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: mix.color }} />
                  <span className="text-xs font-bold text-foreground">{mix.market}</span>
                </div>
                <div className="text-2xl font-extrabold font-mono text-foreground mb-1 tabular-nums">
                  {mix.percentage.toFixed(1)}%
                </div>
                <div className="flex items-center justify-between text-xs text-muted font-mono">
                  <span>{formatCurrency(mix.value)}</span>
                  <span>{mix.count} สินทรัพย์</span>
                </div>

                <div className="w-full h-1.5 rounded-full bg-border/40 overflow-hidden mt-3">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${mix.percentage}%`, backgroundColor: mix.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Actionable Rebalancing & Smart Risk Insights */}
      <div className="glass-card p-5 sm:p-7 rounded-3xl border border-border/80 relative overflow-hidden">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-accent to-purple-500 flex items-center justify-center text-white shadow-md">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              Smart Diversification & Rebalancing Insights
            </h3>
            <p className="text-xs text-muted">
              ข้อเสนอแนะในการปรับสัดส่วนเพื่อลดความผันผวนและเพิ่มประสิทธิภาพพอร์ต
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((item) => {
            const isWarn = item.type === "WARNING";
            const isStrength = item.type === "STRENGTH";
            return (
              <div
                key={item.id}
                className={cn(
                  "p-4 rounded-2xl border transition-all relative overflow-hidden",
                  isWarn
                    ? "bg-loss/5 border-loss/20 hover:border-loss/40"
                    : isStrength
                    ? "bg-profit/5 border-profit/20 hover:border-profit/40"
                    : "bg-accent/5 border-accent/20 hover:border-accent/40"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase border",
                      isWarn
                        ? "bg-loss/10 text-loss border-loss/20"
                        : isStrength
                        ? "bg-profit/10 text-profit border-profit/20"
                        : "bg-accent/10 text-accent border-accent/20"
                    )}
                  >
                    {item.impact}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-foreground mb-1">
                  {item.titleTh}
                </h4>
                <p className="text-xs text-muted leading-relaxed">
                  {item.descriptionTh}
                </p>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
