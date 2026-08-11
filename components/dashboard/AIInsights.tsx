"use client";

import { useState, useEffect } from "react";
import { formatCurrency, cn } from "@/lib/utils";

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
  const [expandedNewsId, setExpandedNewsId] = useState<string | null>(null);

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
          let categorized = false;

          // Check Bad first (since bad news often overrides good news in sentiment)
          if (BAD_KEYWORDS.some(kw => titleLower.includes(kw))) {
            bad.push(item);
            categorized = true;
          }
          // Then check Good
          else if (GOOD_KEYWORDS.some(kw => titleLower.includes(kw))) {
            good.push(item);
            categorized = true;
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
            cautionEvents.push(`ราคาทะลุแนวต้านที่ 1 มาแล้ว ปัจจุบันอยู่ที่ ${formatCurrency(currentPrice)} ระวังแรงเทขายรุนแรงใกล้แนวต้านถัดไป`);
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

        setGoodNews(good.slice(0, 3)); // Max 3 items
        setBadNews(bad.slice(0, 3));   // Max 3 items
        setCautions(cautionEvents.slice(0, 3)); // Max 3 items

      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchInsights();
  }, [symbol, chartData]);

  if (isLoading) {
    return (
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="glass-card p-5 h-32 rounded-xl border border-border/50">
             <div className="h-4 w-24 bg-muted/20 rounded mb-4"></div>
             <div className="space-y-2">
               <div className="h-3 w-full bg-muted/10 rounded"></div>
               <div className="h-3 w-4/5 bg-muted/10 rounded"></div>
             </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up opacity-0 stagger-6">
      
      {/* Good News */}
      <div className="glass-card p-5 rounded-xl border border-transparent hover:border-profit/30 transition-all group relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-profit/10 rounded-full blur-[30px] pointer-events-none transition-all group-hover:bg-profit/20" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-profit mb-4 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
          ข่าวดี / เชิงบวก
        </h3>
        <ul className="space-y-3">
          {goodNews.length > 0 ? goodNews.map(news => (
            <NewsSummaryCard 
              key={news.uuid} 
              news={news} 
              isExpanded={expandedNewsId === news.uuid}
              onToggle={() => setExpandedNewsId(expandedNewsId === news.uuid ? null : news.uuid)}
              type="profit"
            />
          )) : (
            <li className="text-sm text-muted">ไม่มีข่าวเชิงบวกที่เด่นชัดในช่วงนี้</li>
          )}
        </ul>
      </div>

      {/* Bad News */}
      <div className="glass-card p-5 rounded-xl border border-transparent hover:border-loss/30 transition-all group relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-loss/10 rounded-full blur-[30px] pointer-events-none transition-all group-hover:bg-loss/20" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-loss mb-4 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>
          ข่าวร้าย / เชิงลบ
        </h3>
        <ul className="space-y-3">
          {badNews.length > 0 ? badNews.map(news => (
            <NewsSummaryCard 
              key={news.uuid} 
              news={news} 
              isExpanded={expandedNewsId === news.uuid}
              onToggle={() => setExpandedNewsId(expandedNewsId === news.uuid ? null : news.uuid)}
              type="loss"
            />
          )) : (
            <li className="text-sm text-muted">ไม่มีข่าวเชิงลบที่เด่นชัดในช่วงนี้</li>
          )}
        </ul>
      </div>

      {/* Caution */}
      <div className="glass-card p-5 rounded-xl border border-transparent hover:border-amber-500/30 transition-all group relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/10 rounded-full blur-[30px] pointer-events-none transition-all group-hover:bg-amber-500/20" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-500 mb-4 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          ข้อควรระวัง
        </h3>
        <ul className="space-y-3">
          {cautions.length > 0 ? cautions.map((c, idx) => (
            <li key={idx} className="text-sm text-foreground/90 leading-tight flex gap-2">
              <span className="text-amber-500 mt-0.5">•</span>
              <span>{c}</span>
            </li>
          )) : (
            <li className="text-sm text-muted">ยังไม่มีข้อควรระวังพิเศษในขณะนี้</li>
          )}
        </ul>
      </div>

    </div>
  );
}

function NewsSummaryCard({ 
  news, 
  isExpanded, 
  onToggle, 
  type 
}: { 
  news: NewsItem; 
  isExpanded: boolean; 
  onToggle: () => void;
  type: "profit" | "loss";
}) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isExpanded && !summary) {
      // Don't fetch for tech-support/bullish mock items
      if (news.uuid.startsWith('tech-')) {
        setSummary("วิเคราะห์จากข้อมูล Technical Analysis และพฤติกรรมราคาหุ้นในอดีต (ไม่สามารถอ้างอิงจากแหล่งข่าวภายนอกได้)");
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
    <li className="text-sm border-b border-border/30 pb-2 last:border-0 last:pb-0">
      <button 
        onClick={onToggle}
        className={cn(
          "w-full text-left text-foreground hover:underline line-clamp-2 leading-tight focus:outline-none focus:underline",
          type === "profit" ? "hover:text-profit focus:text-profit" : "hover:text-loss focus:text-loss"
        )}
      >
        {news.title}
      </button>
      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px] text-muted">{news.publisher}</span>
        <a href={news.link} target="_blank" rel="noreferrer" className="text-[10px] text-accent hover:underline flex items-center gap-1">
          อ่านข่าวเต็ม <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </a>
      </div>

      {isExpanded && (
        <div className="mt-3 p-3 bg-card-bg/80 border border-border/50 rounded-lg text-xs leading-relaxed animate-fade-in-up text-muted-foreground">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted animate-pulse">
               <svg className="h-3 w-3 animate-spin text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
               กำลังใช้ AI อ่านและสรุปข่าว...
            </div>
          ) : (
             <div className="whitespace-pre-line">{summary}</div>
          )}
        </div>
      )}
    </li>
  );
}
