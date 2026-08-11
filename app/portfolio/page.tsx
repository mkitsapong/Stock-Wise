import HoldingsTable from "@/components/portfolio/HoldingsTable";
import DividendSection from "@/components/portfolio/DividendSection";

export default function PortfolioPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="animate-fade-in-up opacity-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          Portfolio
        </h1>
        <p className="text-sm text-muted mt-1">
          Detailed view of all holdings and dividend income
        </p>
      </div>

      {/* Holdings Table */}
      <HoldingsTable />

      {/* Dividend Section */}
      <DividendSection />
    </div>
  );
}
