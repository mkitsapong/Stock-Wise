"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import CandlestickChart from "@/components/charts/CandlestickChart";
import TechnicalAnalysis from "@/components/dashboard/TechnicalAnalysis";
import AIInsights from "@/components/dashboard/AIInsights";
import { holdings } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

// Quick filter tabs (from portfolio)
const portfolioSymbols = holdings.map((h) => ({
  symbol: h.symbol,
  name: h.name,
}));

export default function CandlestickSection() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Read from URL, fallback to first portfolio symbol
  const urlSymbol = searchParams.get("symbol");
  const activeSymbol = urlSymbol || portfolioSymbols[0].symbol;

  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeName, setActiveName] = useState<string>("");

  useEffect(() => {
    async function fetchChartData() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/chart?symbol=${encodeURIComponent(activeSymbol)}`);
        if (!res.ok) throw new Error("Failed to fetch chart data");
        const data = await res.json();
        
        if (data.error) throw new Error(data.error);
        
        setChartData(data.data || []);
        setActiveName(data.meta?.longName || activeSymbol);
      } catch (err: any) {
        console.error(err);
        setError("Unable to load chart data.");
        setChartData([]);
        setActiveName(activeSymbol);
      } finally {
        setIsLoading(false);
      }
    }

    fetchChartData();
  }, [activeSymbol]);



  return (
    <div className="animate-fade-in-up opacity-0 stagger-4">
      {/* Chart */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-card-bg/50 backdrop-blur-sm rounded-xl border border-border/50">
            <div className="flex flex-col items-center gap-3">
              <svg
                className="h-8 w-8 animate-spin text-accent"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p className="text-sm text-muted font-medium animate-pulse">Loading market data...</p>
            </div>
          </div>
        )}
        
        {error ? (
          <div className="h-[420px] w-full rounded-xl border border-border/50 bg-card-bg flex items-center justify-center">
             <p className="text-loss font-medium">{error}</p>
          </div>
        ) : (
          <CandlestickChart
            data={chartData}
            height={420}
            symbol={activeSymbol}
            title={`${activeName} · Historical Price Action`}
          />
        )}
      </div>

      {/* Technical Support & Resistance */}
      {!error && <TechnicalAnalysis data={chartData} isLoading={isLoading} />}

      {/* AI Insights (News & Sentiment) */}
      {!error && <AIInsights symbol={activeSymbol} chartData={chartData} />}
    </div>
  );
}
