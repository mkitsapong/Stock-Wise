import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

export async function POST(request: Request) {
  try {
    const { symbols } = await request.json();

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json({ error: "Missing or invalid symbols parameter" }, { status: 400 });
    }

    const uniqueSymbols = Array.from(new Set(symbols));
    
    // Fetch asset profiles and financial details in parallel
    const profiles = await Promise.allSettled(
      uniqueSymbols.map(async (sym: string) => {
        try {
          const result = await yf.quoteSummary(sym, {
            modules: ['assetProfile', 'summaryDetail', 'defaultKeyStatistics']
          }) as any;
          
          const assetProfile = result?.assetProfile || {};
          const summaryDetail = result?.summaryDetail || {};
          
          return {
            symbol: sym,
            sector: assetProfile.sector || 'Other/Unknown',
            industry: assetProfile.industry || 'Other/Unknown',
            marketCap: summaryDetail.marketCap || 0,
            dividendYield: summaryDetail.dividendYield ? summaryDetail.dividendYield * 100 : (summaryDetail.trailingAnnualDividendYield ? summaryDetail.trailingAnnualDividendYield * 100 : 0),
            dividendRate: summaryDetail.dividendRate || summaryDetail.trailingAnnualDividendRate || 0,
          };
        } catch (err) {
          return {
            symbol: sym,
            sector: sym.includes('-') ? 'Cryptocurrency' : (sym.startsWith('^') ? 'Index' : 'Other/Unknown'),
            industry: 'Other/Unknown',
            marketCap: 0,
            dividendYield: 0,
            dividendRate: 0,
          };
        }
      })
    );

    const data: Record<string, any> = {};
    profiles.forEach((p) => {
      if (p.status === 'fulfilled') {
        data[p.value.symbol] = {
          sector: p.value.sector,
          industry: p.value.industry,
          marketCap: p.value.marketCap,
          dividendYield: p.value.dividendYield,
          dividendRate: p.value.dividendRate,
        };
      }
    });

    return NextResponse.json({ profiles: data });
  } catch (error: any) {
    console.error('Analytics API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
