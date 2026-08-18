import CandlestickSection from "@/components/dashboard/CandlestickSection";
import HeroCards from "@/components/dashboard/HeroCards";
import BenchmarkComparison from "@/components/dashboard/BenchmarkComparison";
import EarningsCalendar from "@/components/dashboard/EarningsCalendar";

export default function DashboardPage() {
  return (
    <div className="space-y-8 pb-10">
      {/* Page Header */}
      <div className="animate-fade-in-up opacity-0 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight gradient-text inline-block">
              Dashboard
            </h1>
            <span className="px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent font-mono text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shrink-0" />
              <span>Market Live</span>
            </span>
          </div>
          <p className="text-sm text-muted mt-1 font-medium">
            Live Market Overview · {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Hero Stats */}
      <HeroCards />

      {/* Candlestick Chart & Analysis */}
      <CandlestickSection />

      {/* Benchmark Comparison + Earnings Calendar */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <BenchmarkComparison className="xl:col-span-2" />
        <EarningsCalendar />
      </div>
    </div>
  );
}



