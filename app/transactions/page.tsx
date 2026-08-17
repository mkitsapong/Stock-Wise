"use client";

import { useState } from "react";
import TransactionTable from "@/components/transactions/TransactionTable";
import AddTransactionModal from "@/components/transactions/AddTransactionModal";
import PortfolioSwitcher from "@/components/portfolio/PortfolioSwitcher";
import { useTransactions } from "@/context/TransactionContext";
import { useCurrency } from "@/context/CurrencyContext";
import { exportTransactionsCSV, exportPLSummaryCSV } from "@/lib/export-csv";

export default function TransactionsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const { transactions } = useTransactions();
  const { currency, exchangeRate } = useCurrency();

  const handleExportTransactions = () => {
    exportTransactionsCSV(transactions, currency, exchangeRate);
    setExportMenuOpen(false);
  };

  const handleExportPL = () => {
    exportPLSummaryCSV(transactions, exchangeRate);
    setExportMenuOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between animate-fade-in-up opacity-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Transactions
          </h1>
          <p className="text-sm text-muted mt-1">
            Complete history of all buy and sell activity
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Export CSV Dropdown */}
          <div className="relative">
            <button
              id="export-csv-btn"
              onClick={() => setExportMenuOpen((v) => !v)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-card-bg border border-border/60 text-foreground text-sm font-semibold hover:border-accent/50 hover:text-accent transition-all duration-200 active:scale-[0.98] cursor-pointer"
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
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setExportMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-52 z-50 rounded-2xl border border-border/80 bg-card-bg/95 backdrop-blur-2xl p-2 shadow-2xl animate-fade-in-up">
                  <button
                    id="export-all-transactions-btn"
                    onClick={handleExportTransactions}
                    className="w-full flex items-start gap-3 px-3 py-2.5 text-left rounded-xl hover:bg-accent/10 transition-colors group"
                  >
                    <svg className="w-4 h-4 mt-0.5 text-accent shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <p className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors">All Transactions</p>
                      <p className="text-[10px] text-muted mt-0.5">CSV with USD & THB columns</p>
                    </div>
                  </button>

                  <button
                    id="export-pl-summary-btn"
                    onClick={handleExportPL}
                    className="w-full flex items-start gap-3 px-3 py-2.5 text-left rounded-xl hover:bg-accent/10 transition-colors group"
                  >
                    <svg className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors">P&L Summary</p>
                      <p className="text-[10px] text-muted mt-0.5">Monthly realized gains (FIFO)</p>
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
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-accent to-purple-500 text-white text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="hidden sm:inline">Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Portfolio Filter Tabs */}
      <PortfolioSwitcher variant="tabs" />

      {/* Transaction Table */}
      <TransactionTable />

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
