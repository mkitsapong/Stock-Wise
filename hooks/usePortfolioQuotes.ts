"use client";

import { useState, useEffect } from "react";
import { useTransactions } from "@/context/TransactionContext";
import { Holding } from "@/lib/mock-data";

export interface RealTimeHolding extends Holding {
  realTimeValue?: number;
  realTimePL?: number;
}

export function usePortfolioQuotes() {
  const { holdings: baseHoldings } = useTransactions();
  // Map baseHoldings to RealTimeHolding with default zeros
  const initialRealTimeHoldings = baseHoldings.map(h => ({
    ...h,
    currentPrice: 0,
    dayChange: 0,
    dayChangePercent: 0,
    hasDividend: false,
    dividendYield: 0,
    annualDividend: 0,
    sparklineData: [],
    realTimeValue: 0,
    realTimePL: 0
  })) as unknown as RealTimeHolding[];

  const [holdings, setHoldings] = useState<RealTimeHolding[]>(initialRealTimeHoldings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Aggregate portfolio metrics
  const [portfolioStats, setPortfolioStats] = useState({
    totalValue: 0,
    totalCost: 0,
    unrealizedPL: 0,
    dayChange: 0,
    dayChangePercent: 0,
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchQuotes() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Extract symbols to fetch
        const symbols = baseHoldings.map(h => h.symbol).join(",");
        if (!symbols) {
           setHoldings([]);
           setPortfolioStats({ totalValue: 0, totalCost: 0, unrealizedPL: 0, dayChange: 0, dayChangePercent: 0 });
           setIsLoading(false);
           return;
        }
        
        const res = await fetch(`/api/quotes?symbols=${symbols}`);
        if (!res.ok) throw new Error("Failed to fetch quotes");
        
        const data = await res.json();
        
        if (data.spark && data.spark.result) {
          const quotes = data.spark.result;
          
          let newTotalValue = 0;
          let newTotalCost = 0;
          let newDayChange = 0;

          const updatedHoldings = initialRealTimeHoldings.map(holding => {
            const quoteData = quotes.find((q: any) => q.symbol === holding.symbol);
            
            let updatedHolding = { ...holding };
            
            if (quoteData && quoteData.response && quoteData.response[0] && quoteData.response[0].meta) {
              const meta = quoteData.response[0].meta;
              const currentPrice = meta.regularMarketPrice;
              const previousClose = meta.chartPreviousClose;
              
              if (currentPrice !== undefined && previousClose !== undefined) {
                const dayChange = currentPrice - previousClose;
                const dayChangePercent = (dayChange / previousClose) * 100;
                
                updatedHolding.currentPrice = currentPrice;
                updatedHolding.dayChange = dayChange;
                updatedHolding.dayChangePercent = dayChangePercent;
              }
            }
            
            // Calculate item-level metrics
            const currentP = updatedHolding.currentPrice ?? updatedHolding.avgCost ?? 0;
            const dayChg = updatedHolding.dayChange ?? 0;
            const itemValue = updatedHolding.shares * currentP;
            const itemCost = updatedHolding.shares * updatedHolding.avgCost;
            const itemDayChange = updatedHolding.shares * dayChg;
            
            updatedHolding.realTimeValue = itemValue;
            updatedHolding.realTimePL = itemValue - itemCost;
            
            // Accumulate global metrics
            newTotalValue += itemValue;
            newTotalCost += itemCost;
            newDayChange += itemDayChange;
            
            return updatedHolding;
          });

          
          if (isMounted) {
            setHoldings(updatedHoldings);
            setPortfolioStats({
              totalValue: newTotalValue,
              totalCost: newTotalCost,
              unrealizedPL: newTotalValue - newTotalCost,
              dayChange: newDayChange,
              dayChangePercent: newTotalCost > 0 ? (newTotalValue - newTotalCost) / newTotalCost * 100 : 0, // Note: overall day change % is typically dayChange / previous total value. We can approximate it.
            });
            // Better approximation for overall day change %
            const previousTotalValue = newTotalValue - newDayChange;
            setPortfolioStats(prev => ({
              ...prev,
              dayChangePercent: previousTotalValue > 0 ? (newDayChange / previousTotalValue) * 100 : 0,
            }));
          }
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError("Unable to load real-time data. Using offline data.");
          // Fallback to offline calculation
          let totalV = 0, totalC = 0, totalDC = 0;
          const offlineHoldings = initialRealTimeHoldings.map(h => {
             const val = h.shares * (h.currentPrice || h.avgCost);
             const cost = h.shares * h.avgCost;
             const dc = 0;
             totalV += val; totalC += cost; totalDC += dc;
             return { ...h, realTimeValue: val, realTimePL: val - cost, currentPrice: h.currentPrice || h.avgCost };
          });
          setHoldings(offlineHoldings);
          const prevV = totalV - totalDC;
          setPortfolioStats({
             totalValue: totalV,
             totalCost: totalC,
             unrealizedPL: totalV - totalC,
             dayChange: totalDC,
             dayChangePercent: prevV > 0 ? (totalDC / prevV) * 100 : 0
          });
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchQuotes();
    
    // Auto-refresh every 60 seconds
    const intervalId = setInterval(fetchQuotes, 60000);
    
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [baseHoldings]); // Re-run when baseHoldings change

  return { holdings, portfolioStats, isLoading, error };
}
