import { watchlistItems } from "@/lib/mock-data";
import WatchlistCard from "@/components/watchlist/WatchlistCard";

export default function WatchlistPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="animate-fade-in-up opacity-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          Watchlist
        </h1>
        <p className="text-sm text-muted mt-1">
          Tracking {watchlistItems.length} stocks · Monitor target buy prices
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {watchlistItems.map((item, index) => (
          <WatchlistCard key={item.symbol} item={item} index={index} />
        ))}
      </div>
    </div>
  );
}
