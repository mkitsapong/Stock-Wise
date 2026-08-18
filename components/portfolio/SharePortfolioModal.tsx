"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { usePortfolioQuotes } from "@/hooks/usePortfolioQuotes";
import { useTransactions } from "@/context/TransactionContext";
import { useCurrency } from "@/context/CurrencyContext";
import { calculateDiversificationHealth } from "@/lib/diversification";
import {
  CardTheme,
  CardAspectRatio,
  renderShareCardToCanvas,
  generateShareCardBlob,
  downloadShareCard,
} from "@/lib/shareCardCanvas";
import {
  PortfolioShareSnapshot,
  getShareUrl,
  copyImageToClipboard,
  shareViaWebShare,
} from "@/lib/shareUtils";
import { cn } from "@/lib/utils";

interface SharePortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SharePortfolioModal({ isOpen, onClose }: SharePortfolioModalProps) {
  const { holdings, portfolioStats } = usePortfolioQuotes();
  const { activePortfolio } = useTransactions();
  const { currency } = useCurrency();

  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<CardTheme>("neon");
  const [aspectRatio, setAspectRatio] = useState<CardAspectRatio>("square");
  const [hideBalances, setHideBalances] = useState<boolean>(true);
  const [isCopyingImage, setIsCopyingImage] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopyingLink, setIsCopyingLink] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate Health & stats
  const health = useMemo(() => calculateDiversificationHealth(holdings), [holdings]);

  const totalValue = portfolioStats.totalValue;
  const totalCost = portfolioStats.totalCost;
  const unrealizedPL = portfolioStats.unrealizedPL;
  const returnPercent = totalCost > 0 ? (unrealizedPL / totalCost) * 100 : 0;

  // Build Snapshot Object
  const snapshot: PortfolioShareSnapshot = useMemo(() => {
    const totalCurrentVal = holdings.reduce((sum, h) => sum + (h.shares * (h.currentPrice || h.avgCost || 0)), 0) || 1;

    const shareableHoldings = holdings.map((h) => {
      const currentPrice = h.currentPrice || h.avgCost || 0;
      const hVal = h.shares * currentPrice;
      const weight = (hVal / totalCurrentVal) * 100;
      const plPct = h.avgCost > 0 ? ((currentPrice - h.avgCost) / h.avgCost) * 100 : 0;

      return {
        symbol: h.symbol,
        name: h.name,
        weight: Number(weight.toFixed(1)),
        shares: h.shares,
        value: hVal,
        avgCost: h.avgCost,
        currentPrice: currentPrice,
        plPercent: Number(plPct.toFixed(1)),
      };
    });

    return {
      v: 1,
      name: activePortfolio?.name || "My Portfolio",
      strategy: activePortfolio?.strategy || "GROWTH",
      totalValue: Number(totalValue.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      unrealizedPL: Number(unrealizedPL.toFixed(2)),
      returnPercent: Number(returnPercent.toFixed(2)),
      healthScore: health.score,
      healthGrade: health.grade,
      currency: currency,
      hideBalances: hideBalances,
      holdings: shareableHoldings,
      updatedAt: new Date().toISOString(),
    };
  }, [
    holdings,
    portfolioStats,
    activePortfolio,
    currency,
    hideBalances,
    health,
    totalValue,
    totalCost,
    unrealizedPL,
    returnPercent,
  ]);

  // Redraw Canvas whenever options change
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    renderShareCardToCanvas(canvasRef.current, {
      snapshot,
      theme,
      aspectRatio,
    });
  }, [isOpen, snapshot, theme, aspectRatio]);

  // Toast Auto-dismiss
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  if (!isOpen || !mounted) return null;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadShareCard(
        { snapshot, theme, aspectRatio },
        `stockwise-${(snapshot.name || "portfolio").toLowerCase().replace(/\s+/g, "-")}.png`
      );
      setToastMessage("📸 ดาวน์โหลดรูปภาพสำเร็จแล้ว!");
    } catch (err) {
      console.error(err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyImage = async () => {
    setIsCopyingImage(true);
    try {
      const blob = await generateShareCardBlob({ snapshot, theme, aspectRatio });
      if (blob) {
        const success = await copyImageToClipboard(blob);
        if (success) {
          setToastMessage("📋 คัดลอกรูปภาพแล้ว! วาง (Ctrl+V) ในแชทได้ทันที");
        } else {
          // Fallback to downloading
          await handleDownload();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCopyingImage(false);
    }
  };

  const handleCopyLink = async () => {
    setIsCopyingLink(true);
    try {
      const url = getShareUrl(snapshot);
      await navigator.clipboard.writeText(url);
      setToastMessage("🔗 คัดลอกลิงก์แชร์พอร์ตเรียบร้อยแล้ว!");
    } catch (err) {
      console.error(err);
    } finally {
      setIsCopyingLink(false);
    }
  };

  const handleNativeShare = async () => {
    const url = getShareUrl(snapshot);
    const blob = await generateShareCardBlob({ snapshot, theme, aspectRatio });
    const file = blob
      ? new File([blob], "stockwise-portfolio.png", { type: "image/png" })
      : undefined;

    const sign = snapshot.returnPercent >= 0 ? "+" : "";
    const shared = await shareViaWebShare({
      title: `StockWise — ${snapshot.name}`,
      text: `ดูผลตอบแทนพอร์ต ${snapshot.name} (${sign}${snapshot.returnPercent.toFixed(2)}%) บน StockWise!`,
      url,
      files: file ? [file] : undefined,
    });

    if (shared) {
      setToastMessage("📲 เปิดหน้าต่างแชร์สำเร็จ");
    } else {
      handleCopyLink();
    }
  };

  const shareUrl = getShareUrl(snapshot);
  const shareText = encodeURIComponent(
    `ดูผลตอบแทนพอร์ต ${snapshot.name} (${snapshot.returnPercent >= 0 ? "+" : ""}${snapshot.returnPercent.toFixed(2)}%) บน StockWise Tracker! 🚀\n${shareUrl}`
  );

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl bg-card-bg border border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted-bg/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center shadow-md">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                Share Portfolio
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-mono font-semibold">
                  Social Card & Link
                </span>
              </h2>
              <p className="text-xs text-muted">
                สร้างภาพการ์ดสรุปพอร์ตระดับพรีเมียมและลิงก์สำหรับแชร์
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-muted-bg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Live Card Preview */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center bg-muted-bg/40 border border-border/60 rounded-2xl p-4 relative min-h-[380px]">
            <p className="text-[11px] font-bold tracking-wider uppercase text-muted mb-3 self-start flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Card Preview
            </p>

            <div className="relative w-full flex items-center justify-center overflow-hidden">
              <canvas
                ref={canvasRef}
                className={cn(
                  "rounded-2xl shadow-2xl transition-all duration-300 border border-white/10 max-w-full",
                  aspectRatio === "square"
                    ? "w-full max-w-[360px] sm:max-w-[400px] aspect-square object-contain"
                    : "w-[240px] sm:w-[270px] aspect-[9/16] object-contain"
                )}
              />
            </div>

            <p className="text-[11px] text-muted mt-3 text-center">
              ความละเอียดสูง 2x Retina พร้อมลายน้ำและระบบยืนยันความถูกต้อง
            </p>
          </div>

          {/* Right Column: Customization Controls & Actions */}
          <div className="lg:col-span-5 space-y-5">
            {/* 1. Privacy Control (Hide Balances) */}
            <div className="p-4 rounded-2xl bg-muted-bg/40 border border-border/70 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">🔒</span>
                  <div>
                    <label htmlFor="hide-balance-toggle" className="text-xs font-bold text-foreground cursor-pointer">
                      ซ่อนจำนวนเงินสด (Show % Only)
                    </label>
                    <p className="text-[11px] text-muted">
                      แสดงเฉพาะ % กำไรและสัดส่วนหุ้น เพื่อความเป็นส่วนตัว
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    id="hide-balance-toggle"
                    type="checkbox"
                    checked={hideBalances}
                    onChange={(e) => setHideBalances(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted-bg peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent border border-border"></div>
                </label>
              </div>
            </div>

            {/* 2. Theme Presets */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">
                เลือกธีมสีการ์ด (Theme)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "neon", label: "Neon Midnight", color: "from-indigo-500 to-sky-400" },
                  { id: "emerald", label: "Bullish Green", color: "from-emerald-500 to-teal-400" },
                  { id: "gold", label: "Midnight Gold", color: "from-amber-500 to-yellow-300" },
                  { id: "cyber", label: "Cyber Sunset", color: "from-pink-500 to-purple-500" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id as CardTheme)}
                    className={cn(
                      "flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-semibold transition-all text-left",
                      theme === t.id
                        ? "border-accent bg-accent/10 text-foreground shadow-sm ring-1 ring-accent"
                        : "border-border/60 text-muted hover:text-foreground hover:bg-muted-bg/50"
                    )}
                  >
                    <span className={cn("w-4 h-4 rounded-full bg-gradient-to-br shadow-inner shrink-0", t.color)} />
                    <span className="truncate">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Aspect Ratio Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">
                อัตราส่วนรูปภาพ (Format)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setAspectRatio("square")}
                  className={cn(
                    "flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all",
                    aspectRatio === "square"
                      ? "border-accent bg-accent/10 text-foreground shadow-sm ring-1 ring-accent"
                      : "border-border/60 text-muted hover:text-foreground hover:bg-muted-bg/50"
                  )}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                  </svg>
                  <span>1:1 Square (Post)</span>
                </button>

                <button
                  onClick={() => setAspectRatio("story")}
                  className={cn(
                    "flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all",
                    aspectRatio === "story"
                      ? "border-accent bg-accent/10 text-foreground shadow-sm ring-1 ring-accent"
                      : "border-border/60 text-muted hover:text-foreground hover:bg-muted-bg/50"
                  )}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="2" width="14" height="20" rx="2" />
                  </svg>
                  <span>9:16 Story (IG/TikTok)</span>
                </button>
              </div>
            </div>

            {/* 4. Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <div className="grid grid-cols-2 gap-2">
                {/* Download PNG */}
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-accent text-white font-bold text-xs shadow-lg shadow-accent/20 hover:bg-accent/90 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isDownloading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  )}
                  <span>Save Image</span>
                </button>

                {/* Copy Image */}
                <button
                  onClick={handleCopyImage}
                  disabled={isCopyingImage}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-muted-bg border border-border text-foreground font-bold text-xs hover:bg-white/10 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isCopyingImage ? (
                    <span className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  )}
                  <span>Copy Image</span>
                </button>
              </div>

              {/* Copy Share Link */}
              <button
                onClick={handleCopyLink}
                disabled={isCopyingLink}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-card-bg border border-border/80 text-foreground font-semibold text-xs hover:border-accent hover:text-accent transition-all cursor-pointer"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                <span>คัดลอกลิงก์แชร์พอร์ต (Read-Only Link)</span>
              </button>

              {/* Mobile / Social Share Row */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleNativeShare}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-muted-bg/50 border border-border/50 text-[11px] font-medium text-muted hover:text-foreground transition-colors"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  <span>แชร์ด่วน</span>
                </button>

                {/* X / Twitter */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${shareText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-muted-bg/50 border border-border/50 text-muted hover:text-foreground hover:border-accent transition-colors"
                  title="Share to X"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>

                {/* Line */}
                <a
                  href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-muted-bg/50 border border-border/50 text-muted hover:text-[#06C755] hover:border-[#06C755] transition-colors"
                  title="Share to Line"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 5.82 2 10.53c0 4.24 3.61 7.79 8.5 8.41.33.07.78.22.89.51.1.26.07.67.03.93l-.15.9c-.05.28-.21.98.86.53 1.07-.44 5.79-3.41 7.9-5.84C21.43 14.34 22 12.51 22 10.53 22 5.82 17.52 2 12 2z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-foreground text-background font-semibold text-xs shadow-2xl flex items-center gap-2 animate-fade-in-up border border-white/20">
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
