import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { GoogleGenAI } from '@google/genai';
import { isValidNewsUrl } from '@/lib/security';

const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-1.5-flash',
  'gemini-2.5-pro',
  'gemini-1.5-pro',
];

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

    // Yahoo Finance articles usually put content in <div class="caas-body"> or <article>
    const contentAreas = $('.caas-body p, article p, .article-body p, .story-body p');

    if (contentAreas.length > 0) {
      contentAreas.each((_, el) => {
        const text = $(el).text().trim();
        // Ignore very short paragraphs
        if (text.length > 50) {
          paragraphs.push(text);
        }
      });
    } else {
      // Fallback
      $('p').each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 80 && !text.includes('Sign in') && !text.includes('Cookie')) {
          paragraphs.push(text);
        }
      });
    }

    // Take the first 3 or 4 substantial paragraphs as the summary base
    const baseText = paragraphs.slice(0, 4).join('\n\n');

    if (!baseText) {
      return NextResponse.json({
        summary: "ไม่สามารถดึงข้อมูลสรุปข่าวได้ในขณะนี้ กรุณาคลิกอ่านข่าวเต็ม",
      });
    }

    // Try to translate and summarize with Gemini if API key is present
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Summarize the following financial news article into a concise, easy-to-read Thai summary (2-3 paragraphs max). Keep the professional tone and use appropriate financial terminology in Thai:\n\n${baseText}`;

      for (const modelName of CANDIDATE_MODELS) {
        try {
          const aiResponse = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
          });
          if (aiResponse && aiResponse.text) {
            return NextResponse.json({ summary: aiResponse.text });
          }
        } catch (aiError: any) {
          console.warn(`Model ${modelName} summary failed, trying next:`, aiError?.message || aiError);
        }
      }

      // Fallback to base text if all models busy
      return NextResponse.json({ summary: baseText });
    }

    // Fallback if no API key
    return NextResponse.json({ summary: baseText });
  } catch (error: any) {
    console.error("Error fetching news summary:", error?.message || error);
    return NextResponse.json({ error: "Failed to fetch article content" }, { status: 500 });
  }
}
