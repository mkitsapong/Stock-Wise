import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get('q');

  if (!rawQuery || typeof rawQuery !== 'string' || rawQuery.trim().length === 0) {
    return NextResponse.json({ quotes: [] });
  }

  const query = rawQuery.trim().slice(0, 100);

  try {
    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`;
    
    const res = await fetch(url, {
      headers: {
        // Adding a User-Agent helps prevent some APIs from blocking the request
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    if (!res.ok) {
      throw new Error(`Yahoo Finance API responded with status: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Search API Proxy Error:', error);
    return NextResponse.json({ quotes: [] }, { status: 500 });
  }
}
