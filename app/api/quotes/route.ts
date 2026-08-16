import { NextResponse } from 'next/server';
import { sanitizeSymbols } from '@/lib/security';

// In-memory cache to prevent spamming Yahoo Finance
const quoteCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 15000; // 15 seconds

async function fetchChunk(symbols: string[], range: string = '7d', interval: string = '1d'): Promise<any[]> {
  if (symbols.length === 0) return [];
  
  const symbolsParam = symbols.join(',');
  const url = `https://query2.finance.yahoo.com/v7/finance/spark?symbols=${encodeURIComponent(symbolsParam)}&range=${range}&interval=${interval}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
      next: { revalidate: 15 },
    });

    if (res.ok) {
      const data = await res.json();
      return data.spark?.result || [];
    }
  } catch (e) {
    console.warn(`Chunk fetch failed for ${symbolsParam}, falling back to individual fetches`, e);
  }

  // Fallback: fetch individually if chunk fails (e.g. invalid symbol in chunk)
  const individualResults: any[] = [];
  await Promise.allSettled(
    symbols.map(async (sym) => {
      try {
        const singleUrl = `https://query2.finance.yahoo.com/v7/finance/spark?symbols=${encodeURIComponent(sym)}&range=${range}&interval=${interval}`;
        const singleRes = await fetch(singleUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          },
        });
        if (singleRes.ok) {
          const singleData = await singleRes.json();
          if (singleData.spark?.result?.[0]) {
            individualResults.push(singleData.spark.result[0]);
          }
        }
      } catch {}
    })
  );

  return individualResults;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get('symbols');
  const range = searchParams.get('range') || '7d';
  const interval = searchParams.get('interval') || '1d';

  if (!symbolsParam) {
    return NextResponse.json({ error: "Missing symbols parameter" }, { status: 400 });
  }

  const rawList = symbolsParam.split(',');
  const rawSymbols = sanitizeSymbols(rawList, 50);

  if (rawSymbols.length === 0) {
    return NextResponse.json({ spark: { result: [] } });
  }

  const cacheKey = `${rawSymbols.sort().join(',')}_${range}_${interval}`;
  const cached = quoteCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.data);
  }

  try {
    // Split into chunks of maximum 8 symbols to prevent Yahoo 400 Bad Request
    const CHUNK_SIZE = 8;
    const chunks: string[][] = [];
    for (let i = 0; i < rawSymbols.length; i += CHUNK_SIZE) {
      chunks.push(rawSymbols.slice(i, i + CHUNK_SIZE));
    }

    const chunkPromises = chunks.map((chunk) => fetchChunk(chunk, range, interval));
    const results = await Promise.all(chunkPromises);
    const combinedResults = results.flat();

    const responsePayload = {
      spark: {
        result: combinedResults,
      },
    };

    quoteCache.set(cacheKey, { data: responsePayload, timestamp: Date.now() });

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    console.error('Quotes API Error:', error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch quotes", spark: { result: [] } },
      { status: 500 }
    );
  }
}
