"use client";

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface PortfolioHealthScoreProps {
  holdings: any[];
  sectorData: Record<string, any>;
}

export default function PortfolioHealthScore({ holdings, sectorData }: PortfolioHealthScoreProps) {
  const analysis = useMemo(() => {
    if (!holdings || holdings.length === 0) {
      return {
        score: 0,
        grade: "N/A",
        color: "#94a3b8",
        warnings: ["No holdings data available"],
        positives: [],
        topStockPct: 0,
        topStockSym: "-",
        topSectorPct: 0,
        topSectorName: "-",
        uniqueSectorsCount: 0,
      };
    }

    const totalValue = holdings.reduce((sum, h) => {
      const p = h.currentPrice || h.avgCost || 0;
      return sum + h.shares * p;
    }, 0);

    if (totalValue <= 0) {
      return {
        score: 50,
        grade: "Pending",
        color: "#94a3b8",
        warnings: ["Portfolio value is 0"],
        positives: [],
        topStockPct: 0,
        topStockSym: "-",
        topSectorPct: 0,
        topSectorName: "-",
        uniqueSectorsCount: 0,
      };
    }

    // 1. Stock Concentration
    let maxStockVal = 0;
    let maxStockSym = "";
    holdings.forEach(h => {
      const val = h.shares * (h.currentPrice || h.avgCost || 0);
      if (val > maxStockVal) {
        maxStockVal = val;
        maxStockSym = h.symbol;
      }
    });
    const topStockPct = (maxStockVal / totalValue) * 100;

    // 2. Sector Concentration
    const sectorVals: Record<string, number> = {};
    holdings.forEach(h => {
      const val = h.shares * (h.currentPrice || h.avgCost || 0);
      const sec = sectorData[h.symbol]?.sector || 'Other/Unknown';
      sectorVals[sec] = (sectorVals[sec] || 0) + val;
    });

    const sortedSectors = Object.entries(sectorVals).sort((a, b) => b[1] - a[1]);
    const topSectorName = sortedSectors[0]?.[0] || "-";
    const topSectorPct = sortedSectors[0] ? (sortedSectors[0][1] / totalValue) * 100 : 0;
    const uniqueSectorsCount = Object.keys(sectorVals).length;

    // Calculate score (0-100)
    let score = 100;
    const warnings: string[] = [];
    const positives: string[] = [];

    // Holdings count check
    if (holdings.length < 3) {
      score -= 30;
      warnings.push(`มีหุ้นเพียง ${holdings.length} ตัว (ควรมีอย่างน้อย 5 ตัวเพื่อลดความเสี่ยง)`);
    } else if (holdings.length >= 5 && holdings.length <= 15) {
      positives.push(`จำนวนหุ้น ${holdings.length} ตัว กำลังพอเหมาะในการติดตาม`);
    } else if (holdings.length > 25) {
      score -= 10;
      warnings.push(`มีหุ้นถึง ${holdings.length} ตัว อาจกระจายการลงทุนมากเกินไป (Over-diversified)`);
    }

    // Single stock concentration check
    if (topStockPct > 40) {
      score -= 30;
      warnings.push(`หุ้น ${maxStockSym} กินสัดส่วนสูงถึง ${topStockPct.toFixed(1)}% ของพอร์ต`);
    } else if (topStockPct > 25) {
      score -= 15;
      warnings.push(`หุ้น ${maxStockSym} มีสัดส่วนค่อนข้างสูง (${topStockPct.toFixed(1)}%)`);
    } else {
      positives.push(`หุ้นที่มีสัดส่วนมากที่สุด (${maxStockSym}) ไม่เกิน 25% คุมความเสี่ยงได้ดี`);
    }

    // Sector concentration check
    if (uniqueSectorsCount < 3 && holdings.length >= 3) {
      score -= 20;
      warnings.push(`กระจายอยู่ใน ${uniqueSectorsCount} อุตสาหกรรมเท่านั้น`);
    } else if (uniqueSectorsCount >= 4) {
      positives.push(`กระจายความเสี่ยงใน ${uniqueSectorsCount} กลุ่มอุตสาหกรรม`);
    }

    if (topSectorPct > 50) {
      score -= 20;
      warnings.push(`กลุ่ม ${topSectorName} ครองสัดส่วนสูงถึง ${topSectorPct.toFixed(1)}%`);
    }

    score = Math.max(10, Math.min(100, score));

    let grade = "ยอดเยี่ยม";
    let color = "#10b981"; // Emerald
    if (score < 50) {
      grade = "เสี่ยงสูง";
      color = "#f43f5e"; // Rose
    } else if (score < 75) {
      grade = "ปานกลาง";
      color = "#f59e0b"; // Amber
    } else if (score < 90) {
      grade = "ดีมาก";
      color = "#3b82f6"; // Blue
    }

    return {
      score,
      grade,
      color,
      warnings,
      positives,
      topStockPct,
      topStockSym: maxStockSym,
      topSectorPct,
      topSectorName,
      uniqueSectorsCount,
    };
  }, [holdings, sectorData]);

  const strokeDashoffset = 283 - (283 * analysis.score) / 100;

  return (
    <div className="bg-card-bg/60 backdrop-blur-md border border-border/70 rounded-2xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/40">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: analysis.color }} />
          Portfolio Health & Diversification
        </h3>
        <span 
          className="text-xs font-bold px-2.5 py-1 rounded-full font-mono border"
          style={{ 
            color: analysis.color, 
            borderColor: `${analysis.color}40`,
            backgroundColor: `${analysis.color}15`
          }}
        >
          {analysis.grade}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center my-auto py-2">
        {/* Score Circular Gauge */}
        <div className="sm:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="transparent"
                stroke="var(--border)"
                strokeWidth="8"
                opacity="0.4"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="transparent"
                stroke={analysis.color}
                strokeWidth="8"
                strokeDasharray="283"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black font-mono tracking-tight text-foreground">
                {analysis.score}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                / 100 PTS
              </span>
            </div>
          </div>
        </div>

        {/* Breakdown Key Metrics */}
        <div className="sm:col-span-7 space-y-3">
          <div className="space-y-2">
            {analysis.positives.slice(0, 2).map((p, i) => (
              <div key={`pos-${i}`} className="flex items-start gap-2 text-xs text-foreground/90">
                <span className="text-profit shrink-0 mt-0.5">✓</span>
                <span className="font-medium">{p}</span>
              </div>
            ))}
            {analysis.warnings.slice(0, 2).map((w, i) => (
              <div key={`warn-${i}`} className="flex items-start gap-2 text-xs text-loss">
                <span className="shrink-0 mt-0.5">⚠️</span>
                <span className="font-medium">{w}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 font-mono text-[11px]">
            <div className="p-2 rounded-xl bg-muted-bg/40 border border-border/30">
              <p className="text-muted text-[10px]">Top Stock Weight</p>
              <p className="font-bold text-foreground mt-0.5">{analysis.topStockSym} ({analysis.topStockPct.toFixed(1)}%)</p>
            </div>
            <div className="p-2 rounded-xl bg-muted-bg/40 border border-border/30">
              <p className="text-muted text-[10px]">Active Sectors</p>
              <p className="font-bold text-foreground mt-0.5">{analysis.uniqueSectorsCount} อุตสาหกรรม</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
