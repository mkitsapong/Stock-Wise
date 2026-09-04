"use client";

import { useState } from "react";
import { useTransactions } from "@/context/TransactionContext";
import type { Transaction } from "@/context/TransactionContext";
import { useCurrency } from "@/context/CurrencyContext";
import { formatNumber, cn } from "@/lib/utils";
import CompanyLogo from "@/components/common/CompanyLogo";
import AddTransactionModal from "./AddTransactionModal";

export default function TransactionTable() {
  const { transactions, deleteTransaction, portfolios, activePortfolioId } = useTransactions();
  const { formatCurrency, exchangeRate } = useCurrency();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Group transactions by date
  const grouped = transactions.reduce<Record<string, Transaction[]>>((acc, tx) => {
    if (!acc[tx.date]) acc[tx.date] = [];
    acc[tx.date].push(tx);
    return acc;
  }, {});

  const dateGroups = Object.entries(grouped).sort(
    ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
  );

  const getPortfolioInfo = (portfolioId?: string) => {
    const p = portfolios.find((item) => item.id === (portfolioId || "growth"));
    return p || { name: "Growth", color: "#10b981" };
  };

  return (
    <>
      <div className="glass-card overflow-hidden animate-fade-in-up opacity-0 stagger-2">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/80 bg-muted-bg/30">
                <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted">
                  Date
                </th>
                <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted">
                  Type
                </th>
                <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted">
                  Asset
                </th>
                {activePortfolioId === "ALL" && (
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted">
                    Portfolio
                  </th>
                )}
                <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-muted">
                  Shares
                </th>
                <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-muted">
                  Price
                </th>
                <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-muted">
                  Total
                </th>
                <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-muted w-28">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y border-border/40">
              {dateGroups.map(([date, txs]) =>
                txs.map((tx, idx) => {
                  const portInfo = getPortfolioInfo(tx.portfolioId);
                  const priceUSD = tx.priceUSD ?? (tx.currency === "THB" ? tx.price / exchangeRate : tx.price);
                  const totalUSD = tx.shares * priceUSD;

                  return (
                    <tr key={tx.id} className="table-row-hover group">
                      <td className="px-5 py-4 text-sm text-muted font-medium">
                        {idx === 0
                          ? new Date(date + (date.includes("T") ? "" : "T00:00:00")).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : ""}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            "text-[10px] font-bold uppercase px-2.5 py-1 rounded-md border font-mono",
                            tx.type === "BUY"
                              ? "bg-profit/10 text-profit border-profit/20"
                              : "bg-loss/10 text-loss border-loss/20"
                          )}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <CompanyLogo symbol={tx.symbol} name={tx.name} size="sm" />
                          <div>
                            <span className="text-sm font-bold font-mono text-foreground block">
                              {tx.symbol}
                            </span>
                            {tx.name && tx.name !== tx.symbol && (
                              <span className="text-xs text-muted truncate max-w-[150px] block">
                                {tx.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {activePortfolioId === "ALL" && (
                        <td className="px-5 py-4">
                          <span
                            style={{
                              backgroundColor: `${portInfo.color}15`,
                              borderColor: `${portInfo.color}35`,
                              color: portInfo.color,
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold font-mono border"
                          >
                            <span
                              style={{ backgroundColor: portInfo.color }}
                              className="w-1.5 h-1.5 rounded-full"
                            />
                            <span>{portInfo.name}</span>
                          </span>
                        </td>
                      )}

                      <td className="px-5 py-4 text-right font-mono text-sm text-foreground tabular-nums">
                        {formatNumber(tx.shares)}
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-sm text-muted tabular-nums">
                        {formatCurrency(priceUSD)}
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-sm font-semibold text-foreground tabular-nums">
                        {formatCurrency(totalUSD)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Button */}
                          <button
                            onClick={() => setEditingTransaction(tx)}
                            className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-accent/10 transition-all cursor-pointer"
                            title="Edit Transaction"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                              <path d="m15 5 4 4" />
                            </svg>
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete ${tx.type} transaction for ${tx.symbol}?`)) {
                                deleteTransaction(tx.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-muted hover:text-loss hover:bg-loss/10 transition-all cursor-pointer"
                            title="Delete Transaction"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18" />
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {transactions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted">
                No transactions found in this portfolio. Click "Add Transaction" above to start logging.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <AddTransactionModal
        isOpen={Boolean(editingTransaction)}
        onClose={() => setEditingTransaction(null)}
        initialTransaction={editingTransaction}
      />
    </>
  );
}
