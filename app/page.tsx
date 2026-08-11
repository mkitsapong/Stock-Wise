import CandlestickSection from "@/components/dashboard/CandlestickSection";

export default function DashboardPage() {
  return (
    <div className="space-y-10 pb-10">
      {/* Page Header */}
      <div className="animate-fade-in-up opacity-0 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight gradient-text inline-block">
            Dashboard
          </h1>
          <p className="text-sm text-muted mt-1 font-medium">
            Market Action · {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Candlestick Chart */}
      <CandlestickSection />
    </div>
  );
}

