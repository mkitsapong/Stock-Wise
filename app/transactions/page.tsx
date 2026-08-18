"use client";

import { useState, useMemo } from "react";
import TransactionTable from "@/components/transactions/TransactionTable";
import AddTransactionModal from "@/components/transactions/AddTransactionModal";
import PortfolioSwitcher from "@/components/portfolio/PortfolioSwitcher";
import { useTransactions } from "@/context/TransactionContext";
import { useCurrency } from "@/context/CurrencyContext";
import { exportTransactionsCSV, exportPLSummaryCSV } from "@/lib/export-csv";
import { cn } from "@/lib/utils";

export default function TransactionsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const { transactions } = useTransactions();
  const { currency, exchangeRate, formatCurrency } = useCurrency();

  const handleExportTransactions = () => {
    exportTransactionsCSV(transactions, currency, exchangeRate);
    setExportMenuOpen(false);
  };

  const handleExportPL = () => {
    exportPLSummaryCSV(transactions, exchangeRate);
    setExportMenuOpen(false);
  };

  // Compute transaction summary statistics
  const { totalBuyValue, totalSellValue, buyCount, sellCount, uniqueSymbolsCount } = useMemo(() => {
    let buyVal = 0;
    let sellVal = 0;
    let buys = 0;
    let sells = 0;
    const symbols = new Set<string>();

    transactions.forEach((tx) => {
      const price = tx.priceUSD || tx.price || 0;
      const total = tx.shares * price;
      symbols.add(tx.symbol);

      if (tx.type === "BUY") {
        buyVal += total;
        buys++;
      } else {
        sellVal += total;
        sells++;
      }
    });

    return {
      totalBuyValue: buyVal,
      totalSellValue: sellVal,
      buyCount: buys,
      sellCount: sells,
      uniqueSymbolsCount: symbols.size,
    };
  }, [transactions]);

  const buyPercentage = transactions.length > 0
    ? Math.round((buyCount / transactions.length) * 100)
    : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* 🌟 1. Standardized Page Header */}
      <div className="animate-fade-in-up opacity-0 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight gradient-text inline-block">
              Transactions
            </h1>
            <span className="px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent font-mono text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shrink-0" />
              <span>{transactions.length} {transactions.length === 1 ? "Record" : "Records"}</span>
            </span>
          </div>
          <p className="text-sm text-muted mt-1 font-medium">
            Complete chronological audit log of buy, sell & rebalancing operations
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Export CSV Dropdown */}
          <div className="relative">
            <button
              id="export-csv-btn"
              onClick={() => setExportMenuOpen((v) => !v)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-card-bg border border-border/80 text-foreground text-sm font-semibold hover:border-accent/50 hover:text-accent transition-all duration-200 active:scale-[0.98] cursor-pointer shadow-sm"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span className="hidden sm:inline">Export</span>
            </button>

            {exportMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setExportMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 z-50 rounded-2xl border border-border/80 bg-card-bg/95 backdrop-blur-2xl p-2 shadow-2xl animate-fade-in-up">
                  <button
                    id="export-all-transactions-btn"
                    onClick={handleExportTransactions}
                    className="w-full flex items-start gap-3 px-3 py-2.5 text-left rounded-xl hover:bg-accent/10 transition-colors group cursor-pointer"
                  >
                    <svg className="w-4 h-4 mt-0.5 text-accent shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <p className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors">All Transactions</p>
                      <p className="text-[10px] text-muted mt-0.5">Full CSV with USD & THB values</p>
                    </div>
                  </button>

                  <button
                    id="export-pl-summary-btn"
                    onClick={handleExportPL}
                    className="w-full flex items-start gap-3 px-3 py-2.5 text-left rounded-xl hover:bg-accent/10 transition-colors group cursor-pointer"
                  >
                    <svg className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors">Realized P&L Summary</p>
                      <p className="text-[10px] text-muted mt-0.5">Realized gains breakdown (FIFO)</p>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Add Transaction */}
          <button
            id="add-transaction-btn"
            onClick={() => setModalOpen(true)}
            className="btn-shine-sweep flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-accent to-purple-500 hover:from-accent/90 hover:to-purple-500/90 text-white text-sm font-semibold shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* 🌟 2. Hero KPI Cards Grid (Matching Dashboard Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Deployed Capital */}
        <div className="p-5 rounded-2xl animate-fade-in-up opacity-0 relative overflow-hidden transition-all duration-300 group bg-gradient-to-br from-accent/15 via-card-bg to-purple-500/10 border border-accent/30 shadow-[0_4px_24px_rgba(99,102,241,0.12)] hover:border-accent/50 stagger-1">
          <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-[40px] pointer-events-none bg-accent/25 opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">
              Total Capital Deployed
            </span>
            <span className="p-2 rounded-xl border bg-accent/10 text-accent border-accent/20 group-hover:scale-105 transition-transform">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </span>
          </div>
          <div className="relative z-10">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight tabular-nums text-foreground">
              {formatCurrency(totalBuyValue)}
            </div>
          </div>
          <div className="relative z-10 mt-1.5 flex items-center justify-between text-xs text-muted">
            <span>Sold Volume: {formatCurrency(totalSellValue)}</span>
          </div>
        </div>

        {/* Card 2: Order Activity & Split */}
        <div className="glass-card p-5 rounded-2xl animate-fade-in-up opacity-0 relative overflow-hidden transition-all duration-300 group hover:border-border/80 stagger-2">
          <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-[40px] pointer-events-none bg-profit/15 opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Order Activity Split
            </span>
            <span className="p-2 rounded-xl border bg-profit/10 text-profit border-profit/20 group-hover:scale-105 transition-transform">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </span>
          </div>
          <div className="relative z-10 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight tabular-nums text-profit">
              {buyCount} <span className="text-xs font-sans font-bold text-muted uppercase">Buys</span>
            </span>
            <span className="text-muted/40 font-mono">/</span>
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight tabular-nums text-loss">
              {sellCount} <span className="text-xs font-sans font-semibold text-muted uppercase">Sells</span>
            </span>
          </div>
          <div className="relative z-10 mt-1.5 flex items-center gap-1.5">
            <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded-md bg-accent/10 text-accent">
              {buyPercentage}% Buys
            </span>
            <span className="text-xs text-muted">execution ratio</span>
          </div>
        </div>

        {/* Card 3: Asset Breadth & Trades */}
        <div className="glass-card p-5 rounded-2xl animate-fade-in-up opacity-0 relative overflow-hidden transition-all duration-300 group hover:border-border/80 stagger-3">
          <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-[40px] pointer-events-none bg-accent/20 opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Trade Frequency & Scope
            </span>
            <span className="p-2 rounded-xl border bg-accent/10 text-accent border-accent/20 group-hover:scale-105 transition-transform">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </span>
          </div>
          <div className="relative z-10">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight tabular-nums text-foreground flex items-baseline gap-2">
              <span>{transactions.length}</span>
              <span className="text-sm font-sans font-medium text-muted">Total Trades</span>
            </div>
          </div>
          <div className="relative z-10 mt-1.5 flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-muted-bg text-foreground border border-border/60">
              {uniqueSymbolsCount} Tickers
            </span>
            <span className="text-xs text-muted">managed across strategies</span>
          </div>
        </div>
      </div>

      {/* 💼 Portfolio Strategy Filter Tabs */}
      <div className="animate-fade-in-up opacity-0 stagger-2">
        <PortfolioSwitcher variant="tabs" />
      </div>

      {/* 📋 Transaction Table */}
      <TransactionTable />

      {/* ➕ Add Transaction Modal */}
      <AddTransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
