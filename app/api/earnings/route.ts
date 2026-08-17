import { NextResponse } from 'next/server';
import { sanitizeSymbols } from '@/lib/security';

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get('symbols');

  if (!symbolsParam) {
    return NextResponse.json({ error: 'Missing symbols' }, { status: 400 });
  }

  const symbols = sanitizeSymbols(symbolsParam.split(','), 20);

  const cacheKey = symbols.sort().join(',');
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  const results = await Promise.allSettled(
    symbols.map(async (symbol) => {
      try {
        const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=calendarEvents,earningsTrend`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
          },
          next: { revalidate: 21600 }, // 6 hours
        });

        if (!res.ok) return null;

        const data = await res.json();
        const result = data?.quoteSummary?.result?.[0];
        if (!result) return null;

        const calendar = result.calendarEvents;
        const earningsDates: number[] = calendar?.earnings?.earningsDate?.map((d: any) => d.raw) || [];

        return {
          symbol,
          earningsDate: earningsDates[0] ?? null,  // Next earnings date (Unix timestamp)
          earningsDateFormatted: earningsDates[0]
            ? new Date(earningsDates[0] * 1000).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
              })
            : null,
          epsEstimate: result.earningsTrend?.trend?.[0]?.earningsEstimate?.avg?.raw ?? null,
        };
      } catch {
        return null;
      }
    })
  );

  const earnings = results
    .filter((r) => r.status === 'fulfilled' && r.value !== null)
    .map((r: any) => r.value)
    .filter((e) => e.earningsDate !== null)
    .sort((a, b) => a.earningsDate - b.earningsDate);

  const payload = { earnings };
  cache.set(cacheKey, { data: payload, timestamp: Date.now() });

  return NextResponse.json(payload);
}
