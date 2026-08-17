"use client";

import { useState, useEffect } from "react";
import { useCurrency } from "@/context/CurrencyContext";
import { formatNumber, formatPercent, cn } from "@/lib/utils";
import CompanyLogo from "@/components/common/CompanyLogo";

interface AverageCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  name?: string;
  currentShares: number;
  currentAvgCost: number;
  currentPrice?: number;
}

export default function AverageCalculatorModal({
  isOpen,
  onClose,
  symbol,
  name,
  currentShares,
  currentAvgCost,
  currentPrice,
}: AverageCalculatorModalProps) {
  const { formatCurrency } = useCurrency();
  const [buyShares, setBuyShares] = useState<string>("");
  const [buyPrice, setBuyPrice] = useState<string>("");
  const [buyAmount, setBuyAmount] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setBuyShares("");
      setBuyAmount("");
      if (currentPrice && currentPrice > 0) {
        setBuyPrice(currentPrice.toString());
      } else {
        setBuyPrice("");
      }
    }
  }, [isOpen, currentPrice]);

  if (!isOpen) return null;

  const handleSharesChange = (val: string) => {
    setBuyShares(val);
    const shares = parseFloat(val) || 0;
    const price = parseFloat(buyPrice) || 0;
    if (shares > 0 && price > 0) {
      setBuyAmount((shares * price).toFixed(2));
    } else {
      setBuyAmount("");
    }
  };

  const handleAmountChange = (val: string) => {
    setBuyAmount(val);
    const amount = parseFloat(val) || 0;
    const price = parseFloat(buyPrice) || 0;
    if (amount > 0 && price > 0) {
      setBuyShares((amount / price).toFixed(6));
    } else {
      setBuyShares("");
    }
  };

  const handlePriceChange = (val: string) => {
    setBuyPrice(val);
    const price = parseFloat(val) || 0;
    const amount = parseFloat(buyAmount) || 0;
    // If we have an amount, re-calculate shares
    if (amount > 0 && price > 0) {
      setBuyShares((amount / price).toFixed(6));
    } else {
      // otherwise, if we only have shares, re-calculate amount
      const shares = parseFloat(buyShares) || 0;
      if (shares > 0 && price > 0) {
        setBuyAmount((shares * price).toFixed(2));
      }
    }
  };

  const numBuyShares = parseFloat(buyShares) || 0;
  const numBuyPrice = parseFloat(buyPrice) || 0;

  const currentTotalValue = currentShares * currentAvgCost;
  const additionalValue = numBuyShares * numBuyPrice;

  const newTotalShares = currentShares + numBuyShares;
  const newTotalCost = currentTotalValue + additionalValue;
  const newAvgCost = newTotalShares > 0 ? newTotalCost / newTotalShares : currentAvgCost;

  const diffAvg = newAvgCost - currentAvgCost;
  const diffPercent = currentAvgCost > 0 ? (diffAvg / currentAvgCost) * 100 : 0;
  
  const isAveragingDown = diffAvg < 0;
  const isAveragingUp = diffAvg > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="glass-card relative w-full max-w-md rounded-3xl border border-border/80 shadow-2xl overflow-hidden animate-zoom-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <CompanyLogo symbol={symbol} size="md" className="rounded-xl shadow-sm" />
            <div>
              <h2 className="text-lg font-bold text-foreground">Average Price Calculator</h2>
              <p className="text-xs text-muted font-medium">Simulate buying more {symbol}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted hover:text-foreground hover:bg-white/5 rounded-full transition-colors cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-6">
          
          {/* Current Status */}
          <div className="bg-muted-bg/30 p-4 rounded-2xl border border-border/40 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted font-medium mb-1">Current Shares</p>
              <p className="text-sm font-bold font-mono text-foreground">{formatNumber(currentShares)}</p>
            </div>
            <div>
              <p className="text-xs text-muted font-medium mb-1">Current Avg Cost</p>
              <p className="text-sm font-bold font-mono text-foreground">{formatCurrency(currentAvgCost)}</p>
            </div>
          </div>

          {/* Input Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-semibold text-muted">Total Amount ($)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={buyAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="e.g. 50.00"
                  className="w-full bg-card-bg/80 border border-border/80 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted">Or Buy Shares</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={buyShares}
                  onChange={(e) => handleSharesChange(e.target.value)}
                  placeholder="e.g. 100"
                  className="w-full bg-card-bg/80 border border-border/80 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted">At Price</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={buyPrice}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  placeholder="e.g. 150.50"
                  className="w-full bg-card-bg/80 border border-border/80 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Result Banner */}
          <div className={cn(
            "p-5 rounded-2xl border flex flex-col items-center justify-center text-center transition-all duration-300",
            numBuyShares > 0 && numBuyPrice > 0
              ? isAveragingDown
                ? "bg-profit/10 border-profit/20"
                : isAveragingUp
                ? "bg-loss/10 border-loss/20"
                : "bg-accent/10 border-accent/20"
              : "bg-muted-bg/20 border-border/40 grayscale"
          )}>
            <p className="text-xs font-semibold text-muted mb-1 uppercase tracking-wider">New Average Cost</p>
            <p className="text-3xl font-extrabold font-mono text-foreground mb-2">
              {formatCurrency(newAvgCost)}
            </p>
            
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="text-muted">New Total Shares: <span className="font-mono text-foreground">{formatNumber(newTotalShares)}</span></span>
            </div>

            {numBuyShares > 0 && numBuyPrice > 0 && diffAvg !== 0 && (
              <div className={cn(
                "mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border",
                isAveragingDown ? "text-profit bg-profit/10 border-profit/20" : "text-loss bg-loss/10 border-loss/20"
              )}>
                {isAveragingDown ? "↓ Average Down" : "↑ Average Up"}
                <span className="opacity-80">
                  ({diffAvg > 0 ? "+" : ""}{formatCurrency(diffAvg)} / {formatPercent(diffPercent)})
                </span>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 border-t border-border/50 bg-muted-bg/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-sm shadow-lg shadow-accent/20 transition-all active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
