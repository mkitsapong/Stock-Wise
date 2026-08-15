"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface CompanyLogoProps {
  symbol: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

// Domain mappings for prominent Thai stocks and common assets
const KNOWN_DOMAINS: Record<string, string> = {
  "PTT.BK": "pttplc.com",
  "PTTEP.BK": "pttep.com",
  "CPALL.BK": "cpall.co.th",
  "DELTA.BK": "deltathailand.com",
  "AOT.BK": "airportthai.co.th",
  "ADVANC.BK": "ais.th",
  "GULF.BK": "gulf.co.th",
  "KBANK.BK": "kasikornbank.com",
  "SCB.BK": "scb.co.th",
  "BBL.BK": "bangkokbank.com",
  "BDMS.BK": "bdms.co.th",
  "TRUE.BK": "true.th",
  "SCC.BK": "scc.com",
  "CPN.BK": "cpn.co.th",
  "MINT.BK": "minor.com",
  "CRC.BK": "centralretail.com",
  "BANPU.BK": "banpu.com",
  "TOP.BK": "thaioilgroup.com",
  "OR.BK": "pttor.com",
  "KTC.BK": "ktc.co.th",
  "WHA.BK": "wha-group.com",
  "BTC-USD": "bitcoin.org",
  "ETH-USD": "ethereum.org",
};

// Gradient palettes for fallback avatars
const AVATAR_GRADIENTS = [
  "from-blue-600 to-indigo-600",
  "from-violet-600 to-purple-600",
  "from-emerald-600 to-teal-600",
  "from-rose-600 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-cyan-600 to-blue-600",
  "from-fuchsia-600 to-pink-600",
];

function getSymbolGradient(sym: string): string {
  let hash = 0;
  for (let i = 0; i < sym.length; i++) {
    hash = sym.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
}

export default function CompanyLogo({
  symbol,
  name,
  size = "md",
  className,
}: CompanyLogoProps) {
  // Step 0: Parqet CDN, Step 1: FMP / Domain Favicon, Step 2: Fallback Monogram Avatar
  const [errorStep, setErrorStep] = useState<number>(0);

  const cleanSymbol = symbol ? symbol.trim().toUpperCase() : "";
  // Strip .BK or exchange suffix for US CDNs if needed
  const baseSymbol = cleanSymbol.replace(/\.(BK|US|O|N)$/, "");

  const sizeClasses = {
    xs: "w-6 h-6 text-[10px] rounded-lg",
    sm: "w-8 h-8 text-xs rounded-xl",
    md: "w-9 h-9 text-xs rounded-xl",
    lg: "w-11 h-11 text-sm rounded-2xl",
    xl: "w-14 h-14 text-base rounded-2xl",
  };

  const domain = KNOWN_DOMAINS[cleanSymbol] || KNOWN_DOMAINS[baseSymbol];

  // Source candidates
  let currentSrc = "";
  if (errorStep === 0) {
    // 1st priority: Parqet CDN (supports cleanSymbol and baseSymbol)
    currentSrc = `https://assets.parqet.com/logos/symbol/${encodeURIComponent(cleanSymbol)}?format=png`;
  } else if (errorStep === 1) {
    if (domain) {
      // 2nd priority A: Google Favicon for mapped domain
      currentSrc = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
    } else {
      // 2nd priority B: Financial Modeling Prep for US symbols
      currentSrc = `https://financialmodelingprep.com/image-stock/${encodeURIComponent(baseSymbol)}.png`;
    }
  }

  // Display Monogram if errorStep >= 2 or no symbol
  if (!cleanSymbol || errorStep >= 2) {
    const letters = cleanSymbol.replace(/[^A-Z0-9]/g, "").slice(0, 3) || "STK";
    const gradient = getSymbolGradient(cleanSymbol);

    return (
      <div
        className={cn(
          "shrink-0 flex items-center justify-center font-mono font-extrabold text-white bg-gradient-to-br shadow-sm select-none border border-white/10",
          sizeClasses[size],
          gradient,
          className
        )}
        title={name || cleanSymbol}
      >
        {letters}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "shrink-0 relative overflow-hidden bg-card-bg/80 border border-border/80 flex items-center justify-center shadow-sm p-1",
        sizeClasses[size],
        className
      )}
      title={name || cleanSymbol}
    >
      <img
        src={currentSrc}
        alt={`${cleanSymbol} logo`}
        className="w-full h-full object-contain rounded-md"
        loading="lazy"
        onError={() => setErrorStep((prev) => prev + 1)}
      />
    </div>
  );
}
