"use client";

import React, { useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { decodePortfolioSnapshot, PortfolioShareSnapshot } from "@/lib/shareUtils";
import { formatPercent, cn } from "@/lib/utils";
import SharePortfolioModal from "@/components/portfolio/SharePortfolioModal";

const ASSET_COLORS = [
  "#6366f1", "#38bdf8", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6", "#f97316"
];

function SharePageContent() {
  const searchParams = useSearchParams();
  const dataParam = searchParams.get("data");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const snapshot: PortfolioShareSnapshot | null = useMemo(() => {
    if (!dataParam) return null;
    return decodePortfolioSnapshot(dataParam);
  }, [dataParam]);

  if (!snapshot) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-loss/10 border border-loss/20 flex items-center justify-center text-2xl text-loss">
          ⚠️
        </div>
        <h1 className="text-2xl font-bold text-foreground">ไม่พบข้อมูลพอร์ตที่แชร์</h1>
        <p className="text-sm text-muted max-w-md">
          ลิงก์แชร์อาจไม่ถูกต้องหรือข้อมูลถูกตัดทอน กรุณาขอลิงก์แชร์ใหม่อีกครั้ง
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-accent text-white font-bold text-sm shadow-lg shadow-accent/20 hover:bg-accent/90 transition-all"
        >
          กลับสู่หน้าหลัก StockWise
        </Link>
      </div>
    );
  }

  const isPositive = snapshot.returnPercent >= 0;
  const currencySymbol = snapshot.currency === "THB" ? "฿" : "$";

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 pt-4 animate-fade-in">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-card-bg/90 border border-border/80 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center shadow-lg shadow-accent/25 text-white">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10" />
              <path d="M12 8v4l3 3" />
              <path d="M18 2l2 2-2 2" />
              <path d="M22 2l-2 2" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                {snapshot.name}
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-accent/10 border border-accent/20 text-accent font-mono text-[10px] font-bold uppercase">
                {snapshot.strategy || "PORTFOLIO"}
              </span>
            </div>
            <p className="text-xs text-muted mt-1 flex items-center gap-2">
              <span>Verified Snapshot · {new Date(snapshot.updatedAt).toLocaleDateString("en-US", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}</span>
              {snapshot.hideBalances && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted-bg text-muted border border-border/60">
                  🔒 ซ่อนยอดเงิน
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/"
            className="px-4 py-2.5 rounded-xl bg-accent text-white font-bold text-xs shadow-md hover:bg-accent/90 transition-all flex items-center gap-1.5"
          >
            <span>สร้างพอร์ตของคุณ</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Return % */}
        <div className="glass-card p-5 rounded-2xl border border-border/80 relative overflow-hidden">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
            Total All-Time Return
          </span>
          <div className={cn(
            "text-3xl font-extrabold font-mono tracking-tight mt-2 tabular-nums",
            isPositive ? "text-profit" : "text-loss"
          )}>
            {formatPercent(snapshot.returnPercent)}
          </div>
          <div className="mt-2 text-xs text-muted flex items-center gap-1.5">
            <span className={cn(
              "w-2 h-2 rounded-full",
              isPositive ? "bg-profit" : "bg-loss"
            )} />
            <span>{isPositive ? "ผลตอบแทนเป็นบวก" : "ผลตอบแทนติดลบ"}</span>
          </div>
        </div>

        {/* Card 2: Portfolio Health */}
        <div className="glass-card p-5 rounded-2xl border border-border/80 relative overflow-hidden">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
            Diversification Score
          </span>
          <div className="text-3xl font-extrabold font-mono tracking-tight mt-2 text-foreground flex items-baseline gap-2">
            <span>{snapshot.healthScore > 0 ? snapshot.healthScore : "—"}</span>
            <span className="text-sm text-muted font-sans font-semibold">/ 100</span>
          </div>
          <div className="mt-2 text-xs text-muted flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-accent/10 text-accent border border-accent/20">
              Grade: {snapshot.healthGrade || "A"}
            </span>
            <span>ความหลากหลายพอร์ต</span>
          </div>
        </div>

        {/* Card 3: Asset Count */}
        <div className="glass-card p-5 rounded-2xl border border-border/80 relative overflow-hidden">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
            Total Holdings
          </span>
          <div className="text-3xl font-extrabold font-mono tracking-tight mt-2 text-foreground">
            {snapshot.holdings?.length || 0} หุ้น
          </div>
          <div className="mt-2 text-xs text-muted">
            {snapshot.hideBalances
              ? "🔒 ซ่อนมูลค่าเพื่อความเป็นส่วนตัว"
              : `มูลค่ารวม: ${currencySymbol}${(snapshot.totalValue || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          </div>
        </div>
      </div>

      {/* 3. Asset Allocation Bar & List */}
      <div className="p-6 rounded-3xl bg-card-bg/90 border border-border/80 shadow-xl space-y-6">
        <div>
          <h2 className="text-base font-bold text-foreground">สัดส่วนสินทรัพย์ในพอร์ต (Asset Allocation)</h2>
          <p className="text-xs text-muted mt-0.5">กระจายการลงทุนในหุ้นและกองทุน</p>
        </div>

        {/* Allocation Bar */}
        <div className="h-4 w-full rounded-full overflow-hidden flex bg-muted-bg/60 p-0.5 gap-1">
          {snapshot.holdings?.map((h, idx) => (
            <div
              key={h.symbol}
              className="h-full rounded-full transition-all duration-300 relative group cursor-pointer"
              style={{
                width: `${Math.max(4, h.weight)}%`,
                backgroundColor: ASSET_COLORS[idx % ASSET_COLORS.length],
              }}
              title={`${h.symbol}: ${h.weight}%`}
            />
          ))}
        </div>

        {/* Holdings Table */}
        <div className="divide-y divide-border/50 overflow-x-auto">
          {snapshot.holdings?.map((h, idx) => {
            const isItemPositive = h.plPercent >= 0;
            return (
              <div key={h.symbol} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: ASSET_COLORS[idx % ASSET_COLORS.length] }}
                  />
                  <div>
                    <span className="font-bold text-sm text-foreground">{h.symbol}</span>
                    {h.name && <p className="text-xs text-muted truncate max-w-[180px] sm:max-w-xs">{h.name}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-6 text-right font-mono">
                  <div>
                    <span className="text-xs text-muted block text-[10px] font-sans">สัดส่วน</span>
                    <span className="text-xs font-bold text-foreground">{h.weight.toFixed(1)}%</span>
                  </div>

                  <div>
                    <span className="text-xs text-muted block text-[10px] font-sans">P/L Return</span>
                    <span className={cn("text-xs font-bold", isItemPositive ? "text-profit" : "text-loss")}>
                      {isItemPositive ? "+" : ""}{h.plPercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Bottom Banner CTA */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-accent/20 via-card-bg to-purple-500/20 border border-accent/30 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-foreground">ต้องการติดตามพอร์ตของคุณแบบนี้?</h3>
          <p className="text-xs text-muted max-w-lg">
            StockWise ช่วยคำนวณกำไร/ขาดทุนแบบ Real-time, ตรวจสุขภาพพอร์ตด้วย AI, รองรับทั้งหุ้นสหรัฐฯ และหุ้นไทย พร้อมสร้างการ์ดสรุปพอร์ตสวยงามแบบนี้ฟรี!
          </p>
        </div>

        <Link
          href="/"
          className="px-6 py-3 rounded-2xl bg-accent text-white font-bold text-sm shadow-xl shadow-accent/30 hover:bg-accent/90 active:scale-95 transition-all text-center shrink-0"
        >
          เริ่มต้นใช้งานฟรี 🚀
        </Link>
      </div>
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <span className="w-8 h-8 border-3 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      }
    >
      <SharePageContent />
    </Suspense>
  );
}
