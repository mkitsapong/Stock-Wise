"use client";

import { useState, useRef, useEffect } from "react";
import { useCurrency } from "@/context/CurrencyContext";
import { cn } from "@/lib/utils";

interface CurrencySwitcherProps {
  showRateBadge?: boolean;
  className?: string;
  compact?: boolean;
}

export default function CurrencySwitcher({
  showRateBadge = true,
  className,
  compact = false,
}: CurrencySwitcherProps) {
  const {
    currency,
    setCurrency,
    exchangeRate,
    isCustomRate,
    isLoadingRate,
    lastUpdated,
    setCustomExchangeRate,
    resetToLiveRate,
    refreshLiveRate,
  } = useCurrency();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customInput, setCustomInput] = useState(exchangeRate.toFixed(2));
  const modalRef = useRef<HTMLDivElement>(null);

  // Sync custom input when exchangeRate changes
  useEffect(() => {
    setCustomInput(exchangeRate.toFixed(2));
  }, [exchangeRate]);

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsModalOpen(false);
      }
    }
    if (isModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isModalOpen]);

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(customInput);
    if (!isNaN(val) && val > 0) {
      setCustomExchangeRate(val);
      setIsModalOpen(false);
    }
  };

  return (
    <div className={cn("relative flex items-center gap-2", className)}>
      {/* Segmented Currency Toggle */}
      <div className="flex items-center bg-muted-bg/80 p-1 rounded-xl border border-border/80 shadow-sm backdrop-blur-md">
        <button
          type="button"
          onClick={() => setCurrency("USD")}
          className={cn(
            "flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer",
            currency === "USD"
              ? "bg-card-bg text-accent shadow-md border border-border/60 scale-[1.02]"
              : "text-muted hover:text-foreground"
          )}
          title="Display prices in US Dollars ($)"
        >
          <span>$</span>
          {!compact && <span>USD</span>}
        </button>
        <button
          type="button"
          onClick={() => setCurrency("THB")}
          className={cn(
            "flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer",
            currency === "THB"
              ? "bg-card-bg text-accent shadow-md border border-border/60 scale-[1.02]"
              : "text-muted hover:text-foreground"
          )}
          title="Display prices in Thai Baht (฿)"
        >
          <span>฿</span>
          {!compact && <span>THB</span>}
        </button>
      </div>

      {/* Live Exchange Rate Button / Info */}
      {showRateBadge && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsModalOpen((prev) => !prev)}
            className={cn(
              "hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-mono border transition-all cursor-pointer",
              isCustomRate
                ? "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/15"
                : "bg-muted-bg/50 text-muted hover:text-foreground border-border/60 hover:border-border"
            )}
            title="Exchange Rate Settings & Info"
          >
            <span className="flex h-1.5 w-1.5 relative">
              {isLoadingRate ? (
                <span className="animate-spin h-1.5 w-1.5 rounded-full border border-accent border-t-transparent" />
              ) : isCustomRate ? (
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              ) : (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </>
              )}
            </span>
            <span>
              1$ ≈ {exchangeRate.toFixed(2)}฿
            </span>
            {isCustomRate && (
              <span className="text-[9px] uppercase font-bold bg-amber-500/20 px-1 rounded">
                Custom
              </span>
            )}
          </button>

          {/* Rate Settings Popover */}
          {isModalOpen && (
            <div
              ref={modalRef}
              className="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl border border-border/90 bg-card-bg/95 backdrop-blur-2xl p-4 shadow-2xl z-50 animate-fade-in-up"
            >
              <div className="flex items-center justify-between mb-3 border-b border-border/40 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-accent/10 text-accent">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </span>
                  <h4 className="text-xs font-bold text-foreground">
                    อัตราแลกเปลี่ยน (USD/THB)
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-muted hover:text-foreground text-xs p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Status Row */}
              <div className="flex items-center justify-between text-xs mb-3 bg-muted-bg/60 p-2.5 rounded-xl border border-border/40">
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted uppercase font-semibold">
                    {isCustomRate ? "Custom Rate Set" : "Live Yahoo Finance"}
                  </span>
                  <span className="text-sm font-mono font-extrabold text-foreground">
                    1 USD = {exchangeRate.toFixed(2)} THB
                  </span>
                </div>
                <button
                  type="button"
                  onClick={refreshLiveRate}
                  disabled={isLoadingRate}
                  className="p-1.5 text-accent hover:bg-accent/10 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                  title="รีเฟรชเรทเงินล่าสุด"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={cn(isLoadingRate && "animate-spin")}
                  >
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                  </svg>
                </button>
              </div>

              {lastUpdated && (
                <p className="text-[10px] text-muted mb-3 font-mono">
                  อัปเดตล่าสุด: {lastUpdated}
                </p>
              )}

              {/* Custom Rate Form */}
              <form onSubmit={handleSaveCustom} className="space-y-2.5">
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-muted">
                  กำหนดเรทแลกเปลี่ยนเอง (THB/USD)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max="200"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs font-mono rounded-lg bg-input-bg border border-input-border text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                    placeholder="e.g. 34.50"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-bold bg-accent text-white rounded-lg hover:bg-accent/90 transition-all shadow-sm cursor-pointer"
                  >
                    บันทึก
                  </button>
                </div>
              </form>

              {isCustomRate && (
                <div className="mt-3 pt-2.5 border-t border-border/40">
                  <button
                    type="button"
                    onClick={resetToLiveRate}
                    className="w-full text-center text-xs text-accent hover:underline font-semibold cursor-pointer"
                  >
                    ↺ กลับไปใช้อัตราแลกเปลี่ยนตามจริง (Live Rate)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
