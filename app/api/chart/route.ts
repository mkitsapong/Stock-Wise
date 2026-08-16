import { NextResponse } from 'next/server';
import { sanitizeSymbol } from '@/lib/security';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawSymbol = searchParams.get('symbol');
  const tf = searchParams.get('tf') || 'ALL';

  const symbol = sanitizeSymbol(rawSymbol || '');

  if (!symbol) {
    return NextResponse.json({ error: "Invalid or missing symbol parameter" }, { status: 400 });
  }

  try {
    let interval = '1d';
    let range = '2y';

    if (tf === '1D') {
      interval = '5m';
      range = '1d';
    } else if (tf === '1W') {
      interval = '15m';
      range = '5d';
    } else if (tf === '1M' || tf === '3M' || tf === '6M' || tf === '1Y') {
      interval = '1d';
      range = '2y'; // Provides enough historical data for 50/100/200 EMA calculations
    } else if (tf === 'ALL') {
      interval = '1d';
      range = 'max';
    }

    // Fetch historical data from Yahoo Finance
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;
    
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      next: { revalidate: tf === '1D' ? 30 : 300 } // Cache 30s for intraday, 5m for daily
    });

    if (!res.ok) {
      throw new Error(`Yahoo Finance API responded with status: ${res.status}`);
    }

    const data = await res.json();
    const result = data.chart?.result?.[0];

    if (!result) {
      throw new Error("No data found for symbol");
    }

    const { timestamp, indicators, meta } = result;
    const quote = indicators.quote[0];

    // Format to OHLC
    const formattedData = [];
    const isIntraday = tf === '1D' || tf === '1W';

    if (timestamp && quote.open && quote.high && quote.low && quote.close) {
      for (let i = 0; i < timestamp.length; i++) {
        // Skip null values which can occur in Yahoo's response
        if (
          quote.open[i] === null || 
          quote.high[i] === null || 
          quote.low[i] === null || 
          quote.close[i] === null
        ) {
          continue;
        }

        let timeValue: string | number;
        if (isIntraday) {
          // For intraday (1D, 1W), lightweight-charts uses unix timestamp in seconds (number)
          timeValue = timestamp[i] as number;
        } else {
          // For daily (1M, 3M, 6M, 1Y, ALL), it expects "YYYY-MM-DD"
          const date = new Date(timestamp[i] * 1000);
          timeValue = date.toISOString().split('T')[0];
        }

        formattedData.push({
          date: timeValue,
          open: Number(quote.open[i].toFixed(4)),
          high: Number(quote.high[i].toFixed(4)),
          low: Number(quote.low[i].toFixed(4)),
          close: Number(quote.close[i].toFixed(4)),
        });
      }
    }

    // Deduplicate and strictly sort ascending by timestamp
    const uniqueMap = new Map<string | number, typeof formattedData[0]>();
    for (const item of formattedData) {
      if (item.date !== undefined && item.date !== null) {
        uniqueMap.set(item.date, item);
      }
    }

    const cleanData = Array.from(uniqueMap.values()).sort((a, b) => {
      const tA = typeof a.date === 'string' ? new Date(a.date).getTime() : Number(a.date);
      const tB = typeof b.date === 'string' ? new Date(b.date).getTime() : Number(b.date);
      return tA - tB;
    });

    return NextResponse.json({
      meta: {
        symbol: meta.symbol,
        longName: meta.longName || meta.shortName || meta.symbol,
        currency: meta.currency,
        regularMarketPrice: meta.regularMarketPrice,
        chartPreviousClose: meta.chartPreviousClose,
      },
      data: cleanData
    });
  } catch (error: any) {
    console.error('Chart API Error:', error);
    return NextResponse.json({ error: error.message || "Failed to fetch chart data" }, { status: 500 });
  }
}
