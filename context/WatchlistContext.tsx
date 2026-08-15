"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface WatchlistSavedItem {
  symbol: string;
  name: string;
  targetBuyPrice: number | null;
}

interface WatchlistContextType {
  watchlist: WatchlistSavedItem[];
  addToWatchlist: (symbol: string, name: string, targetBuyPrice?: number | null) => void;
  removeFromWatchlist: (symbol: string) => void;
  updateTargetPrice: (symbol: string, price: number | null) => void;
  isInWatchlist: (symbol: string) => boolean;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const [watchlist, setWatchlist] = useState<WatchlistSavedItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("stockwise_watchlist");
      if (saved) {
        setWatchlist(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load watchlist", e);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("stockwise_watchlist", JSON.stringify(watchlist));
    }
  }, [watchlist, isLoaded]);

  const addToWatchlist = (symbol: string, name: string, targetBuyPrice: number | null = null) => {
    setWatchlist((prev) => {
      if (prev.some((item) => item.symbol === symbol)) return prev;
      return [...prev, { symbol, name, targetBuyPrice }];
    });
  };

  const removeFromWatchlist = (symbol: string) => {
    setWatchlist((prev) => prev.filter((item) => item.symbol !== symbol));
  };

  const updateTargetPrice = (symbol: string, price: number | null) => {
    setWatchlist((prev) =>
      prev.map((item) =>
        item.symbol === symbol ? { ...item, targetBuyPrice: price } : item
      )
    );
  };

  const isInWatchlist = (symbol: string) => {
    return watchlist.some((item) => item.symbol === symbol);
  };

  return (
    <WatchlistContext.Provider
      value={{
        watchlist,
        addToWatchlist,
        removeFromWatchlist,
        updateTargetPrice,
        isInWatchlist,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (context === undefined) {
    throw new Error("useWatchlist must be used within a WatchlistProvider");
  }
  return context;
}
