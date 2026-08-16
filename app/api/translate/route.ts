import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-1.5-flash',
  'gemini-2.5-pro',
  'gemini-1.5-pro',
];

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

    let lastError: any = null;

    // Try candidate models in order if one experiences 503 high demand or transient error
    for (const modelName of CANDIDATE_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
        });

        if (response && response.text) {
          return NextResponse.json({ translatedText: response.text });
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} translation failed, trying fallback:`, err.message || err);
      }
    }

    throw lastError || new Error("All translation models are currently unavailable. Please try again in a moment.");
  } catch (error: any) {
    console.error("Translation Error:", error);
    return NextResponse.json(
      { error: error.message || "Translation service is temporarily busy. Please try again." },
      { status: 500 }
    );
  }
}
