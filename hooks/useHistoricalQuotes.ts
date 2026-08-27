"use client";

import { useState, useEffect, useMemo, useRef } from "react";

export type DailyPriceMap = Record<string, Record<string, number>>; // symbol -> { "YYYY-MM-DD": closePrice }

// Global in-memory cache to avoid duplicate API requests across component re-renders
const globalPriceCache = new Map<string, DailyPriceMap>();

export function useHistoricalQuotes(symbols: string[]) {
  // Always include S&P 500 benchmark symbol
  const cleanSymbols = useMemo(() => {
    const set = new Set<string>();
    for (const sym of symbols) {
      if (sym && sym.trim()) set.add(sym.trim().toUpperCase());
    }
    set.add("^GSPC");
    return Array.from(set).sort();
  }, [symbols]);

  const cacheKey = cleanSymbols.join(",");
  const [priceHistoryMap, setPriceHistoryMap] = useState<DailyPriceMap>(
    () => globalPriceCache.get(cacheKey) || {}
  );
  const [isLoading, setIsLoading] = useState<boolean>(!globalPriceCache.has(cacheKey) && cleanSymbols.length > 0);
  const [error, setError] = useState<string | null>(null);

  const prevCacheKeyRef = useRef<string>("");

  useEffect(() => {
    if (cleanSymbols.length === 0) {
      setIsLoading(false);
      return;
    }

    if (cacheKey === prevCacheKeyRef.current && globalPriceCache.has(cacheKey)) {
      return;
    }

    prevCacheKeyRef.current = cacheKey;

    if (globalPriceCache.has(cacheKey)) {
      setPriceHistoryMap(globalPriceCache.get(cacheKey)!);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    async function fetchHistoricalData() {
      try {
        const symbolsParam = cleanSymbols.join(",");
        const res = await fetch(`/api/quotes?symbols=${encodeURIComponent(symbolsParam)}&range=5y&interval=1d`);
        
        if (!res.ok) {
          throw new Error(`Failed to fetch historical quotes: ${res.statusText}`);
        }

        const data = await res.json();
        const results = data.spark?.result || [];
        const newMap: DailyPriceMap = {};

        for (const item of results) {
          const sym = item.symbol?.toUpperCase();
          if (!sym) continue;

          const resp = item.response?.[0];
          if (!resp) continue;

          const timestamps: number[] = resp.timestamp || [];
          const closes: (number | null)[] = resp.indicators?.quote?.[0]?.close || [];

          newMap[sym] = {};

          let lastValidPrice: number | null = null;
          for (let i = 0; i < timestamps.length; i++) {
            const ts = timestamps[i];
            const close = closes[i];

            if (ts && typeof ts === "number") {
              const dateStr = new Date(ts * 1000).toISOString().split("T")[0];
              if (close !== null && close !== undefined && !isNaN(close) && close > 0) {
                newMap[sym][dateStr] = close;
                lastValidPrice = close;
              } else if (lastValidPrice !== null) {
                // Forward fill if Yahoo returned a null tick for a trading day
                newMap[sym][dateStr] = lastValidPrice;
              }
            }
          }
        }

        globalPriceCache.set(cacheKey, newMap);

        if (isMounted) {
          setPriceHistoryMap(newMap);
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error("useHistoricalQuotes error:", err);
        if (isMounted) {
          setError(err.message || "Failed to load historical prices");
          setIsLoading(false);
        }
      }
    }

    fetchHistoricalData();

    return () => {
      isMounted = false;
    };
  }, [cacheKey, cleanSymbols]);

  return { priceHistoryMap, isLoading, error };
}
