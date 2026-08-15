"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface NewsItem {
  uuid: string;
  title: string;
  link: string;
  publisher: string;
}

interface NewsReaderModalProps {
  news: NewsItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function NewsReaderModal({ news, isOpen, onClose }: NewsReaderModalProps) {
  const [content, setContent] = useState<string | null>(null);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);

  useEffect(() => {
    if (!isOpen || !news) return;

    // Reset state
    setContent(null);
    setTranslatedContent(null);
    setError(null);
    setShowTranslation(false);
    
    // Don't fetch for mock tech analysis items
    if (news.uuid.startsWith('tech-')) {
      setContent("วิเคราะห์จากข้อมูล Technical Analysis และพฤติกรรมราคาหุ้นในอดีต (ไม่สามารถอ้างอิงจากแหล่งข่าวภายนอกได้)");
      return;
    }

    async function fetchNewsContent() {
      setIsLoadingContent(true);
      try {
        const res = await fetch(`/api/news-content?url=${encodeURIComponent(news!.link)}`);
        const data = await res.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setContent(data.content);
      } catch (err: any) {
        setError(err.message || "Failed to load news content.");
      } finally {
        setIsLoadingContent(false);
      }
    }

    fetchNewsContent();
  }, [isOpen, news]);

  async function translateContent() {
    if (!content || translatedContent) {
      setShowTranslation(true);
      return;
    }

    setIsTranslating(true);
    try {
      const res = await fetch(`/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content })
      });
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setTranslatedContent(data.translatedText);
      setShowTranslation(true);
    } catch (err: any) {
      alert("Translation failed: " + (err.message || "Unknown error"));
    } finally {
      setIsTranslating(false);
    }
  }

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !news) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-card-bg border border-border rounded-2xl shadow-2xl flex flex-col animate-popup overflow-hidden">
        
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border/50 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-foreground leading-snug">{news.title}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-muted font-medium bg-muted-bg px-2 py-1 rounded-md">{news.publisher}</span>
              <a href={news.link} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline">
                ดูต้นฉบับบน Yahoo
              </a>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-muted hover:text-foreground bg-muted-bg hover:bg-border/50 rounded-full transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
          {isLoadingContent ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-4">
              <svg className="h-8 w-8 animate-spin text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <p className="text-sm text-muted animate-pulse">กำลังโหลดเนื้อหาข่าว...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <p className="text-loss mb-2">{error}</p>
              <a href={news.link} target="_blank" rel="noreferrer" className="text-sm text-accent hover:underline">คลิกที่นี่เพื่ออ่านบนเว็บต้นฉบับ</a>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none text-sm sm:text-base leading-relaxed text-foreground/90 whitespace-pre-line">
              {showTranslation && translatedContent ? translatedContent : content}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!isLoadingContent && !error && content && (
          <div className="p-4 border-t border-border/50 bg-muted-bg/30 flex justify-end gap-3 shrink-0">
            <button 
              onClick={() => setShowTranslation(false)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg transition-all",
                !showTranslation ? "bg-card-bg border border-border shadow-sm text-foreground" : "text-muted hover:text-foreground"
              )}
            >
              ต้นฉบับ (EN)
            </button>
            <button 
              onClick={translateContent}
              disabled={isTranslating}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2",
                showTranslation 
                  ? "bg-accent/20 border-accent/30 text-accent" 
                  : "bg-accent text-white hover:bg-accent/90 shadow-lg shadow-accent/20"
              )}
            >
              {isTranslating ? (
                <>
                  <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  กำลังแปล...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>
                  แปลเป็นภาษาไทย (AI)
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
