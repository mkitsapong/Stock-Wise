"use client";

import { useState, useEffect } from "react";
import { useTransactions, type Portfolio } from "@/context/TransactionContext";
import { useCurrency } from "@/context/CurrencyContext";
import CompanyLogo from "@/components/common/CompanyLogo";
import { formatNumber, cn } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  name?: string;
  shares?: number;
  totalValue?: number;
}

const STRATEGY_ICONS: Record<string, string> = {
  GROWTH: "🚀",
  DIVIDEND: "💰",
  TRADING: "⚡",
  CUSTOM: "🎯",
};

export default function MoveStockModal({
  isOpen,
  onClose,
  symbol,
  name,
  shares,
  totalValue,
}: Props) {
  const { portfolios, activePortfolioId, moveStockToPortfolio } = useTransactions();
  const { formatCurrency } = useCurrency();

  const [sourceId, setSourceId] = useState<string>("ALL");
  const [targetId, setTargetId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (activePortfolioId !== "ALL") {
      setSourceId(activePortfolioId);
      // Select the first different portfolio as target
      const other = portfolios.find((p) => p.id !== activePortfolioId);
      setTargetId(other ? other.id : portfolios[0]?.id || "growth");
    } else {
      setSourceId("ALL");
      setTargetId(portfolios[0]?.id || "growth");
    }
  }, [activePortfolioId, portfolios, isOpen]);

  if (!isOpen || !symbol) return null;

  const sourcePortfolio = portfolios.find((p) => p.id === sourceId);
  const targetPortfolio = portfolios.find((p) => p.id === targetId);

  const handleMove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId || (sourceId !== "ALL" && sourceId === targetId)) return;

    setIsSubmitting(true);
    try {
      await moveStockToPortfolio(symbol, sourceId === "ALL" ? undefined : sourceId, targetId);
      onClose();
    } catch (err) {
      console.error("Failed to move stock:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md p-6 sm:p-7 bg-card-bg/95 backdrop-blur-2xl border border-border/80 rounded-3xl shadow-2xl relative overflow-hidden my-auto animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center font-bold text-lg shadow-sm">
              ⇄
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Move Asset to Portfolio</h2>
              <p className="text-xs text-muted">ย้ายหุ้นข้ามพอร์ตการลงทุนตามกลยุทธ์</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted hover:text-foreground hover:bg-muted-bg transition-all cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Selected Asset Info Card */}
        <div className="p-4 rounded-2xl bg-muted-bg/50 border border-border/60 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CompanyLogo symbol={symbol} name={name} size="md" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold font-mono text-foreground">{symbol}</span>
              </div>
              <span className="text-xs text-muted truncate max-w-[170px] block font-medium">
                {name || symbol}
              </span>
            </div>
          </div>

          <div className="text-right">
            {shares !== undefined && (
              <span className="text-xs font-mono font-bold text-foreground block">
                {formatNumber(shares)} shares
              </span>
            )}
            {totalValue !== undefined && (
              <span className="text-[11px] font-mono text-muted block">
                {formatCurrency(totalValue)}
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleMove} className="space-y-4">
          {/* Transfer Visual Direction */}
          <div className="grid grid-cols-5 items-center gap-2 p-3 rounded-2xl bg-card-bg/80 border border-border/60">
            {/* From */}
            <div className="col-span-2 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1">
                From (ต้นทาง)
              </span>
              <span
                style={{
                  color: sourcePortfolio ? sourcePortfolio.color : "#6366f1",
                }}
                className="text-xs font-bold font-mono truncate block"
              >
                {sourceId === "ALL" ? "🌐 ทุกพอร์ต" : sourcePortfolio?.name}
              </span>
            </div>

            {/* Arrow */}
            <div className="col-span-1 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center font-bold text-sm">
                ➔
              </div>
            </div>

            {/* To */}
            <div className="col-span-2 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1">
                To (ปลายทาง)
              </span>
              <span
                style={{
                  color: targetPortfolio ? targetPortfolio.color : "#10b981",
                }}
                className="text-xs font-bold font-mono truncate block"
              >
                {targetPortfolio?.name || "เลือกพอร์ต"}
              </span>
            </div>
          </div>

          {/* Destination Portfolio Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Select Destination Portfolio (เลือกพอร์ตปลายทาง)
            </label>
            <div className="grid grid-cols-1 gap-2">
              {portfolios.map((p) => {
                const isSelected = targetId === p.id;
                const isSource = sourceId === p.id;

                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={isSource}
                    onClick={() => setTargetId(p.id)}
                    style={{
                      borderColor: isSelected ? `${p.color}60` : undefined,
                      backgroundColor: isSelected ? `${p.color}15` : undefined,
                    }}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer",
                      isSource
                        ? "opacity-40 cursor-not-allowed bg-muted-bg/20 border-border/30"
                        : isSelected
                        ? "shadow-sm font-bold"
                        : "bg-muted-bg/30 border-border/40 hover:bg-muted-bg hover:border-border"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{STRATEGY_ICONS[p.strategy] || "💼"}</span>
                      <div>
                        <span
                          style={{ color: isSelected ? p.color : undefined }}
                          className={cn(
                            "text-xs font-semibold block",
                            isSelected ? "font-bold" : "text-foreground"
                          )}
                        >
                          {p.name}
                        </span>
                        {p.description && (
                          <span className="text-[10px] text-muted block">{p.description}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSource && (
                        <span className="text-[10px] text-muted font-mono uppercase bg-muted-bg px-2 py-0.5 rounded">
                          Current
                        </span>
                      )}
                      {isSelected && (
                        <span style={{ color: p.color }} className="font-bold text-sm">
                          ✓
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit / Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-muted hover:text-foreground bg-muted-bg hover:bg-muted-bg/80 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !targetId || (sourceId !== "ALL" && sourceId === targetId)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-accent to-purple-500 hover:brightness-110 active:scale-95 transition-all shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Moving..." : "Confirm Move (ยืนยันการย้าย)"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
