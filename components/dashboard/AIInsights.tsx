"use client";

import { useState, useEffect } from "react";
import { formatCurrency, cn } from "@/lib/utils";
import NewsReaderModal from "./NewsReaderModal";

interface NewsItem {
  uuid: string;
  title: string;
  link: string;
  publisher: string;
}

interface AIInsightsProps {
  symbol: string;
  chartData: any[];
}

// Keyword lists for heuristic sentiment analysis
const GOOD_KEYWORDS = ["upgrade", "surge", "jump", "gain", "beat", "buy", "soar", "outperform", "bullish", "record", "rally", "strength", "strong", "higher"];
const BAD_KEYWORDS = ["downgrade", "miss", "drop", "sell", "lawsuit", "cancel", "plunge", "fall", "weak", "bearish", "risk", "delay", "cut", "lower"];
const CAUTION_KEYWORDS = ["beware", "warning", "volatile", "ahead", "wait", "watch", "report", "uncertain", "fed", "inflation"];

export default function AIInsights({ symbol, chartData }: AIInsightsProps) {
  const [goodNews, setGoodNews] = useState<NewsItem[]>([]);
  const [badNews, setBadNews] = useState<NewsItem[]>([]);
  const [cautions, setCautions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedNewsIds, setExpandedNewsIds] = useState<string[]>([]);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  useEffect(() => {
    async function fetchInsights() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/insights?symbol=${encodeURIComponent(symbol)}`);
        const data = await res.json();
        
        const news: NewsItem[] = data.news || [];
        const good: NewsItem[] = [];
        const bad: NewsItem[] = [];
        const cautionEvents: string[] = [];

        // Analyze news headlines
        news.forEach(item => {
          const titleLower = item.title.toLowerCase();

          // Check Bad first (since bad news often overrides good news in sentiment)
          if (BAD_KEYWORDS.some(kw => titleLower.includes(kw))) {
            bad.push(item);
          }
          // Then check Good
          else if (GOOD_KEYWORDS.some(kw => titleLower.includes(kw))) {
            good.push(item);
          }
          // Then check Caution
          else if (CAUTION_KEYWORDS.some(kw => titleLower.includes(kw))) {
            cautionEvents.push(`ข่าวที่ต้องติดตาม: ${item.title}`);
          }
        });

        // Add Technical Analysis Insights
        if (chartData && chartData.length >= 20) {
          const last20 = chartData.slice(-20);
          let high = -Infinity;
          let low = Infinity;
          last20.forEach(candle => {
            if (candle.high > high) high = candle.high;
            if (candle.low < low) low = candle.low;
          });
          const currentPrice = last20[last20.length - 1].close;
          const P = (high + low + currentPrice) / 3;
          const R1 = (2 * P) - low;
          const S1 = (2 * P) - high;
          const R2 = P + (high - low);
          const S2 = P - (high - low);
          if (currentPrice >= R2) {
            cautionEvents.push(`ราคาทะลุแนวต้านที่ 1 มาแล้ว ปัจจุบันอยู่ที่ ${formatCurrency(currentPrice)} ระวังแรงเทขายใกล้แนวต้านถัดไป`);
          } else if (currentPrice >= R1) {
            cautionEvents.push(`ราคาเข้าใกล้แนวต้านแรก (${formatCurrency(R1)}) อาจมีแรงเทขายทำกำไร`);
          } else if (currentPrice <= S2) {
            cautionEvents.push(`ราคาหลุดแนวรับแรกมาแล้ว ควรใช้ความระมัดระวังอย่างสูง หรือรอสัญญาณกลับตัว`);
          } else if (currentPrice <= S1) {
            good.push({
              uuid: "tech-support",
              title: `ราคาหุ้นย่อตัวลงมาใกล้แนวรับแรก (${formatCurrency(S1)}) อาจเป็นจังหวะทยอยสะสม (อิงจาก Technical)`,
              link: "#",
              publisher: "Technical Analysis"
            });
          } else if (currentPrice > P) {
            good.push({
              uuid: "tech-bullish",
              title: `ราคายืนเหนือ Pivot Point (${formatCurrency(P)}) โมเมนตัมระยะสั้นอยู่ในเชิงบวก`,
              link: "#",
              publisher: "Technical Analysis"
            });
          } else {
            cautionEvents.push(`ราคาวิ่งอยู่ต่ำกว่าเส้น Pivot Point (${formatCurrency(P)}) โมเมนตัมระยะสั้นค่อนข้างอ่อนแอ`);
          }
        }

        setGoodNews(good.slice(0, 3));
        setBadNews(bad.slice(0, 3));
        setCautions(cautionEvents.slice(0, 3));

      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchInsights();
  }, [symbol, chartData]);

  // Calculate Sentiment Score
  const totalSignals = goodNews.length + badNews.length + cautions.length;
  const goodPct = totalSignals > 0 ? Math.round((goodNews.length / totalSignals) * 100) : 50;
  const cautionPct = totalSignals > 0 ? Math.round((cautions.length / totalSignals) * 100) : 30;
  const badPct = totalSignals > 0 ? 100 - goodPct - cautionPct : 20;

  let overallSentiment = "Neutral / Mixed";
  let sentimentBadgeClass = "bg-amber-500/10 text-amber-500 border-amber-500/20";
  if (goodNews.length > badNews.length + 1) {
    overallSentiment = "Bullish Outlook";
    sentimentBadgeClass = "bg-profit/10 text-profit border-profit/20";
  } else if (badNews.length > goodNews.length + 1) {
    overallSentiment = "Bearish Outlook";
    sentimentBadgeClass = "bg-loss/10 text-loss border-loss/20";
  }

  if (isLoading) {
    return (
      <div className="mt-6 space-y-4 animate-pulse">
        <div className="glass-card p-6 rounded-2xl">
          <div className="h-5 w-48 bg-muted/20 rounded mb-4" />
          <div className="h-2 w-full bg-muted/15 rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card p-5 h-36 rounded-2xl border border-border/50">
               <div className="h-4 w-28 bg-muted/20 rounded mb-4"></div>
               <div className="space-y-2">
                 <div className="h-3 w-full bg-muted/10 rounded"></div>
                 <div className="h-3 w-4/5 bg-muted/10 rounded"></div>
               </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4 animate-fade-in-up opacity-0 stagger-6">
      
      {/* AI Sentiment Overview Banner */}
      <div className="glass-card p-5 sm:p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-32 bg-accent/10 rounded-full blur-[50px] pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl ai-gradient-badge flex items-center justify-center text-white shadow-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-foreground tracking-tight">
                  Gemini AI Market Sentiment & News Analysis
                </h3>
              </div>
              <p className="text-xs text-muted font-medium">Real-time news processing + technical signal integration for {symbol}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={cn("px-3 py-1 rounded-xl text-xs font-mono font-extrabold border shadow-sm", sentimentBadgeClass)}>
              {overallSentiment}
            </span>
          </div>
        </div>

        {/* Sentiment Proportion Gauge */}
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center justify-between text-[11px] font-mono text-muted font-semibold">
            <span className="text-profit">Bullish {goodPct}%</span>
            <span className="text-amber-500">Caution {cautionPct}%</span>
            <span className="text-loss">Bearish {badPct}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-border/40 overflow-hidden flex gap-0.5 p-0.5">
            <div className="h-full bg-profit rounded-l-full transition-all duration-500" style={{ width: `${goodPct}%` }} />
            <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${cautionPct}%` }} />
            <div className="h-full bg-loss rounded-r-full transition-all duration-500" style={{ width: `${badPct}%` }} />
          </div>
        </div>
      </div>

      {/* 3 Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Good News */}
        <div className="glass-card p-5 rounded-2xl border border-transparent hover:border-profit/30 transition-all group relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-profit/10 rounded-full blur-[30px] pointer-events-none transition-all group-hover:bg-profit/20" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-profit mb-3.5 flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
            Positive Catalyst / ข่าวเชิงบวก ({goodNews.length})
          </h4>
          <ul className="space-y-3">
            {goodNews.length > 0 ? goodNews.map(news => (
              <NewsSummaryCard 
                key={news.uuid} 
                news={news} 
                isExpanded={expandedNewsIds.includes(news.uuid)}
                onToggle={() => setExpandedNewsIds(prev => 
                  prev.includes(news.uuid) ? prev.filter(id => id !== news.uuid) : [...prev, news.uuid]
                )}
                onReadFullNews={() => setSelectedNews(news)}
                type="profit"
              />
            )) : (
              <li className="text-xs text-muted font-medium py-2">ไม่มีข่าวเชิงบวกที่เด่นชัดในช่วงนี้</li>
            )}
          </ul>
        </div>

        {/* Bad News */}
        <div className="glass-card p-5 rounded-2xl border border-transparent hover:border-loss/30 transition-all group relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-loss/10 rounded-full blur-[30px] pointer-events-none transition-all group-hover:bg-loss/20" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-loss mb-3.5 flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>
            Negative Risk / ข่าวเชิงลบ ({badNews.length})
          </h4>
          <ul className="space-y-3">
            {badNews.length > 0 ? badNews.map(news => (
              <NewsSummaryCard 
                key={news.uuid} 
                news={news} 
                isExpanded={expandedNewsIds.includes(news.uuid)}
                onToggle={() => setExpandedNewsIds(prev => 
                  prev.includes(news.uuid) ? prev.filter(id => id !== news.uuid) : [...prev, news.uuid]
                )}
                onReadFullNews={() => setSelectedNews(news)}
                type="loss"
              />
            )) : (
              <li className="text-xs text-muted font-medium py-2">ไม่มีข่าวเชิงลบที่เด่นชัดในช่วงนี้</li>
            )}
          </ul>
        </div>

        {/* Caution */}
        <div className="glass-card p-5 rounded-2xl border border-transparent hover:border-amber-500/30 transition-all group relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/10 rounded-full blur-[30px] pointer-events-none transition-all group-hover:bg-amber-500/20" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-3.5 flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            Key Watch Items / ข้อควรระวัง ({cautions.length})
          </h4>
          <ul className="space-y-2.5">
            {cautions.length > 0 ? cautions.map((c, idx) => (
              <li key={idx} className="text-xs text-foreground/90 leading-snug flex gap-2 border-b border-border/30 pb-2 last:border-0 last:pb-0">
                <span className="text-amber-500 font-bold">•</span>
                <span>{c}</span>
              </li>
            )) : (
              <li className="text-xs text-muted font-medium py-2">ยังไม่มีข้อควรระวังพิเศษในขณะนี้</li>
            )}
          </ul>
        </div>
      </div>

      {/* News Reader Modal */}
      <NewsReaderModal 
        news={selectedNews} 
        isOpen={!!selectedNews} 
        onClose={() => setSelectedNews(null)} 
      />
    </div>
  );
}

