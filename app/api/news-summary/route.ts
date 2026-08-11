import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch article: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Yahoo Finance articles usually put content in <div class="caas-body"> or <article>
    // So we just grab all paragraphs that are inside article bodies.
    let paragraphs: string[] = [];
    
    // Try to find main content areas
    const contentAreas = $('.caas-body p, article p, .article-body p, .story-body p');
    
    if (contentAreas.length > 0) {
      contentAreas.each((_, el) => {
        const text = $(el).text().trim();
        // Ignore very short paragraphs (often ads or captions)
        if (text.length > 50) {
          paragraphs.push(text);
        }
      });
    } else {
      // Fallback: grab all paragraphs if specific classes aren't found
      $('p').each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 80 && !text.includes('Sign in') && !text.includes('Cookie')) {
          paragraphs.push(text);
        }
      });
    }

    // Take the first 3 or 4 substantial paragraphs as the "long summary"
    const summary = paragraphs.slice(0, 4).join('\n\n');

    if (!summary) {
       return NextResponse.json({ summary: "Unable to extract article summary. The content might be behind a paywall or in a video format." });
    }

    return NextResponse.json({ summary });
    
  } catch (error: any) {
    console.error("Error fetching news summary:", error);
    return NextResponse.json({ error: "Failed to fetch article content" }, { status: 500 });
  }
}
