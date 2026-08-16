"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

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
  name: string;
  shares: number;
  avgCost: number;
  totalInvested: number;
  currentPrice?: number;
  dayChange?: number;
  dayChangePercent?: number;
  sector?: string;
  hasDividend?: boolean;
  dividendYield?: number;
  lastDividendDate?: string;
  annualDividend?: number;
}

interface TransactionContextType {
  transactions: Transaction[];
  holdings: Holding[];
  isLoading: boolean;
  syncStatus: "synced" | "syncing" | "local" | "error";
  addTransaction: (tx: Omit<Transaction, "id" | "total">) => Promise<void>;
  editTransaction: (id: string, tx: Omit<Transaction, "id" | "total">) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const { user, isConfigured } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "local" | "error">("local");

  // Fetch transactions based on Auth state
  const loadTransactions = useCallback(async () => {
    setIsLoading(true);

    if (user && supabase && isConfigured) {
      setSyncStatus("syncing");
      try {
        // Fetch user's transactions from Supabase
        const { data, error } = await supabase
          .from("transactions")
          .select("*")
          .order("date", { ascending: false });

        if (error) {
          console.error("Error fetching transactions from Supabase:", error);
          setSyncStatus("error");
          // Fallback to local
          const saved = localStorage.getItem("stockwise_transactions");
          if (saved) setTransactions(JSON.parse(saved));
        } else if (data) {
          const mapped: Transaction[] = data.map((item) => ({
            id: item.id,
            date: item.date,
            type: item.type as "BUY" | "SELL",
            symbol: item.symbol,
            name: item.name || item.symbol,
            shares: Number(item.shares),
            price: Number(item.price),
            total: Number(item.total),
          }));

          // Check if there are local guest transactions to migrate to cloud
          const saved = localStorage.getItem("stockwise_transactions");
          if (saved) {
            try {
              const localTxs: Transaction[] = JSON.parse(saved);
              if (localTxs.length > 0 && mapped.length === 0) {
                // Migrate local items to Supabase
                const toInsert = localTxs.map((tx) => ({
                  id: tx.id,
                  user_id: user.id,
                  date: tx.date,
                  type: tx.type,
                  symbol: tx.symbol,
                  name: tx.name || tx.symbol,
                  shares: tx.shares,
                  price: tx.price,
                  total: tx.total || tx.shares * tx.price,
                }));
                const { error: insertErr } = await supabase.from("transactions").insert(toInsert);
                if (!insertErr) {
                  localStorage.removeItem("stockwise_transactions");
                  setTransactions(localTxs);
                  setSyncStatus("synced");
                  setIsLoaded(true);
                  setIsLoading(false);
                  return;
                }
              }
            } catch (e) {
              console.warn("Failed to migrate local transactions", e);
            }
          }

          setTransactions(mapped);
          setSyncStatus("synced");
        }
      } catch (err) {
        console.error("Supabase load error:", err);
        setSyncStatus("error");
      }
    } else {
      // Guest Mode: load from localStorage
      setSyncStatus("local");
      try {
        const saved = localStorage.getItem("stockwise_transactions");
        if (saved) {
          setTransactions(JSON.parse(saved));
        }
      } catch (e) {
        console.error("Failed to load local transactions", e);
      }
    }

    setIsLoaded(true);
    setIsLoading(false);
  }, [user, isConfigured]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Save to localStorage when in Guest Mode
  useEffect(() => {
    if (isLoaded && !user) {
      localStorage.setItem("stockwise_transactions", JSON.stringify(transactions));
    }
  }, [transactions, isLoaded, user]);

  const addTransaction = async (tx: Omit<Transaction, "id" | "total">) => {
    const newId = (typeof crypto !== "undefined" && crypto.randomUUID) 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2, 11);

    const newTx: Transaction = {
      ...tx,
      id: newId,
      total: tx.shares * tx.price,
    };

    // Optimistic UI update
    setTransactions((prev) => [newTx, ...prev]);

    if (user && supabase && isConfigured) {
      try {
        setSyncStatus("syncing");
        const { error } = await supabase.from("transactions").insert({
          id: newTx.id,
          user_id: user.id,
          date: newTx.date,
          type: newTx.type,
          symbol: newTx.symbol,
          name: newTx.name || newTx.symbol,
          shares: newTx.shares,
          price: newTx.price,
          total: newTx.total,
        });

        if (error) {
          console.error("Failed to insert transaction in Supabase:", error);
          setSyncStatus("error");
        } else {
          setSyncStatus("synced");
        }
      } catch (e) {
        console.error("Supabase insert error:", e);
        setSyncStatus("error");
      }
    }
  };

  const editTransaction = async (id: string, updated: Omit<Transaction, "id" | "total">) => {
    const updatedTx: Transaction = {
      ...updated,
      id,
      total: updated.shares * updated.price,
    };

    // Optimistic UI update
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? updatedTx : tx))
    );

    if (user && supabase && isConfigured) {
      try {
        setSyncStatus("syncing");
        const { error } = await supabase
          .from("transactions")
          .update({
            date: updatedTx.date,
            type: updatedTx.type,
            symbol: updatedTx.symbol,
            name: updatedTx.name || updatedTx.symbol,
            shares: updatedTx.shares,
            price: updatedTx.price,
            total: updatedTx.total,
          })
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) {
          console.error("Failed to update transaction in Supabase:", error);
          setSyncStatus("error");
        } else {
          setSyncStatus("synced");
        }
      } catch (e) {
        console.error("Supabase update error:", e);
        setSyncStatus("error");
      }
    }
  };

  const deleteTransaction = async (id: string) => {
    // Optimistic UI update
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));

    if (user && supabase && isConfigured) {
      try {
        setSyncStatus("syncing");
        const { error } = await supabase
          .from("transactions")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) {
          console.error("Failed to delete transaction in Supabase:", error);
          setSyncStatus("error");
        } else {
          setSyncStatus("synced");
        }
      } catch (e) {
        console.error("Supabase delete error:", e);
        setSyncStatus("error");
      }
    }
  };

  // Compute holdings based on transactions
  const holdings = useMemo(() => {
    const holdingsMap: Record<string, { shares: number; totalCost: number; name: string }> = {};

    // Process from oldest to newest to correctly calculate average cost
    const chronologicalTxs = [...transactions].reverse();

    chronologicalTxs.forEach((tx) => {
      if (!holdingsMap[tx.symbol]) {
        holdingsMap[tx.symbol] = { shares: 0, totalCost: 0, name: tx.name || tx.symbol };
      }

      const holding = holdingsMap[tx.symbol];
      if (tx.name && tx.name !== tx.symbol) {
        holding.name = tx.name;
      }

      if (tx.type === "BUY") {
        holding.shares += tx.shares;
        holding.totalCost += tx.shares * tx.price;
      } else if (tx.type === "SELL") {
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
        name: data.name || symbol,
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
        isLoading,
        syncStatus,
        addTransaction,
        editTransaction,
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
