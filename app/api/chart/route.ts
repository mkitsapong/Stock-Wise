import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: "Missing symbol parameter" }, { status: 400 });
  }

  try {
    // Fetch 2 years of daily data
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2y`;
    
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

        const date = new Date(timestamp[i] * 1000);
        const dateString = date.toISOString().split('T')[0]; // "YYYY-MM-DD"

        formattedData.push({
          date: dateString,
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
