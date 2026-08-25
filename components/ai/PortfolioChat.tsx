"use client";

import { useState, useRef, useEffect } from "react";
import { usePortfolioQuotes } from "@/hooks/usePortfolioQuotes";
import { useCurrency } from "@/context/CurrencyContext";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const QUICK_QUESTIONS = [
  "หุ้นไหนในพอร์ตของฉันทำกำไรได้ดีที่สุด?",
  "มีหุ้นตัวไหนที่ควรตัดขาดทุนไหม?",
  "พอร์ตของฉันมีความเสี่ยงอย่างไร?",
  "แนะนำว่าควร rebalance พอร์ตไหม?",
];

export default function PortfolioChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { holdings, portfolioStats } = usePortfolioQuotes();
  const { currency, exchangeRate } = useCurrency();

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: `สวัสดีครับ! 👋 ผมคือ **StockWise AI** ผู้ช่วยวิเคราะห์พอร์ตส่วนตัวของคุณ\n\nตอนนี้ผมเห็นพอร์ตของคุณมี **${holdings.length} หุ้น** มูลค่ารวม **$${portfolioStats.totalValue.toFixed(2)}** ถามได้เลยนะครับ!`,
        timestamp: new Date(),
      }]);
    }
  }, [isOpen, holdings.length, portfolioStats.totalValue]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = { role: "user", content: trimmed, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/portfolio-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          holdings: holdings.map((h) => ({
            symbol: h.symbol,
            name: h.name,
            shares: h.shares,
            avgCost: h.avgCost,
            currentPrice: h.currentPrice,
          })),
          portfolioStats,
          currency,
          exchangeRate,
        }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || data.error || "ขออภัย ไม่สามารถตอบได้ในขณะนี้",
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้งครับ", timestamp: new Date() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  /** Render markdown-like bold (**text**) and line breaks */
  const renderContent = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <>
      {/* Floating Button */}
      <button
        id="portfolio-chat-btn"
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 md:z-50 w-13 h-13 sm:w-14 sm:h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-300 group cursor-pointer",
          "bg-gradient-to-br from-accent to-purple-500 hover:scale-110 active:scale-95",
          isOpen && "opacity-0 pointer-events-none scale-75"
        )}
        title="AI Portfolio Chat"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <path d="M8 10h8" />
          <path d="M8 14h5" />
        </svg>
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-2xl bg-accent/40 animate-ping opacity-75 pointer-events-none" />
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-20 md:bottom-6 right-3 sm:right-4 md:right-6 left-3 sm:left-auto z-50 md:w-[400px] max-w-[calc(100vw-1.5rem)] h-[580px] max-h-[calc(100vh-6.5rem)] md:max-h-[640px] flex flex-col rounded-3xl border border-border/80 bg-card-bg/95 backdrop-blur-2xl shadow-2xl animate-fade-in-up overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 bg-gradient-to-r from-accent/10 to-purple-500/10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center shadow-md flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 1 0 10 10" />
                  <path d="M12 8v4l3 3" />
                  <path d="M18 2l2 2-2 2" />
                  <path d="M22 2l-2 2" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">StockWise AI</p>
                <p className="text-[10px] text-muted flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  รู้ข้อมูลพอร์ตจริงของคุณ
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-muted-bg transition-all"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex gap-2.5", msg.role === "user" ? "justify-end" : "justify-start")}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
                      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm3.5-9a1.5 1.5 0 1 0-1.5-1.5A1.5 1.5 0 0 0 15.5 11zm-7 0a1.5 1.5 0 1 0-1.5-1.5A1.5 1.5 0 0 0 8.5 11zm3.5 6a5 5 0 0 0 4.58-3H7.42A5 5 0 0 0 12 17z"/>
                    </svg>
                  </div>
                )}
                <div className={cn(
                  "max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-accent text-white rounded-tr-sm"
                    : "bg-muted-bg/60 text-foreground rounded-tl-sm border border-border/40"
                )}>
                  {msg.content.split("\n").map((line, j) => (
                    <p key={j} className={j > 0 ? "mt-1" : ""}>{renderContent(line)}</p>
                  ))}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
                <div className="bg-muted-bg/60 border border-border/40 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex-shrink-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">คำถามยอดนิยม</p>
              <div className="flex flex-col gap-1">
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-left text-xs text-muted hover:text-accent px-3 py-1.5 rounded-lg hover:bg-accent/10 transition-all border border-transparent hover:border-accent/20"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-border/50 flex-shrink-0">
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
              className="flex gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="ถามเกี่ยวกับพอร์ตของคุณ..."
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-input-bg border border-input-border text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 rounded-xl bg-accent hover:bg-accent/90 disabled:opacity-40 flex items-center justify-center transition-all active:scale-95 flex-shrink-0 shadow-md"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
