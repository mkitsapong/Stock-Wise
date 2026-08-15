"use client";

import { useState } from "react";
import { useTransactions } from "@/context/TransactionContext";
import type { Transaction } from "@/context/TransactionContext";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";

export default function TransactionTable() {
  const { transactions, deleteTransaction } = useTransactions();

  // Group transactions by date
  const grouped = transactions.reduce<Record<string, Transaction[]>>((acc, tx) => {
    if (!acc[tx.date]) acc[tx.date] = [];
    acc[tx.date].push(tx);
    return acc;
  }, {});

  const dateGroups = Object.entries(grouped).sort(
    ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="glass-card overflow-hidden animate-fade-in-up opacity-0 stagger-2">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                Date
              </th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                Type
              </th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                Symbol
              </th>
              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted">
                Shares
              </th>
              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted">
                Price
              </th>
              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted">
                Total
              </th>
              <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-muted w-16">
              </th>
            </tr>
          </thead>
          <tbody>
            {dateGroups.map(([date, txs]) =>
              txs.map((tx, idx) => (
                <tr
                  key={tx.id}
                  className="border-b border-border/50 table-row-hover"
                >
                  <td className="px-5 py-4 text-sm text-muted">
                    {idx === 0
                      ? new Date(date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : ""}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "text-xs font-semibold uppercase px-2.5 py-1 rounded-lg",
                        tx.type === "BUY"
                          ? "bg-badge-buy-bg text-profit"
                          : "bg-badge-sell-bg text-loss"
                      )}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-accent">
                          {tx.symbol.slice(0, 2)}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">{tx.symbol}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-sm text-foreground">
                    {formatNumber(tx.shares)}
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-sm text-muted">
                    {formatCurrency(tx.price)}
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-sm font-semibold text-foreground">
                    {formatCurrency(tx.total)}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <button
                      onClick={() => deleteTransaction(tx.id)}
                      className="p-1.5 rounded-md text-muted hover:text-loss hover:bg-loss/10 transition-colors"
                      title="Delete Transaction"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {transactions.length === 0 && (
          <div className="text-center py-12">
             <p className="text-muted">No transactions found. Add a transaction to see your history.</p>
          </div>
        )}
      </div>
    </div>
  );
}
