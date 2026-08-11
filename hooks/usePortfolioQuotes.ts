"use client";

import { useState, useEffect } from "react";
import { holdings as initialHoldings, Holding } from "@/lib/mock-data";

export interface RealTimeHolding extends Holding {
  realTimeValue?: number;
  realTimePL?: number;
}

export function usePortfolioQuotes() {
  const [holdings, setHoldings] = useState<RealTimeHolding[]>(initialHoldings);
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
        const symbols = initialHoldings.map(h => h.symbol).join(",");
        
        const res = await fetch(`/api/quotes?symbols=${symbols}`);
        if (!res.ok) throw new Error("Failed to fetch quotes");
        
        const data = await res.json();
        
        if (data.spark && data.spark.result) {
          const quotes = data.spark.result;
          
          let newTotalValue = 0;
          let newTotalCost = 0;
          let newDayChange = 0;

          const updatedHoldings = initialHoldings.map(holding => {
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
            const itemValue = updatedHolding.shares * updatedHolding.currentPrice;
            const itemCost = updatedHolding.shares * updatedHolding.avgCost;
            const itemDayChange = updatedHolding.shares * updatedHolding.dayChange;
            
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
          const offlineHoldings = initialHoldings.map(h => {
             const val = h.shares * h.currentPrice;
             const cost = h.shares * h.avgCost;
             const dc = h.shares * h.dayChange;
             totalV += val; totalC += cost; totalDC += dc;
             return { ...h, realTimeValue: val, realTimePL: val - cost };
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
  }, []);

  return { holdings, portfolioStats, isLoading, error };
}
