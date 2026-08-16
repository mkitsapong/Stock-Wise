"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useTransactions, type Transaction } from "@/context/TransactionContext";
import { useCurrency } from "@/context/CurrencyContext";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialTransaction?: Transaction | null;
}

export default function AddTransactionModal({ isOpen, onClose, initialTransaction }: Props) {
  const { addTransaction, editTransaction } = useTransactions();
  const { formatCurrency, currency, exchangeRate, currencySymbol } = useCurrency();
  
  const [type, setType] = useState<"BUY" | "SELL">("BUY");
  const [symbol, setSymbol] = useState("");
  const [assetName, setAssetName] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [shares, setShares] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Sync state when initialTransaction changes or modal opens
  useEffect(() => {
    if (initialTransaction) {
      setType(initialTransaction.type);
      setSymbol(initialTransaction.symbol);
      setAssetName(initialTransaction.name || "");
      setShares(String(initialTransaction.shares));
      setPrice(String(initialTransaction.price));
      setDate(initialTransaction.date);
    } else {
      setType("BUY");
      setSymbol("");
      setAssetName("");
      setShares("");
      setPrice("");
      setDate(new Date().toISOString().split("T")[0]);
    }
  }, [initialTransaction, isOpen]);

  // Auto-fetch company name based on symbol (only when adding or user changes symbol)
  useEffect(() => {
    if (initialTransaction && initialTransaction.symbol === symbol.trim().toUpperCase()) {
      return;
    }
    
    const timer = setTimeout(async () => {
      if (symbol.trim().length > 0) {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(symbol.trim())}`);
          if (res.ok) {
            const data = await res.json();
            const quotes = data.quotes || [];
            const match = quotes.find((q: any) => q.symbol.toUpperCase() === symbol.trim().toUpperCase()) || quotes[0];
            if (match) {
              setAssetName(match.shortname || match.longname || match.symbol);
            } else {
              setAssetName("");
            }
          }
        } catch (e) {
          // Quietly fail
        } finally {
          setIsSearching(false);
        }
      } else {
        setAssetName("");
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [symbol, initialTransaction]);

  if (!isOpen) return null;

  const isEditing = !!initialTransaction;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !shares || !price || !date) return;
    
    const payload = {
      type,
      symbol: symbol.trim().toUpperCase(),
      name: assetName || symbol.trim().toUpperCase(),
      shares: Number(shares),
      price: Number(price),
      date,
    };

    if (isEditing && initialTransaction) {
      editTransaction(initialTransaction.id, payload);
    } else {
      addTransaction(payload);
    }
    
    onClose();
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
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center text-white",
              isEditing ? "bg-accent" : "bg-gradient-to-r from-accent to-purple-500"
            )}>
              {isEditing ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              )}
            </div>
            <h2 className="text-xl font-bold text-foreground">
              {isEditing ? "Edit Transaction" : "Add Transaction"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-muted-bg transition-all cursor-pointer"
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
            <div className="relative">
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g. NFLX"
                required
                className="w-full px-4 py-3 rounded-xl bg-input-bg border border-input-border text-foreground text-sm font-mono placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                   <svg className="h-4 w-4 animate-spin text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                </div>
              )}
            </div>
            {assetName && !isSearching && (
              <p className="text-xs text-accent mt-1.5 ml-1 animate-fade-in-up">
                {assetName}
              </p>
            )}
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
                step="0.000000001"
                className="w-full px-4 py-3 rounded-xl bg-input-bg border border-input-border text-foreground text-sm font-mono placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                Price ($ USD)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                required
                min="0"
                step="0.000000001"
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
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted block">Total Investment</span>
                  <span className="text-xl font-bold font-mono text-foreground">
                    {formatCurrency(total)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted block font-mono">
                    {currency === "THB" ? "USD Equivalent" : "THB Equivalent"}
                  </span>
                  <span className="text-sm font-mono font-semibold text-muted/90">
                    {currency === "THB"
                      ? `$${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : `฿${(total * exchangeRate).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </span>
                </div>
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
