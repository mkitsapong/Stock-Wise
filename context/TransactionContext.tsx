"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export type PortfolioStrategy = "GROWTH" | "DIVIDEND" | "TRADING" | "CUSTOM";

export interface Portfolio {
  id: string;
  name: string;
  strategy: PortfolioStrategy;
  color: string;
  description?: string;
  isDefault?: boolean;
}

export interface Transaction {
  id: string;
  portfolioId?: string; // Links transaction to a specific portfolio (default: "growth")
  currency?: "USD" | "THB";  // Currency the price was entered in (default: "USD")
  date: string;
  type: "BUY" | "SELL";
  symbol: string;
  name?: string;
  shares: number;
  price: number;          // Price in the transaction's currency
  priceUSD?: number;      // Price converted to USD (for portfolio calculations)
  total: number;          // Total in the transaction's currency
}

export interface Holding {
  symbol: string;
  name: string;
  shares: number;
  avgCost: number;
  totalInvested: number;
  portfolioId?: string;
  currentPrice?: number;
  dayChange?: number;
  dayChangePercent?: number;
  sector?: string;
  hasDividend?: boolean;
  dividendYield?: number;
  lastDividendDate?: string;
  annualDividend?: number;
}

export const DEFAULT_PORTFOLIOS: Portfolio[] = [
  {
    id: "growth",
    name: "Growth (เติบโต)",
    strategy: "GROWTH",
    color: "#10b981", // Emerald
    description: "เน้นหุ้นเติบโต & Capital Gain",
    isDefault: true,
  },
  {
    id: "dividend",
    name: "Dividend (ปันผล)",
    strategy: "DIVIDEND",
    color: "#3b82f6", // Blue
    description: "เน้นกระแสเงินสด & ปันผลสม่ำเสมอ",
  },
  {
    id: "trading",
    name: "Trading (เก็งกำไร)",
    strategy: "TRADING",
    color: "#f59e0b", // Amber
    description: "เน้นเทรดระยะสั้น & Swing Trade",
  },
];

interface TransactionContextType {
  // Portfolios
  portfolios: Portfolio[];
  activePortfolioId: string; // "ALL" or specific portfolio id
  activePortfolio: Portfolio | null;
  setActivePortfolioId: (id: string) => void;
  addPortfolio: (portfolio: Omit<Portfolio, "id">) => Promise<Portfolio>;
  editPortfolio: (id: string, portfolio: Partial<Portfolio>) => Promise<void>;
  deletePortfolio: (id: string) => Promise<void>;

  // Transactions & Holdings (Filtered by active portfolio)
  transactions: Transaction[];
  allTransactions: Transaction[];
  holdings: Holding[];
  allHoldings: Holding[];
  getPortfolioHoldings: (portfolioId: string) => Holding[];
  
  // Status & CRUD
  isLoading: boolean;
  syncStatus: "synced" | "syncing" | "local" | "error";
  addTransaction: (tx: Omit<Transaction, "id" | "total">) => Promise<void>;
  editTransaction: (id: string, tx: Omit<Transaction, "id" | "total">) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  moveStockToPortfolio: (
    symbol: string,
    sourcePortfolioId: string | undefined,
    targetPortfolioId: string
  ) => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const { user, isConfigured } = useAuth();

  // Portfolios State
  const [portfolios, setPortfolios] = useState<Portfolio[]>(DEFAULT_PORTFOLIOS);
  const [activePortfolioId, setActivePortfolioIdState] = useState<string>("ALL");

  // Transactions State
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "local" | "error">("local");

