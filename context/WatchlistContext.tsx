"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export interface WatchlistSavedItem {
  symbol: string;
  name: string;
  targetBuyPrice: number | null;
}

interface WatchlistContextType {
  watchlist: WatchlistSavedItem[];
  isLoading: boolean;
  addToWatchlist: (symbol: string, name: string, targetBuyPrice?: number | null) => Promise<void>;
  removeFromWatchlist: (symbol: string) => Promise<void>;
  updateTargetPrice: (symbol: string, price: number | null) => Promise<void>;
  isInWatchlist: (symbol: string) => boolean;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const { user, isConfigured } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistSavedItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load watchlist from Supabase or LocalStorage
  const loadWatchlist = useCallback(async () => {
    setIsLoading(true);

    if (user && supabase && isConfigured) {
      try {
        const { data, error } = await supabase
          .from("watchlist")
          .select("*")
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Error fetching watchlist from Supabase:", error);
          const saved = localStorage.getItem("stockwise_watchlist");
          if (saved) setWatchlist(JSON.parse(saved));
        } else if (data) {
          const mapped: WatchlistSavedItem[] = data.map((item) => ({
            symbol: item.symbol,
            name: item.name,
            targetBuyPrice: item.target_buy_price ? Number(item.target_buy_price) : null,
          }));

          // Migrate local watchlist if cloud is empty
          const saved = localStorage.getItem("stockwise_watchlist");
          if (saved) {
            try {
              const localList: WatchlistSavedItem[] = JSON.parse(saved);
              if (localList.length > 0 && mapped.length === 0) {
                const toInsert = localList.map((item) => ({
                  user_id: user.id,
                  symbol: item.symbol,
                  name: item.name,
                  target_buy_price: item.targetBuyPrice,
                }));
                const { error: insertErr } = await supabase.from("watchlist").insert(toInsert);
                if (!insertErr) {
                  localStorage.removeItem("stockwise_watchlist");
                  setWatchlist(localList);
                  setIsLoaded(true);
                  setIsLoading(false);
                  return;
                }
              }
            } catch (e) {
              console.warn("Failed to migrate local watchlist", e);
            }
          }

          setWatchlist(mapped);
        }
      } catch (err) {
        console.error("Supabase watchlist error:", err);
      }
    } else {
      // Guest mode
      try {
        const saved = localStorage.getItem("stockwise_watchlist");
        if (saved) {
          setWatchlist(JSON.parse(saved));
        }
      } catch (e) {
        console.error("Failed to load watchlist", e);
      }
    }

    setIsLoaded(true);
    setIsLoading(false);
  }, [user, isConfigured]);

  useEffect(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  // Save to localStorage when in Guest mode
  useEffect(() => {
    if (isLoaded && !user) {
      localStorage.setItem("stockwise_watchlist", JSON.stringify(watchlist));
    }
  }, [watchlist, isLoaded, user]);

  const addToWatchlist = async (symbol: string, name: string, targetBuyPrice: number | null = null) => {
    if (watchlist.some((item) => item.symbol === symbol)) return;

    const newItem: WatchlistSavedItem = { symbol, name, targetBuyPrice };
    setWatchlist((prev) => [...prev, newItem]);

    if (user && supabase && isConfigured) {
      try {
        await supabase.from("watchlist").insert({
          user_id: user.id,
          symbol,
          name,
          target_buy_price: targetBuyPrice,
        });
      } catch (err) {
        console.error("Supabase add watchlist error:", err);
      }
    }
  };

  const removeFromWatchlist = async (symbol: string) => {
    setWatchlist((prev) => prev.filter((item) => item.symbol !== symbol));

    if (user && supabase && isConfigured) {
      try {
        await supabase
          .from("watchlist")
          .delete()
          .eq("symbol", symbol)
          .eq("user_id", user.id);
      } catch (err) {
        console.error("Supabase remove watchlist error:", err);
      }
    }
  };

  const updateTargetPrice = async (symbol: string, price: number | null) => {
    setWatchlist((prev) =>
      prev.map((item) =>
        item.symbol === symbol ? { ...item, targetBuyPrice: price } : item
      )
    );

    if (user && supabase && isConfigured) {
      try {
        await supabase
          .from("watchlist")
          .update({ target_buy_price: price })
          .eq("symbol", symbol)
          .eq("user_id", user.id);
      } catch (err) {
        console.error("Supabase update target price error:", err);
      }
    }
  };

  const isInWatchlist = (symbol: string) => {
    return watchlist.some((item) => item.symbol === symbol);
  };

  return (
    <WatchlistContext.Provider
      value={{
        watchlist,
        isLoading,
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
