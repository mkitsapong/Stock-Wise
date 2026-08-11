import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get('symbols');

  if (!symbolsParam) {
    return NextResponse.json({ error: "Missing symbols parameter" }, { status: 400 });
  }

  try {
    // We use the spark API as it allows batch querying multiple symbols efficiently
    const url = `https://query2.finance.yahoo.com/v7/finance/spark?symbols=${encodeURIComponent(symbolsParam)}&range=1d&interval=1d`;
    
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    if (!res.ok) {
      throw new Error(`Yahoo Finance API responded with status: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Quotes API Proxy Error:', error);
    return NextResponse.json({ error: "Failed to fetch quotes" }, { status: 500 });
  }
}
