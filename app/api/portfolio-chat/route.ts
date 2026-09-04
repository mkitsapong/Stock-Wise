import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-2.5-pro',
  'gemini-3.1-pro-preview',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
];

export async function POST(request: Request) {
  try {
    const { message, holdings, portfolioStats, currency, exchangeRate } = await request.json();

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Missing or empty message' }, { status: 400 });
    }

    const cleanMessage = message.trim().slice(0, 2000);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    // Build a rich holdings context string
    const currencySymbol = currency === 'THB' ? '฿' : '$';
    const rate = exchangeRate || 33.5;

    const holdingsText = holdings && holdings.length > 0
      ? holdings.map((h: any) => {
          const currentPrice = h.currentPrice || h.avgCost || 0;
          const value = h.shares * currentPrice;
          const pl = value - h.shares * h.avgCost;
          const plPct = h.avgCost > 0 ? ((currentPrice - h.avgCost) / h.avgCost) * 100 : 0;
          const valueTHB = value * rate;
          return `• ${h.symbol} (${h.name || h.symbol}): ถือ ${h.shares.toFixed(4)} หุ้น | ราคาเฉลี่ย $${h.avgCost?.toFixed(2)} | ราคาปัจจุบัน $${currentPrice.toFixed(2)} | มูลค่า $${value.toFixed(2)} (฿${valueTHB.toFixed(0)}) | P/L ${pl >= 0 ? '+' : ''}$${pl.toFixed(2)} (${plPct >= 0 ? '+' : ''}${plPct.toFixed(1)}%)`;
        }).join('\n')
      : 'ยังไม่มีหุ้นในพอร์ต';

    const totalValue = portfolioStats?.totalValue || 0;
    const totalCost = portfolioStats?.totalCost || 0;
    const unrealizedPL = portfolioStats?.unrealizedPL || 0;
    const totalReturn = totalCost > 0 ? (unrealizedPL / totalCost) * 100 : 0;

    const systemPrompt = `คุณคือ StockWise AI — ผู้ช่วยด้านการลงทุนส่วนตัวที่เชี่ยวชาญและเป็นมิตร สามารถอ่านและวิเคราะห์พอร์ตการลงทุนจริงๆ ของ user ได้

**ข้อมูลพอร์ตปัจจุบัน (Real-time):**
มูลค่าพอร์ตรวม: $${totalValue.toFixed(2)} (฿${(totalValue * rate).toFixed(0)})
ต้นทุนรวม: $${totalCost.toFixed(2)}
กำไร/ขาดทุน unrealized: ${unrealizedPL >= 0 ? '+' : ''}$${unrealizedPL.toFixed(2)} (${totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(2)}%)

**Holdings ทั้งหมด:**
${holdingsText}

**คำแนะนำในการตอบ:**
- ตอบเป็นภาษาไทยเสมอ ยกเว้น symbol หุ้น
- ให้ข้อมูลที่เป็นประโยชน์ เฉพาะเจาะจง อิงข้อมูลพอร์ตจริง
- ไม่ต้องใส่ disclaimer เรื่องความเสี่ยงทุกประโยค (ใส่แค่ครั้งเดียวถ้าจำเป็น)
- ตอบกระชับ ตรงประเด็น ใช้ emoji ประกอบเพื่อให้อ่านง่าย
- ถ้าถามเรื่องการซื้อ/ขาย ให้วิเคราะห์จาก P/L และ % gain/loss ของแต่ละตัว`;

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `${systemPrompt}\n\n**คำถามจาก user:** ${cleanMessage}`;

    let lastError: any = null;
    for (const modelName of CANDIDATE_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
        });
        if (response?.text) {
          return NextResponse.json({ reply: response.text, model: modelName });
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[PortfolioChat] Model ${modelName} failed:`, err?.message);
      }
    }

    throw lastError || new Error('All models unavailable');
  } catch (error: any) {
    console.error('[PortfolioChat] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Chat service temporarily unavailable' },
      { status: 500 }
    );
  }
}