function NewsSummaryCard({ 
  news, 
  isExpanded, 
  onToggle, 
  onReadFullNews,
  type 
}: { 
  news: NewsItem; 
  isExpanded: boolean; 
  onToggle: () => void; 
  onReadFullNews: () => void; 
  type: "profit" | "loss";
}) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isExpanded && !summary) {
      if (news.uuid.startsWith('tech-')) {
        setSummary("วิเคราะห์จากข้อมูล Technical Analysis และพฤติกรรมราคาหุ้นในอดีต (สัญญาณทางเทคนิค)");
        return;
      }

      setIsLoading(true);
      fetch(`/api/news-summary?url=${encodeURIComponent(news.link)}`)
        .then(res => res.json())
        .then(data => {
          if (data.summary) {
            setSummary(data.summary);
          } else {
            setSummary("ไม่สามารถดึงข้อมูลสรุปข่าวได้ในขณะนี้ กรุณาคลิกอ่านข่าวเต็ม");
          }
        })
        .catch(() => setSummary("เกิดข้อผิดพลาดในการโหลดสรุปข่าว"))
        .finally(() => setIsLoading(false));
    }
  }, [isExpanded, news, summary]);

  return (
    <li className="text-xs border-b border-border/30 pb-2.5 last:border-0 last:pb-0">
      <button 
        onClick={onToggle}
        className={cn(
          "w-full text-left font-medium text-foreground hover:underline line-clamp-2 leading-snug focus:outline-none transition-colors cursor-pointer",
          type === "profit" ? "hover:text-profit" : "hover:text-loss"
        )}
      >
        {news.title}
      </button>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[10px] text-muted font-mono">{news.publisher}</span>
        <button 
          onClick={onReadFullNews} 
          className="text-[10px] text-accent hover:underline font-semibold flex items-center gap-1 relative z-10 cursor-pointer"
        >
          อ่านข่าวเต็ม <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </button>
      </div>

      {isExpanded && (
        <div className="mt-2.5 p-3 bg-card-bg/90 border border-border/60 rounded-xl text-[11px] leading-relaxed animate-fade-in-up text-muted-foreground relative z-10 shadow-sm">
          {isLoading ? (
            <div className="flex items-center gap-2 text-accent font-medium animate-pulse">
               <svg className="h-3.5 w-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
               AI กำลังประมวลผลและสรุปข่าว...
            </div>
          ) : (
             <div className="whitespace-pre-line text-foreground/90">
                {summary}
             </div>
          )}
        </div>
      )}
    </li>
  );
}

