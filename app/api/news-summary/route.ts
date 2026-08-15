import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { GoogleGenAI } from '@google/genai';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
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

    // Take the first 3 or 4 substantial paragraphs as the "long summary" base
    const baseText = paragraphs.slice(0, 4).join('\n\n');

    if (!baseText) {
       return NextResponse.json({ summary: "ไม่สามารถดึงข้อมูลสรุปข่าวได้ในขณะนี้ กรุณาคลิกอ่านข่าวเต็ม" });
    }

    // Try to translate and summarize with Gemini if API key is present
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Summarize the following financial news article into a concise, easy-to-read Thai summary (2-3 paragraphs max). Keep the professional tone and use appropriate financial terminology in Thai:\n\n${baseText}`;
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash', // Force recompile
          contents: prompt,
        });
        return NextResponse.json({ summary: response.text });
      } catch (aiError) {
        console.error("AI Summarization failed, falling back to original text:", aiError);
        // Fallback to original text if AI fails
        return NextResponse.json({ summary: baseText });
      }
    }

    // Fallback if no API key
    return NextResponse.json({ summary: baseText });
    
  } catch (error: any) {
    console.error("Error fetching news summary:", error);
    return NextResponse.json({ error: "Failed to fetch article content" }, { status: 500 });
  }
}
