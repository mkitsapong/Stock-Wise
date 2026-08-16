import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { isValidNewsUrl } from '@/lib/security';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // 🛡️ Anti-SSRF Defense: validate URL protocol and allowed domain whitelist
  if (!isValidNewsUrl(url)) {
    return NextResponse.json(
      { error: "Invalid or unauthorized news URL." },
      { status: 403 }
    );
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch article: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    let paragraphs: string[] = [];

    // Yahoo Finance & typical financial article layout
    const contentAreas = $('.caas-body p, article p, .article-body p, .story-body p');

    if (contentAreas.length > 0) {
      contentAreas.each((_, el) => {
        const text = $(el).text().trim();
        // Ignore very short paragraphs (often ads or captions)
        if (text.length > 30) {
          paragraphs.push(text);
        }
      });
    } else {
      // Fallback
      $('p').each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 50 && !text.includes('Sign in') && !text.includes('Cookie')) {
          paragraphs.push(text);
        }
      });
    }

    const content = paragraphs.join('\n\n');

    if (!content) {
      return NextResponse.json(
        { error: "Unable to extract article content. The content might be behind a paywall or in a video format." },
        { status: 404 }
      );
    }

    return NextResponse.json({ content });
  } catch (error: any) {
    console.error("Error fetching news content:", error?.message || error);
    // 🛡️ Security: do not leak internal stack traces to client
    return NextResponse.json({ error: "Failed to fetch news article content" }, { status: 500 });
  }
}
