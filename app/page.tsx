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
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight gradient-text inline-block">
            Dashboard
          </h1>
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



