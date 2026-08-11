import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: "Missing symbol parameter" }, { status: 400 });
  }

  try {
    const response = await fetch(`https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(symbol)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`Yahoo API responded with status ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({ news: data.news || [] });
    
  } catch (error: any) {
    console.error("Error fetching insights:", error);
    return NextResponse.json({ error: "Failed to fetch insights data" }, { status: 500 });
  }
}