  // Set Active Portfolio with LocalStorage cache
  const setActivePortfolioId = useCallback((id: string) => {
    setActivePortfolioIdState(id);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("stockwise_active_portfolio_id", id);
      } catch (e) {}
    }
  }, []);

  // 1. Fetch Portfolios & Transactions from Supabase or LocalStorage
  const loadData = useCallback(async () => {
    setIsLoading(true);

    // Read cached active portfolio
    if (typeof window !== "undefined") {
      const cachedActive = localStorage.getItem("stockwise_active_portfolio_id");
      if (cachedActive) setActivePortfolioIdState(cachedActive);
    }

    if (user && supabase && isConfigured) {
      setSyncStatus("syncing");
      try {
        // A. Load User Portfolios
        const { data: portfolioData, error: portfolioErr } = await supabase
          .from("portfolios")
          .select("*")
          .order("created_at", { ascending: true });

        let userPortfolios: Portfolio[] = DEFAULT_PORTFOLIOS;
        if (!portfolioErr && portfolioData && portfolioData.length > 0) {
          userPortfolios = portfolioData.map((p) => ({
            id: p.id,
            name: p.name,
            strategy: p.strategy as PortfolioStrategy,
            color: p.color || "#10b981",
            description: p.description,
            isDefault: Boolean(p.is_default),
          }));
        } else if (portfolioData && portfolioData.length === 0) {
          // Initialize default portfolios in Supabase for new user
          const toInsert = DEFAULT_PORTFOLIOS.map((p) => ({
            id: p.id,
            user_id: user.id,
            name: p.name,
            strategy: p.strategy,
            color: p.color,
            description: p.description,
            is_default: p.isDefault || false,
          }));
          await supabase.from("portfolios").insert(toInsert);
        }
        setPortfolios(userPortfolios);

        // B. Load User Transactions
        const { data: txData, error: txErr } = await supabase
          .from("transactions")
          .select("*")
          .order("date", { ascending: false });

        // Load local backup map
        let localPortMap: Record<string, string> = {};
        try {
          const savedTxs = localStorage.getItem("stockwise_transactions");
          if (savedTxs) {
            const parsed: Transaction[] = JSON.parse(savedTxs);
            parsed.forEach((t) => {
              if (t.id && t.portfolioId) localPortMap[t.id] = t.portfolioId;
            });
          }
        } catch (e) {}

        if (txErr) {
          console.error("Error fetching transactions from Supabase:", txErr);
          setSyncStatus("error");
          const savedTxs = localStorage.getItem("stockwise_transactions");
          if (savedTxs) setAllTransactions(JSON.parse(savedTxs));
        } else if (txData) {
          const mappedTxs: Transaction[] = txData.map((item) => ({
            id: item.id,
            portfolioId: item.portfolio_id || localPortMap[item.id] || "growth",
            currency: (item.currency as "USD" | "THB") || "USD",
            date: item.date,
            type: item.type as "BUY" | "SELL",
            symbol: item.symbol,
            name: item.name || item.symbol,
            shares: Number(item.shares),
            price: Number(item.price),
            priceUSD: item.price_usd ? Number(item.price_usd) : Number(item.price),
            total: Number(item.total),
          }));

          // Check if guest transactions exist locally to migrate
          const savedTxs = localStorage.getItem("stockwise_transactions");
          if (savedTxs) {
            try {
              const localTxs: Transaction[] = JSON.parse(savedTxs);
              if (localTxs.length > 0 && mappedTxs.length === 0) {
                const toInsert = localTxs.map((tx) => ({
                  id: tx.id,
                  user_id: user.id,
                  portfolio_id: tx.portfolioId || "growth",
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
                  setAllTransactions(localTxs);
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

          setAllTransactions(mappedTxs);
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
        const savedPortfolios = localStorage.getItem("stockwise_portfolios");
        if (savedPortfolios) {
          setPortfolios(JSON.parse(savedPortfolios));
        } else {
          setPortfolios(DEFAULT_PORTFOLIOS);
        }

        const savedTxs = localStorage.getItem("stockwise_transactions");
        if (savedTxs) {
          const parsed: Transaction[] = JSON.parse(savedTxs);
          const normalized = parsed.map((t) => ({
            ...t,
            portfolioId: t.portfolioId || "growth",
          }));
          setAllTransactions(normalized);
        }
      } catch (e) {
        console.error("Failed to load local data", e);
      }
    }

    setIsLoaded(true);
    setIsLoading(false);
  }, [user, isConfigured]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Always save backup to localStorage so state is never lost across reloads
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem("stockwise_transactions", JSON.stringify(allTransactions));
        localStorage.setItem("stockwise_portfolios", JSON.stringify(portfolios));
      } catch (e) {}
    }
  }, [allTransactions, portfolios, isLoaded]);

  // 2. Portfolio Management Methods
  const addPortfolio = async (portfolioData: Omit<Portfolio, "id">): Promise<Portfolio> => {
    const newId = (typeof crypto !== "undefined" && crypto.randomUUID)
      ? crypto.randomUUID()
      : `port_${Date.now()}`;

    const newPortfolio: Portfolio = {
      ...portfolioData,
      id: newId,
    };

    setPortfolios((prev) => [...prev, newPortfolio]);

    if (user && supabase && isConfigured) {
      try {
        setSyncStatus("syncing");
        const { error } = await supabase.from("portfolios").insert({
          id: newPortfolio.id,
          user_id: user.id,
          name: newPortfolio.name,
          strategy: newPortfolio.strategy,
          color: newPortfolio.color,
          description: newPortfolio.description,
          is_default: Boolean(newPortfolio.isDefault),
        });
        if (error) {
          console.error("Failed to insert portfolio in Supabase:", error);
          setSyncStatus("error");
        } else {
          setSyncStatus("synced");
        }
      } catch (e) {
        console.error("Supabase insert portfolio error:", e);
        setSyncStatus("error");
      }
    }

    return newPortfolio;
  };

  const editPortfolio = async (id: string, updated: Partial<Portfolio>) => {
    setPortfolios((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
    );

    if (user && supabase && isConfigured) {
      try {
        setSyncStatus("syncing");
        const { error } = await supabase
          .from("portfolios")
          .update({
            name: updated.name,
            strategy: updated.strategy,
            color: updated.color,
            description: updated.description,
          })
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) {
          console.error("Failed to update portfolio in Supabase:", error);
          setSyncStatus("error");
        } else {
          setSyncStatus("synced");
        }
      } catch (e) {
        console.error("Supabase update portfolio error:", e);
        setSyncStatus("error");
      }
    }
  };

  const deletePortfolio = async (id: string) => {
    setPortfolios((prev) => prev.filter((p) => p.id !== id));
    setAllTransactions((prev) =>
      prev.map((tx) => (tx.portfolioId === id ? { ...tx, portfolioId: "growth" } : tx))
    );

    if (activePortfolioId === id) {
      setActivePortfolioId("ALL");
    }

    if (user && supabase && isConfigured) {
      try {
        setSyncStatus("syncing");
        await supabase
          .from("transactions")
          .update({ portfolio_id: "growth" })
          .eq("portfolio_id", id)
          .eq("user_id", user.id);

        const { error } = await supabase
          .from("portfolios")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) {
          console.error("Failed to delete portfolio in Supabase:", error);
          setSyncStatus("error");
        } else {
          setSyncStatus("synced");
        }
      } catch (e) {
        console.error("Supabase delete portfolio error:", e);
        setSyncStatus("error");
      }
    }
  };

  // 3. Transaction Management Methods
  const addTransaction = async (tx: Omit<Transaction, "id" | "total">) => {
    const newId = (typeof crypto !== "undefined" && crypto.randomUUID)
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 11);

    const targetPortfolioId =
      tx.portfolioId || (activePortfolioId !== "ALL" ? activePortfolioId : "growth");

    const txCurrency = tx.currency || "USD";

    const newTx: Transaction = {
      ...tx,
      id: newId,
      portfolioId: targetPortfolioId,
      currency: txCurrency,
      total: tx.shares * tx.price,
      // priceUSD is set by caller if currency is THB
    };

    setAllTransactions((prev) => [newTx, ...prev]);

    if (user && supabase && isConfigured) {
      try {
        setSyncStatus("syncing");
        const { error } = await supabase.from("transactions").insert({
          id: newTx.id,
          user_id: user.id,
          portfolio_id: newTx.portfolioId,
          currency: newTx.currency || "USD",
          date: newTx.date,
          type: newTx.type,
          symbol: newTx.symbol,
          name: newTx.name || newTx.symbol,
          shares: newTx.shares,
          price: newTx.price,
          price_usd: newTx.priceUSD ?? newTx.price,
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
    const targetPortfolioId =
      updated.portfolioId || (activePortfolioId !== "ALL" ? activePortfolioId : "growth");

    const updatedTx: Transaction = {
      ...updated,
      id,
      portfolioId: targetPortfolioId,
      total: updated.shares * updated.price,
    };

    setAllTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? updatedTx : tx))
    );

    if (user && supabase && isConfigured) {
      try {
        setSyncStatus("syncing");
        const { error } = await supabase
          .from("transactions")
          .update({
            portfolio_id: updatedTx.portfolioId,
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
    setAllTransactions((prev) => prev.filter((tx) => tx.id !== id));

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

  // 4. Move Stock Between Portfolios
  const moveStockToPortfolio = async (
    symbol: string,
    sourcePortfolioId: string | undefined,
    targetPortfolioId: string
  ) => {
    const sym = symbol.trim().toUpperCase();
    const matchingTxIds: string[] = [];

    const updatedTransactions = allTransactions.map((tx) => {
      if (tx.symbol.toUpperCase() === sym) {
        if (
          !sourcePortfolioId ||
          sourcePortfolioId === "ALL" ||
          (tx.portfolioId || "growth") === sourcePortfolioId
        ) {
          matchingTxIds.push(tx.id);
          return { ...tx, portfolioId: targetPortfolioId };
        }
      }
      return tx;
    });

    setAllTransactions(updatedTransactions);

    // Save local cache backup
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("stockwise_transactions", JSON.stringify(updatedTransactions));
      } catch (e) {}
    }

    if (user && supabase && isConfigured && matchingTxIds.length > 0) {
      try {
        setSyncStatus("syncing");
        const { error } = await supabase
          .from("transactions")
          .update({ portfolio_id: targetPortfolioId })
          .in("id", matchingTxIds)
          .eq("user_id", user.id);

        if (error) {
          console.warn("Supabase update error (Please ensure schema.sql is executed in Supabase SQL Editor):", error.message || error);
          setSyncStatus("error");
        } else {
          setSyncStatus("synced");
        }
      } catch (e) {
        console.warn("Supabase move stock error:", e);
        setSyncStatus("error");
      }
    }
  };

  // 5. Filtered Transactions based on Active Portfolio
  const transactions = useMemo(() => {
    if (activePortfolioId === "ALL") {
      return allTransactions;
    }
    return allTransactions.filter(
      (tx) => (tx.portfolioId || "growth") === activePortfolioId
    );
  }, [allTransactions, activePortfolioId]);

  // 6. Holding Calculation Helper
  const calculateHoldingsFromTxs = (txs: Transaction[]): Holding[] => {
    const holdingsMap: Record<string, { shares: number; totalCost: number; name: string }> = {};
    const chronologicalTxs = [...txs].reverse();

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
  };

  // Filtered Holdings for active portfolio
  const holdings = useMemo(() => {
    return calculateHoldingsFromTxs(transactions);
  }, [transactions]);

  // All Holdings across all portfolios
  const allHoldings = useMemo(() => {
    return calculateHoldingsFromTxs(allTransactions);
  }, [allTransactions]);

  const getPortfolioHoldings = useCallback(
    (portfolioId: string): Holding[] => {
      if (portfolioId === "ALL") return allHoldings;
      const filtered = allTransactions.filter(
        (t) => (t.portfolioId || "growth") === portfolioId
      );
      return calculateHoldingsFromTxs(filtered);
    },
    [allTransactions, allHoldings]
  );

  const activePortfolio = useMemo(() => {
    if (activePortfolioId === "ALL") return null;
    return portfolios.find((p) => p.id === activePortfolioId) || null;
  }, [portfolios, activePortfolioId]);

  return (
    <TransactionContext.Provider
      value={{
        portfolios,
        activePortfolioId,
        activePortfolio,
        setActivePortfolioId,
        addPortfolio,
        editPortfolio,
        deletePortfolio,
        transactions,
        allTransactions,
        holdings,
        allHoldings,
        getPortfolioHoldings,
        isLoading,
        syncStatus,
        addTransaction,
        editTransaction,
        deleteTransaction,
        moveStockToPortfolio,
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
