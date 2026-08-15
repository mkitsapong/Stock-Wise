"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import CompanyLogo from "@/components/common/CompanyLogo";

type AssetType = "US_STOCK" | "TH_STOCK" | "MUTUAL_FUND" | "OTHER";

interface SearchResult {
  symbol: string;
  name: string;
  type: AssetType;
  exchange: string;
}

export default function TopBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global Ctrl+K or Cmd+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce the input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 280);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch results when debounced query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
        if (!res.ok) {
          setResults([]);
          return;
        }
        const data = await res.json();
        
        const mappedResults: SearchResult[] = (data.quotes || []).map((quote: any) => {
          let type: AssetType = "OTHER";
          
          if (quote.quoteType === "MUTUALFUND") {
            type = "MUTUAL_FUND";
          } else if (quote.exchange === "SET" || quote.symbol?.endsWith(".BK")) {
            type = "TH_STOCK";
          } else if (quote.quoteType === "EQUITY" || quote.quoteType === "ETF") {
            type = "US_STOCK";
          }

          return {
            symbol: quote.symbol,
            name: quote.shortname || quote.longname || quote.symbol,
            type,
            exchange: quote.exchDisp || quote.exchange || "",
          };
        });

        setResults(mappedResults);
      } catch (error) {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  const getBadgeClass = (type: AssetType) => {
    switch (type) {
      case "US_STOCK":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "TH_STOCK":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "MUTUAL_FUND":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const getBadgeLabel = (type: AssetType) => {
    switch (type) {
      case "US_STOCK":
        return "US Stock";
      case "TH_STOCK":
        return "TH Stock";
      case "MUTUAL_FUND":
        return "Fund";
      default:
        return "Asset";
    }
  };

  return (
    <div className="sticky top-0 z-30 flex h-16 items-center border-b border-border/80 bg-background/85 px-4 sm:px-6 lg:px-8 backdrop-blur-xl transition-all">
      <div className="flex flex-1 items-center justify-between gap-4">
        {/* Left Spacer */}
        <div className="hidden md:flex flex-1 items-center gap-2">
          <span className="text-xs font-semibold text-muted/80 tracking-wide uppercase">
            StockWise Pro
          </span>
        </div>

        {/* Search Section */}
        <div className="relative w-full max-w-xl flex-[2] md:flex-none" ref={containerRef}>
          <div className="relative flex items-center group">
            {isLoading ? (
              <svg
                className="absolute left-3.5 h-4 w-4 animate-spin text-accent"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg
                className="absolute left-3.5 h-4 w-4 text-muted group-hover:text-foreground transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="Search stocks, indices, funds (e.g. AAPL, NVDA, PTT.BK)..."
              className="w-full rounded-xl border border-border/80 bg-card-bg/60 py-2 pl-10 pr-16 text-sm text-foreground shadow-sm transition-all focus:border-accent focus:bg-card-bg focus:outline-none focus:ring-2 focus:ring-accent/20 hover:border-border placeholder:text-muted/60"
            />
            <div className="absolute right-2.5 flex items-center gap-1.5">
              {query && (
                <button
                  onClick={() => {
                    setQuery("");
                    setResults([]);
                  }}
                  className="p-1 text-muted hover:text-foreground text-xs rounded-md"
                >
                  ✕
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted bg-muted-bg/80 border border-border/60 rounded">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Autocomplete Dropdown */}
          {isOpen && query.length > 0 && (
            <div className="absolute left-0 mt-2 w-full origin-top-left rounded-2xl border border-border/80 bg-card-bg/95 backdrop-blur-2xl py-2 shadow-2xl animate-fade-in-up z-50 overflow-hidden">
              {results.length > 0 ? (
                <ul className="max-h-80 overflow-y-auto scrollbar-thin divide-y divide-border/30">
                  {results.map((asset) => (
                    <li
                      key={asset.symbol}
                      className="cursor-pointer px-4 py-2.5 hover:bg-accent/10 transition-colors group/item"
                      onClick={() => {
                        setQuery(asset.symbol);
                        setIsOpen(false);
                        router.push(`/?symbol=${asset.symbol}`);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CompanyLogo symbol={asset.symbol} name={asset.name} size="sm" />
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground text-sm font-mono flex items-center gap-2 group-hover/item:text-accent transition-colors">
                              {asset.symbol}
                              {asset.exchange && (
                                <span className="text-[10px] text-muted font-normal uppercase bg-muted-bg px-1.5 py-0.2 rounded font-sans">
                                  {asset.exchange}
                                </span>
                              )}
                            </span>
                            <span className="text-xs text-muted truncate max-w-[260px]">
                              {asset.name}
                            </span>
                          </div>
                        </div>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase border whitespace-nowrap",
                            getBadgeClass(asset.type)
                          )}
                        >
                          {getBadgeLabel(asset.type)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : !isLoading ? (
                <div className="px-4 py-4 text-sm text-muted text-center">
                  No assets found for <span className="font-semibold text-foreground">"{query}"</span>
                </div>
              ) : (
                <div className="px-4 py-4 text-sm text-muted text-center flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                  Searching Yahoo Finance...
                </div>
              )}
            </div>
          )}
        </div>

        
        {/* User Profile / Quick Stats */}
        <div className="flex items-center gap-3 ml-4">
           <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-accent to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
             SW
           </div>
        </div>
      </div>
    </div>
  );
}

