"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type CurrencyType = "USD" | "THB";

interface CurrencyContextType {
  currency: CurrencyType;
  exchangeRate: number; // USD to THB rate (e.g. 33.10)
  isCustomRate: boolean;
  isLoadingRate: boolean;
  lastUpdated: string | null;
  setCurrency: (c: CurrencyType) => void;
  toggleCurrency: () => void;
  setCustomExchangeRate: (rate: number) => void;
  resetToLiveRate: () => Promise<void>;
  refreshLiveRate: () => Promise<void>;
  convert: (amountInUSD: number) => number;
  formatCurrency: (
    amountInUSD: number,
    options?: { hideSymbol?: boolean; maxDecimals?: number }
  ) => string;
  formatSignedCurrency: (
    amountInUSD: number,
    options?: { hideSymbol?: boolean; maxDecimals?: number }
  ) => string;
  currencySymbol: string;
}

const DEFAULT_USD_THB_RATE = 33.50;

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyType>("USD");
  const [exchangeRate, setExchangeRate] = useState<number>(DEFAULT_USD_THB_RATE);
  const [isCustomRate, setIsCustomRate] = useState(false);
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load user settings from localStorage on initial mount
  useEffect(() => {
    try {
      const savedCurrency = localStorage.getItem("stockwise_currency");
      if (savedCurrency === "USD" || savedCurrency === "THB") {
        setCurrencyState(savedCurrency);
      }

      const savedRate = localStorage.getItem("stockwise_exchange_rate");
      const savedIsCustom = localStorage.getItem("stockwise_is_custom_rate");
      if (savedRate) {
        const rateNum = parseFloat(savedRate);
        if (!isNaN(rateNum) && rateNum > 0) {
          setExchangeRate(rateNum);
          if (savedIsCustom === "true") {
            setIsCustomRate(true);
          }
        }
      }

      const savedLastUpdated = localStorage.getItem("stockwise_rate_last_updated");
      if (savedLastUpdated) {
        setLastUpdated(savedLastUpdated);
      }
    } catch (e) {
      console.error("Failed to load currency settings", e);
    }
    setIsInitialized(true);
  }, []);

  // Fetch live exchange rate from API
  const fetchLiveRate = useCallback(async () => {
    setIsLoadingRate(true);
    try {
      const res = await fetch("/api/quotes?symbols=THB=X");
      if (res.ok) {
        const data = await res.json();
        const result = data.spark?.result?.[0];
        const meta = result?.response?.[0]?.meta;
        const livePrice = meta?.regularMarketPrice;

        if (livePrice && typeof livePrice === "number" && livePrice > 0) {
          const nowStr = new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });
          setExchangeRate(livePrice);
          setIsCustomRate(false);
          setLastUpdated(nowStr);

          localStorage.setItem("stockwise_exchange_rate", String(livePrice));
          localStorage.setItem("stockwise_is_custom_rate", "false");
          localStorage.setItem("stockwise_rate_last_updated", nowStr);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch live USD/THB rate, using fallback/cached rate", e);
    } finally {
      setIsLoadingRate(false);
    }
  }, []);

  // Fetch live rate on mount if not using custom rate
  useEffect(() => {
    if (!isInitialized) return;
    const isCustom = localStorage.getItem("stockwise_is_custom_rate") === "true";
    if (!isCustom) {
      fetchLiveRate();
    }
  }, [isInitialized, fetchLiveRate]);

  // Periodic rate polling (every 3 minutes) if not custom rate
  useEffect(() => {
    if (isCustomRate) return;
    const interval = setInterval(fetchLiveRate, 180000);
    return () => clearInterval(interval);
  }, [isCustomRate, fetchLiveRate]);

  const setCurrency = (c: CurrencyType) => {
    setCurrencyState(c);
    try {
      localStorage.setItem("stockwise_currency", c);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleCurrency = () => {
    const next = currency === "USD" ? "THB" : "USD";
    setCurrency(next);
  };

  const setCustomExchangeRate = (rate: number) => {
    if (rate > 0) {
      const nowStr = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
      setExchangeRate(rate);
      setIsCustomRate(true);
      setLastUpdated(nowStr);

      try {
        localStorage.setItem("stockwise_exchange_rate", String(rate));
        localStorage.setItem("stockwise_is_custom_rate", "true");
        localStorage.setItem("stockwise_rate_last_updated", nowStr);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const resetToLiveRate = async () => {
    try {
      localStorage.removeItem("stockwise_is_custom_rate");
    } catch (e) {}
    setIsCustomRate(false);
    await fetchLiveRate();
  };

  const refreshLiveRate = async () => {
    await fetchLiveRate();
  };

  const convert = useCallback(
    (amountInUSD: number): number => {
      if (typeof amountInUSD !== "number" || isNaN(amountInUSD)) return 0;
      if (currency === "THB") {
        return amountInUSD * exchangeRate;
      }
      return amountInUSD;
    },
    [currency, exchangeRate]
  );

  const formatCurrency = useCallback(
    (
      amountInUSD: number,
      options?: { hideSymbol?: boolean; maxDecimals?: number }
    ): string => {
      if (typeof amountInUSD !== "number" || isNaN(amountInUSD)) return "-";

      const convertedValue = currency === "THB" ? amountInUSD * exchangeRate : amountInUSD;
      const decimals = options?.maxDecimals !== undefined ? options.maxDecimals : 2;

      if (options?.hideSymbol) {
        return new Intl.NumberFormat("en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(convertedValue);
      }

      if (currency === "THB") {
        return `฿${new Intl.NumberFormat("en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(convertedValue)}`;
      }

      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(convertedValue);
    },
    [currency, exchangeRate]
  );

  const formatSignedCurrency = useCallback(
    (
      amountInUSD: number,
      options?: { hideSymbol?: boolean; maxDecimals?: number }
    ): string => {
      if (typeof amountInUSD !== "number" || isNaN(amountInUSD)) return "-";
      const sign = amountInUSD >= 0 ? "+" : "";
      return `${sign}${formatCurrency(amountInUSD, options)}`;
    },
    [formatCurrency]
  );

  const currencySymbol = currency === "THB" ? "฿" : "$";

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        exchangeRate,
        isCustomRate,
        isLoadingRate,
        lastUpdated,
        setCurrency,
        toggleCurrency,
        setCustomExchangeRate,
        resetToLiveRate,
        refreshLiveRate,
        convert,
        formatCurrency,
        formatSignedCurrency,
        currencySymbol,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
