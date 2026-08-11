"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddTransactionModal({ isOpen, onClose }: Props) {
  const [type, setType] = useState<"BUY" | "SELL">("BUY");
  const [symbol, setSymbol] = useState("");
  const [shares, setShares] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would save the transaction
    alert(
      `Transaction saved!\n${type} ${shares} shares of ${symbol.toUpperCase()} at $${price} on ${date}`
    );
    onClose();
    setSymbol("");
    setShares("");
    setPrice("");
    setType("BUY");
  };

  const total = Number(shares) * Number(price);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="glass-card w-full max-w-md mx-4 p-6 sm:p-8 animate-fade-in-up shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Add Transaction</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-muted-bg transition-all"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Buy/Sell Toggle */}
          <div className="flex gap-2 p-1 bg-muted-bg rounded-xl">
            <button
              type="button"
              onClick={() => setType("BUY")}
              className={cn(
                "flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200",
                type === "BUY"
                  ? "bg-profit text-white shadow-md"
                  : "text-muted hover:text-foreground"
              )}
            >
              Buy
            </button>
            <button
              type="button"
              onClick={() => setType("SELL")}
              className={cn(
                "flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200",
                type === "SELL"
                  ? "bg-loss text-white shadow-md"
                  : "text-muted hover:text-foreground"
              )}
            >
              Sell
            </button>
          </div>

          {/* Symbol */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
              Symbol
            </label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="e.g. NFLX"
              required
              className="w-full px-4 py-3 rounded-xl bg-input-bg border border-input-border text-foreground text-sm font-mono placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
            />
          </div>

          {/* Shares and Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                Shares
              </label>
              <input
                type="number"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder="0"
                required
                min="0"
                step="1"
                className="w-full px-4 py-3 rounded-xl bg-input-bg border border-input-border text-foreground text-sm font-mono placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                Price ($)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-3 rounded-xl bg-input-bg border border-input-border text-foreground text-sm font-mono placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-input-bg border border-input-border text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
            />
          </div>

          {/* Total Preview */}
          {shares && price && (
            <div className="p-4 rounded-xl bg-muted-bg/50 border border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Total</span>
                <span className="text-xl font-bold font-mono text-foreground">
                  ${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className={cn(
              "w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl active:scale-[0.98]",
              type === "BUY"
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                : "bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700"
            )}
          >
            {type === "BUY" ? "Confirm Purchase" : "Confirm Sale"}
          </button>
        </form>
      </div>
    </div>
  );
}
