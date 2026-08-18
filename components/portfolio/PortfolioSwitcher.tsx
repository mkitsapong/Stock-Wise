"use client";

import { useState } from "react";
import { useTransactions, type Portfolio } from "@/context/TransactionContext";
import PortfolioModal from "@/components/portfolio/PortfolioModal";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  variant?: "tabs" | "dropdown" | "hero";
}

const STRATEGY_ICONS: Record<string, string> = {
  GROWTH: "🚀",
  DIVIDEND: "💰",
  TRADING: "⚡",
  CUSTOM: "🎯",
};

export default function PortfolioSwitcher({ className, variant = "tabs" }: Props) {
  const {
    portfolios,
    activePortfolioId,
    setActivePortfolioId,
    allHoldings,
    getPortfolioHoldings,
  } = useTransactions();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const activePortfolio = portfolios.find((p) => p.id === activePortfolioId) || null;

  const handleOpenCreate = () => {
    setEditingPortfolio(null);
    setIsModalOpen(true);
    setIsDropdownOpen(false);
  };

  const handleOpenEdit = (p: Portfolio, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPortfolio(p);
    setIsModalOpen(true);
    setIsDropdownOpen(false);
  };

  // 1. Dropdown Variant (for TopBar or compact areas)
  if (variant === "dropdown") {
    return (
      <>
        <div className={cn("relative", className)}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/80 bg-card-bg/80 hover:bg-card-bg hover:border-accent/40 text-xs font-semibold transition-all shadow-xs cursor-pointer group"
          >
            <div
              style={{ backgroundColor: activePortfolio ? activePortfolio.color : "#6366f1" }}
              className="w-2 h-2 rounded-full shadow-xs"
            />
            <span className="font-mono text-foreground font-bold truncate max-w-[120px]">
              {activePortfolioId === "ALL" ? "All Portfolios" : activePortfolio?.name || "Portfolio"}
            </span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn("text-muted transition-transform", isDropdownOpen && "rotate-180")}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-60 origin-top-right rounded-2xl border border-border/80 bg-card-bg/95 backdrop-blur-2xl p-1.5 shadow-2xl z-50 animate-fade-in-up">
              <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted/70">
                Switch Strategy Portfolio
              </div>

              {/* All Portfolios Option */}
              <button
                type="button"
                onClick={() => {
                  setActivePortfolioId("ALL");
                  setIsDropdownOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left mb-1",
                  activePortfolioId === "ALL"
                    ? "bg-accent/15 text-accent font-bold"
                    : "text-foreground hover:bg-muted-bg"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">🌐</span>
                  <div>
                    <span className="block font-semibold">All Portfolios (รวมทั้งหมด)</span>
                    <span className="text-[10px] text-muted">{allHoldings.length} Assets</span>
                  </div>
                </div>
                {activePortfolioId === "ALL" && <span className="text-accent font-bold">✓</span>}
              </button>

              <div className="h-px bg-border/40 my-1" />

              {/* Individual Portfolios */}
              <div className="space-y-0.5 max-h-56 overflow-y-auto scrollbar-thin">
                {portfolios.map((p) => {
                  const pHoldings = getPortfolioHoldings(p.id);
                  const isSelected = activePortfolioId === p.id;

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setActivePortfolioId(p.id);
                        setIsDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left group/item",
                        isSelected
                          ? "bg-accent/15 text-accent font-bold"
                          : "text-foreground hover:bg-muted-bg"
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-sm">{STRATEGY_ICONS[p.strategy] || "💼"}</span>
                        <div className="truncate">
                          <span className="block font-semibold truncate">{p.name}</span>
                          <span className="text-[10px] text-muted">{pHoldings.length} Assets</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 ml-2">
                        {isSelected && <span className="text-accent font-bold">✓</span>}
                        <div
                          onClick={(e) => handleOpenEdit(p, e)}
                          title="Edit Portfolio"
                          className="p-1 text-muted/60 hover:text-foreground opacity-0 group-hover/item:opacity-100 transition-opacity rounded-md hover:bg-muted-bg"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                            <path d="m15 5 4 4"/>
                          </svg>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="h-px bg-border/40 my-1" />

              {/* Create New Portfolio Button */}
              <button
                type="button"
                onClick={handleOpenCreate}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-accent hover:bg-accent/10 transition-colors cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Create New Portfolio</span>
              </button>
            </div>
          )}
        </div>

        <PortfolioModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialPortfolio={editingPortfolio}
        />
      </>
    );
  }

  // 2. Tabs / Pill Bar Variant (Default for Hero & Page Headers)
  return (
    <>
      <div className={cn("w-full overflow-x-auto scrollbar-none py-1", className)}>
        <div className="flex items-center gap-2 min-w-max">
          {/* All Portfolios Tab */}
          <button
            type="button"
            onClick={() => setActivePortfolioId("ALL")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold font-mono transition-all duration-200 border cursor-pointer shrink-0 whitespace-nowrap",
              activePortfolioId === "ALL"
                ? "bg-gradient-to-r from-accent/20 to-purple-500/20 text-accent border-accent/40 font-bold shadow-md shadow-accent/10 scale-[1.02]"
                : "bg-card-bg/60 text-muted border-border/60 hover:text-foreground hover:bg-card-bg hover:border-border"
            )}
          >
            <span>🌐</span>
            <span>All Portfolios</span>
            <span className="px-1.5 py-0.2 rounded-md bg-muted-bg text-[10px] font-bold text-muted">
              {allHoldings.length}
            </span>
          </button>

          {/* Strategy Portfolios Tabs */}
          {portfolios.map((p) => {
            const pHoldings = getPortfolioHoldings(p.id);
            const isSelected = activePortfolioId === p.id;

            return (
              <div key={p.id} className="relative group/pill flex items-center shrink-0">
                <button
                  type="button"
                  onClick={() => setActivePortfolioId(p.id)}
                  style={{
                    borderColor: isSelected ? `${p.color}60` : undefined,
                    backgroundColor: isSelected ? `${p.color}15` : undefined,
                    color: isSelected ? p.color : undefined,
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold font-mono transition-all duration-200 border cursor-pointer whitespace-nowrap shrink-0",
                    isSelected
                      ? "font-bold shadow-md scale-[1.02]"
                      : "bg-card-bg/60 text-muted border-border/60 hover:text-foreground hover:bg-card-bg hover:border-border"
                  )}
                >
                  <span>{STRATEGY_ICONS[p.strategy] || "💼"}</span>
                  <span>{p.name}</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-muted-bg text-[10px] font-bold text-muted">
                    {pHoldings.length}
                  </span>
                </button>

                {/* Edit Cog button */}
                <button
                  type="button"
                  onClick={(e) => handleOpenEdit(p, e)}
                  title="Edit Portfolio Settings"
                  className="ml-1 p-1.5 text-muted hover:text-foreground hover:bg-muted-bg/80 rounded-lg transition-all opacity-0 group-hover/pill:opacity-100 cursor-pointer shrink-0"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                    <path d="m15 5 4 4"/>
                  </svg>
                </button>
              </div>
            );
          })}

          {/* + Add New Portfolio Button */}
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-muted hover:text-accent bg-muted-bg/40 hover:bg-accent/10 border border-dashed border-border/70 hover:border-accent/40 transition-all cursor-pointer shrink-0 whitespace-nowrap"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>New Portfolio</span>
          </button>
        </div>
      </div>

      <PortfolioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialPortfolio={editingPortfolio}
      />
    </>
  );
}
