"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import CandlestickChart from "@/components/charts/CandlestickChart";
import TechnicalAnalysis from "@/components/dashboard/TechnicalAnalysis";
import AIInsights from "@/components/dashboard/AIInsights";
import { cn } from "@/lib/utils";
import { useWatchlist } from "@/context/WatchlistContext";
import { useTransactions } from "@/context/TransactionContext";
import DashboardWatchlist from "@/components/dashboard/DashboardWatchlist";

export default function CandlestickSection() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { holdings } = useTransactions();
  
  // Extract unique symbols from holdings
  const portfolioSymbols = holdings.map((h) => ({
    symbol: h.symbol,
    name: h.name,
  }));

  // Read from URL, fallback to first portfolio symbol
  const urlSymbol = searchParams.get("symbol");
  const activeSymbol = urlSymbol || (portfolioSymbols.length > 0 ? portfolioSymbols[0].symbol : "AAPL");

  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeName, setActiveName] = useState<string>("");
  const [timeFrame, setTimeFrame] = useState<string>("ALL");

  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const inWatchlist = isInWatchlist(activeSymbol);

  const handleToggleWatchlist = () => {
    if (inWatchlist) {
      removeFromWatchlist(activeSymbol);
    } else {
      addToWatchlist(activeSymbol, activeName || activeSymbol);
    }
  };

  useEffect(() => {
    async function fetchChartData() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/chart?symbol=${encodeURIComponent(activeSymbol)}&tf=${timeFrame}`);
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
  }, [activeSymbol, timeFrame]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-stretch">
        <div className="xl:col-span-3 h-full min-h-0">
          {/* Chart Card */}
          <div className="glass-card p-2 sm:p-4 h-full animate-fade-in-up opacity-0 stagger-1">
            {isLoading && chartData.length === 0 ? (
              <div className="h-[420px] w-full rounded-xl bg-card-bg flex items-center justify-center border border-border/50">
                <div className="flex flex-col items-center gap-3">
                  <svg
                    className="animate-spin h-8 w-8 text-accent"
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
            ) : null}
            
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
                timeFrame={timeFrame}
                onTimeFrameChange={setTimeFrame}
                headerAction={
                  <button
                    onClick={handleToggleWatchlist}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border",
                      inWatchlist
                        ? "bg-profit/10 text-profit border-profit/20 hover:bg-profit/20"
                        : "bg-muted-bg text-muted border-border hover:text-foreground hover:bg-card-bg"
                    )}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill={inWatchlist ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    {inWatchlist ? "Saved" : "Watchlist"}
                  </button>
                }
              />
            )}
          </div>
        </div>

        <div className="xl:col-span-1 relative hidden xl:block">
          <div className="absolute inset-0">
            <DashboardWatchlist className="h-full" />
          </div>
        </div>
        <div className="xl:hidden">
          <DashboardWatchlist className="h-[500px]" />
        </div>
      </div>

      {/* Technical Support & Resistance */}
      {!error && <TechnicalAnalysis data={chartData} isLoading={isLoading} />}

      {/* AI Insights (News & Sentiment) */}
      {!error && <AIInsights symbol={activeSymbol} chartData={chartData} />}
    </div>
  );
}
