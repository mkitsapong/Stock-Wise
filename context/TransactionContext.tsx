"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";

export interface Transaction {
  id: string;
  date: string;
  type: "BUY" | "SELL";
  symbol: string;
  name?: string;
  shares: number;
  price: number;
  total: number;
}

export interface Holding {
  symbol: string;
  name: string; // Might need to fetch or guess name
  shares: number;
  avgCost: number;
  totalInvested: number;
  // Note: currentPrice, dailyChange, totalValue, etc., will be fetched from API
}

interface TransactionContextType {
  transactions: Transaction[];
  holdings: Holding[];
  addTransaction: (tx: Omit<Transaction, "id" | "total">) => void;
  deleteTransaction: (id: string) => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("stockwise_transactions");
      if (saved) {
        setTransactions(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load transactions", e);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("stockwise_transactions", JSON.stringify(transactions));
    }
  }, [transactions, isLoaded]);

  const addTransaction = (tx: Omit<Transaction, "id" | "total">) => {
    const newTx: Transaction = {
      ...tx,
      id: Math.random().toString(36).substr(2, 9),
      total: tx.shares * tx.price,
    };
    // Prepend so newest is first
    setTransactions((prev) => [newTx, ...prev]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  };

  // Compute holdings based on transactions
  const holdings = useMemo(() => {
    const holdingsMap: Record<string, { shares: number; totalCost: number; name: string }> = {};

    // Process from oldest to newest to correctly calculate average cost
    // Since our array has newest first (prepended), we reverse a copy to process
    const chronologicalTxs = [...transactions].reverse();

    chronologicalTxs.forEach((tx) => {
      if (!holdingsMap[tx.symbol]) {
        holdingsMap[tx.symbol] = { shares: 0, totalCost: 0, name: tx.name || tx.symbol };
      }

      const holding = holdingsMap[tx.symbol];
      if (tx.name && tx.name !== tx.symbol) {
        holding.name = tx.name; // Keep the latest name
      }

      if (tx.type === "BUY") {
        holding.shares += tx.shares;
        holding.totalCost += tx.shares * tx.price;
      } else if (tx.type === "SELL") {
        // We do not change totalCost directly by sell amount if we want avg cost to remain same
        // But for simplicity of total invested, we subtract the proportionate cost
        if (holding.shares > 0) {
          const avgCost = holding.totalCost / holding.shares;
          holding.shares -= tx.shares;
          holding.totalCost -= tx.shares * avgCost;
          
          if (holding.shares <= 0) {
            holding.shares = 0;
            holding.totalCost = 0;
          }
        }
      }
    });

    return Object.entries(holdingsMap)
      .filter(([_, data]) => data.shares > 0)
      .map(([symbol, data]) => ({
        symbol,
        name: data.name || symbol, // Use name from transaction if available
        shares: data.shares,
        avgCost: data.totalCost / data.shares,
        totalInvested: data.totalCost,
      }));
  }, [transactions]);

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        holdings,
        addTransaction,
        deleteTransaction,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error("useTransactions must be used within a TransactionProvider");
  }
  return context;
}
