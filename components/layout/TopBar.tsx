"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import CompanyLogo from "@/components/common/CompanyLogo";
import CurrencySwitcher from "@/components/common/CurrencySwitcher";
import PortfolioSwitcher from "@/components/portfolio/PortfolioSwitcher";
import { useAuth } from "@/context/AuthContext";
import { useTransactions } from "@/context/TransactionContext";

type AssetType = "US_STOCK" | "TH_STOCK" | "MUTUAL_FUND" | "OTHER";

interface SearchResult {
  symbol: string;
  name: string;
  type: AssetType;
  exchange: string;
}

export default function TopBar() {
  const router = useRouter();
  const { user, openAuthModal, signOut, isConfigured } = useAuth();
  const { syncStatus } = useTransactions();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

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
        setIsProfileOpen(false);
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
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
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

  // User profile image & initials
  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : "SW";
  const userAvatarUrl = user?.user_metadata?.avatar_url || 
                        user?.user_metadata?.picture || 
                        (user?.email ? `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(user.email)}&backgroundColor=6366f1,a855f7` : null);
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0];

  return (
    <div className="sticky top-0 z-30 flex h-16 items-center border-b border-border/80 bg-background/85 px-4 sm:px-6 lg:px-8 backdrop-blur-xl transition-all">
      <div className="flex flex-1 items-center justify-between gap-4">
        {/* Left Spacer / Branding */}
        <div className="hidden md:flex flex-1 items-center gap-2">
          <span className="text-xs font-semibold text-muted/80 tracking-wide uppercase">
            StockWise Pro
          </span>
          {user && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Cloud Synced
            </span>
          )}
        </div>

        {/* Search Section */}
        <div className="relative w-full max-w-xl flex-[2] md:flex-none" ref={containerRef}>
          <div className="relative flex items-center group">
            <svg
              className="absolute left-3.5 h-4 w-4 text-muted group-hover:text-foreground transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
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

          {/* Search Dropdown */}
          {isOpen && (debouncedQuery.trim() || isLoading) && (
            <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-border/80 bg-card-bg/95 backdrop-blur-2xl shadow-2xl overflow-hidden z-50 animate-fade-in-up">
              {isLoading ? (
                <div className="flex items-center justify-center p-6 text-sm text-muted">
                  <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin mr-2" />
                  Searching global assets...
                </div>
              ) : results.length > 0 ? (
                <div className="max-h-[380px] overflow-y-auto divide-y divide-border/40 custom-scrollbar">
                  {results.map((item) => (
                    <button
                      key={item.symbol}
                      onClick={() => {
                        setQuery(item.symbol);
                        setIsOpen(false);
                        router.push(`/?symbol=${item.symbol}`);
                      }}
                      className="flex w-full items-center justify-between p-3.5 text-left transition-colors hover:bg-accent/10 focus:bg-accent/10 focus:outline-none group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <CompanyLogo symbol={item.symbol} size="md" className="rounded-xl flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-foreground group-hover:text-accent transition-colors">
                              {item.symbol}
                            </span>
                            <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-md border", getBadgeClass(item.type))}>
                              {getBadgeLabel(item.type)}
                            </span>
                          </div>
                          <p className="text-xs text-muted truncate mt-0.5">{item.name}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted font-mono flex-shrink-0 ml-2">{item.exchange}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-muted">
                  No assets found matching &ldquo;{debouncedQuery}&rdquo;
                </div>
              )}
            </div>
          )}
        </div>

        {/* Portfolio Switcher, Currency Switcher & User Auth Section */}
        <div className="flex items-center gap-2 sm:gap-2.5 ml-2 sm:ml-4">
          <PortfolioSwitcher variant="dropdown" />
          <CurrencySwitcher />

          {/* User Auth Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            {user ? (
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="relative flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-card-bg/80 border border-border/80 hover:border-accent/40 hover:bg-muted-bg/60 transition-all focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer group shadow-xs"
                aria-label="User Profile"
              >
                <div className="relative h-7 w-7 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-tr from-accent to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                  {userAvatarUrl ? (
                    <img 
                      src={userAvatarUrl} 
                      alt="User Avatar" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer" 
                    />
                  ) : (
                    userInitial
                  )}
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border-2 border-background rounded-full" />
                </div>
                <div className="hidden md:flex flex-col items-start text-left max-w-[130px] lg:max-w-[180px]">
                  <p className="text-xs font-semibold text-foreground truncate w-full group-hover:text-accent transition-colors">
                    {user.email}
                  </p>
                  <span className="text-[10px] text-emerald-500 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online
                  </span>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted group-hover:text-foreground transition-transform duration-200 hidden sm:block">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => openAuthModal("signin")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/10 hover:bg-accent/20 text-accent font-semibold text-xs border border-accent/20 transition-all active:scale-95 shadow-sm"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>Sign In</span>
              </button>
            )}

            {/* Profile Dropdown Menu */}
            {isProfileOpen && user && (
              <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl border border-border/80 bg-card-bg/95 backdrop-blur-2xl p-2 shadow-2xl animate-fade-in-up z-50">
                <div className="px-3 py-3 border-b border-border/40 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-tr from-accent to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                    {userAvatarUrl ? (
                      <img 
                        src={userAvatarUrl} 
                        alt="Avatar" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer" 
                      />
                    ) : (
                      userInitial
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground truncate">
                      {userName}
                    </p>
                    <p className="text-[11px] text-muted truncate mt-0.5">
                      {user.email}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] text-emerald-400 font-mono">
                        {syncStatus === "synced" ? "Synced" : syncStatus === "syncing" ? "Syncing..." : "Connected"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      router.push("/portfolio");
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-foreground/80 hover:text-foreground hover:bg-accent/10 rounded-xl transition-colors"
                  >
                    <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    My Portfolio
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      router.push("/watchlist");
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-foreground/80 hover:text-foreground hover:bg-accent/10 rounded-xl transition-colors"
                  >
                    <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    My Watchlist
                  </button>
                </div>

                <div className="border-t border-border/40 pt-1">
                  <button
                    onClick={async () => {
                      setIsProfileOpen(false);
                      await signOut();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
