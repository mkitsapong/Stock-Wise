"use client";

import { useEffect, useState } from "react";
import { useTransactions } from "@/context/TransactionContext";
import CompanyLogo from "@/components/common/CompanyLogo";
import { cn } from "@/lib/utils";

interface EarningsItem {
  symbol: string;
  earningsDate: number; // unix timestamp
  earningsDateFormatted: string;
  epsEstimate: number | null;
  daysUntil: number;
}

export default function EarningsCalendar() {
  const { allHoldings } = useTransactions();
  const [earnings, setEarnings] = useState<EarningsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (allHoldings.length === 0) return;
    setIsLoading(true);
    const symbols = allHoldings.map((h) => h.symbol).join(",");
    fetch(`/api/earnings?symbols=${encodeURIComponent(symbols)}`)
      .then((r) => r.json())
      .then((data) => {
        const now = Date.now();
        const items: EarningsItem[] = (data.earnings || [])
          .map((e: any) => ({
            ...e,
            daysUntil: Math.ceil((e.earningsDate * 1000 - now) / (1000 * 60 * 60 * 24)),
          }))
          .filter((e: EarningsItem) => e.daysUntil >= -7) // include recent past within 7 days
          .sort((a: EarningsItem, b: EarningsItem) => a.earningsDate - b.earningsDate)
          .slice(0, 8);
        setEarnings(items);
      })
      .finally(() => setIsLoading(false));
  }, [allHoldings.length]);

  function getBadge(days: number) {
    if (days < 0) return { label: `${Math.abs(days)}d ago`, class: "bg-muted/10 text-muted border-muted/20" };
    if (days === 0) return { label: "Today 🔴", class: "bg-loss/10 text-loss border-loss/20 animate-pulse" };
    if (days <= 7) return { label: `${days}d left`, class: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
    if (days <= 30) return { label: `${days}d left`, class: "bg-accent/10 text-accent border-accent/20" };
    return { label: `${days}d left`, class: "bg-muted/10 text-muted border-muted/20" };
  }

  return (
    <div className="glass-card p-6 animate-fade-in-up opacity-0 stagger-3 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-xs">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Earnings Calendar</h2>
            <p className="text-xs text-muted">วันประกาศผลบริษัทที่คุณถืออยู่</p>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted-bg/40 animate-pulse border border-border/30">
                <div className="w-9 h-9 rounded-xl skeleton-shimmer flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="w-20 h-3 skeleton-shimmer rounded" />
                  <div className="w-32 h-3 skeleton-shimmer rounded" />
                </div>
                <div className="w-16 h-6 skeleton-shimmer rounded-lg" />
              </div>
            ))}
          </div>
        )}

        {/* Earnings List */}
        {!isLoading && earnings.length > 0 && (
          <div className="space-y-2">
            {earnings.map((item) => {
              const badge = getBadge(item.daysUntil);
              const isRecent = item.daysUntil < 0;
              return (
                <div
                  key={item.symbol}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all",
                    item.daysUntil === 0
                      ? "bg-loss/5 border-loss/20"
                      : item.daysUntil <= 7
                      ? "bg-amber-500/5 border-amber-500/15"
                      : "bg-muted-bg/30 border-border/40",
                    isRecent && "opacity-60"
                  )}
                >
                  <CompanyLogo symbol={item.symbol} size="md" className="rounded-xl flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground font-mono">{item.symbol}</p>
                    <p className="text-xs text-muted">{item.earningsDateFormatted}</p>
                  </div>
                  {item.epsEstimate !== null && (
                    <div className="text-right mr-2">
                      <p className="text-[10px] text-muted">EPS Est.</p>
                      <p className={cn("text-xs font-bold font-mono", item.epsEstimate >= 0 ? "text-profit" : "text-loss")}>
                        {item.epsEstimate >= 0 ? "+" : ""}{item.epsEstimate.toFixed(2)}
                      </p>
                    </div>
                  )}
                  <span className={cn("text-[10px] font-bold px-2 py-1 rounded-lg border flex-shrink-0", badge.class)}>
                    {badge.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State when no holdings in account */}
        {!isLoading && allHoldings.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 my-auto">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3 shadow-xs">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <p className="text-sm font-bold text-foreground">ยังไม่มีรายการประกาศงบ</p>
            <p className="text-xs text-muted mt-1 max-w-[220px]">
              เมื่อคุณบันทึกหุ้นในพอร์ต ระบบจะแสดงปฏิทิน Earnings ให้อัตโนมัติ
            </p>
            <a
              href="/transactions"
              className="mt-4 px-3.5 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500 transition-all shadow-sm active:scale-95 cursor-pointer inline-block"
            >
              + บันทึกธุรกรรมแรก
            </a>
          </div>
        )}

        {/* No upcoming but user has holdings */}
        {!isLoading && earnings.length === 0 && allHoldings.length > 0 && (
          <p className="text-sm text-muted text-center py-6">ไม่พบข้อมูล Earnings ของหุ้นในพอร์ตช่วงนี้</p>
        )}
      </div>
    </div>
  );
}
