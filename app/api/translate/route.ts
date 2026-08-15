import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Missing text to translate" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY in environment variables." }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Translate the following financial news article into Thai. Keep the professional tone, use appropriate financial terminology in Thai, and ensure it reads naturally. Here is the article:\n\n${text}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash', // Force recompile
      contents: prompt,
    });

    const translatedText = response.text;

    return NextResponse.json({ translatedText });
  } catch (error: any) {
    console.error("Translation Error:", error);
    return NextResponse.json({ error: error.message || "Translation failed" }, { status: 500 });
  }
}
