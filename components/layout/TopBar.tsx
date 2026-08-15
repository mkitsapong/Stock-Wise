"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

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
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch results when debounced query changes
  useEffect(() => {
    if (!debouncedQuery) {
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
          } else if (quote.exchange === "SET" || quote.symbol.endsWith(".BK")) {
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
        // Quietly fail to prevent Next.js error overlay in dev mode
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
        return "Other";
    }
  };

  return (
    <div className="sticky top-0 z-30 flex h-16 items-center border-b border-border bg-background/80 px-4 sm:px-6 lg:px-8 backdrop-blur-xl">
      <div className="flex flex-1 items-center justify-between gap-4">
        {/* Left Spacer for centering */}
        <div className="hidden md:flex flex-1"></div>

        {/* Search Section */}
        <div className="relative w-full max-w-xl flex-[2] md:flex-none" ref={containerRef}>
          <div className="relative flex items-center group">
            {isLoading ? (
              <svg
                className="absolute left-4 h-4 w-4 animate-spin text-accent"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg
                className="absolute left-4 h-4 w-4 text-muted group-hover:text-foreground transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="Search via Yahoo Finance..."
              className="w-full rounded-2xl border border-border/60 bg-muted-bg/40 py-2.5 pl-11 pr-4 text-sm text-foreground shadow-sm transition-all focus:border-accent focus:bg-card-bg focus:outline-none focus:ring-4 focus:ring-accent/15 hover:border-border hover:bg-muted-bg/80 placeholder:text-muted/60"
            />
          </div>

          {/* Autocomplete Dropdown */}
          {isOpen && query.length > 0 && (
            <div className="absolute left-0 mt-2 w-full origin-top-left rounded-xl border border-border bg-card-bg py-2 shadow-xl animate-fade-in-up">
              {results.length > 0 ? (
                <ul className="max-h-80 overflow-y-auto scrollbar-thin">
                  {results.map((asset) => (
                    <li
                      key={asset.symbol}
                      className="cursor-pointer px-4 py-2 hover:bg-card-hover transition-colors"
                      onClick={() => {
                        setQuery(asset.symbol);
                        setIsOpen(false);
                        router.push(`/?symbol=${asset.symbol}`);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground text-sm flex items-center gap-2">
                            {asset.symbol}
                            {asset.exchange && (
                              <span className="text-[10px] text-muted font-normal uppercase">
                                {asset.exchange}
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-muted truncate max-w-[200px]">
                            {asset.name}
                          </span>
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
                <div className="px-4 py-3 text-sm text-muted text-center">
                  No results found for "{query}"
                </div>
              ) : (
                <div className="px-4 py-3 text-sm text-muted text-center">
                  Searching...
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* User Profile / Notifications (Placeholder) */}
        <div className="flex items-center gap-4 ml-4">
           <button className="relative p-2 text-muted hover:text-foreground transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span className="absolute top-1 right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
           </button>
           <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-accent to-purple-500 flex items-center justify-center text-white font-semibold text-xs shadow-md">
             JD
           </div>
        </div>
      </div>
    </div>
  );
}
