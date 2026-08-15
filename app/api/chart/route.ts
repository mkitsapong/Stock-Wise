import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const tf = searchParams.get('tf') || 'ALL';

  if (!symbol) {
    return NextResponse.json({ error: "Missing symbol parameter" }, { status: 400 });
  }

  try {
    let interval = '1d';
    let range = 'max';

    if (tf === '1D') {
      interval = '5m';
      range = '1d';
    }

    // Fetch historical data
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;
    
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
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
        if (tf === '1D') {
          // For intraday, lightweight-charts needs unix timestamp in seconds
          // Actually Yahoo Finance timestamp is already in seconds, but we need to ensure it's a number
          // And we might need to offset timezone if we want local time, but lightweight charts handles local time conversion if configured, or just pass seconds.
          timeValue = timestamp[i] as number;
        } else {
          // For daily, it expects "YYYY-MM-DD"
          const date = new Date(timestamp[i] * 1000);
          timeValue = date.toISOString().split('T')[0];
        }

        formattedData.push({
          date: timeValue,
          open: quote.open[i],
          high: quote.high[i],
          low: quote.low[i],
          close: quote.close[i],
        });
      }
    }

    return NextResponse.json({
      meta: {
        symbol: meta.symbol,
        longName: meta.longName || meta.shortName || meta.symbol,
        currency: meta.currency,
      },
      data: formattedData
    });
  } catch (error: any) {
    console.error('Chart API Error:', error);
    return NextResponse.json({ error: error.message || "Failed to fetch chart data" }, { status: 500 });
  }
}
