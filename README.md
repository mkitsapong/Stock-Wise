# 📈 StockWise — Smart Portfolio Tracker & AI Financial Assistant

<p align="center">
  <img src="public/favicon.ico" alt="StockWise Logo" width="64" height="64" />
</p>

<p align="center">
  <b>ระบบจัดการและติดตามพอร์ตการลงทุนอัจฉริยะ พร้อมผู้ช่วย AI วิเคราะห์พอร์ตรายตัว</b><br>
  ขับเคลื่อนด้วย Next.js 16 (App Router), Tailwind CSS v4, Google Gemini AI, Supabase และ Yahoo Finance
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.3.0-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.2-blue?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Google_Gemini-AI%20Insights-4285F4?style=for-the-badge&logo=google" alt="Google Gemini" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</p>

---

## 🌟 จุดเด่นของโปรเจกต์ (Key Features)

### 1. 📊 Real-time Dashboard & Candlestick Charts
- **Interactive Candlestick Chart**: กราฟแท่งเทียนความละเอียดสูงด้วย TradingView `lightweight-charts` v5 รองรับทั้ง Timeframe รายวัน, รายสัปดาห์ และรายเดือน
- **Technical Indicators ครบครัน**: เปิด/ปิดเส้นอินดิเคเตอร์ได้ตามต้องการ ทั้ง SMA (20, 50), EMA (20), RSI (14), MACD, Bollinger Bands และ Volume Bar
- **Benchmark Comparison**: เปรียบเทียบผลตอบแทนของพอร์ตกับดัชนีระดับโลกแบบเรียลไทม์ เช่น S&P 500 (`^GSPC`), NASDAQ (`^IXIC`), Dow Jones (`^DJI`) และ SET Index (`^SET.BK`)
- **Earnings Calendar**: ปฏิทินแสดงรอบประกาศผลประกอบการและประมาณการงบการเงินของหุ้นตัวสำคัญ

### 2. 💼 Multi-Portfolio & Holdings Management
- **รองรับหลายพอร์ตในบัญชีเดียว**: แยกจัดการพอร์ตตามกลยุทธ์ เช่น Growth, Dividend, Trading หรือ Custom Portfolio
- **Dual Currency Engine (USD & THB)**: สลับการแสดงผลค่าเงินดอลลาร์ ($) และบาท (฿) ได้ทันที พร้อมอัตราแลกเปลี่ยน FX แบบเรียลไทม์
- **Holdings Table & Heatmap**: ดูต้นทุนเฉลี่ย (Weighted Average Cost), มูลค่าตลาด, กำไร/ขาดทุน Realized & Unrealized P/L และ Heatmap แสดงผลประกอบการ
- **Lifetime Portfolio Value Chart**: กราฟแสดงมูลค่ารวมของพอร์ตเทียบกับเงินต้นตั้งแต่วันแรกที่เริ่มลงทุน

### 3. 🤖 AI Financial Advisor & Portfolio Doctor (Google Gemini)
- **AI Portfolio Chat**: แชทปรึกษาและวิเคราะห์พอร์ตกับ AI ส่วนตัวที่อ่านข้อมูลหุ้นและสัดส่วนในพอร์ตจริงแบบ Dynamic
- **Portfolio Doctor & Simulator**: ระบบตรวจสุขภาพพอร์ต (Health Score) คำนวณความเสี่ยงด้วย Herfindahl-Hirschman Index (HHI), ตรวจจับการถือหุ้นกระจุกตัว และระบบจำลองสภาวะวิกฤติตลาด (Market Crash Stress Test)
- **Smart Recommendations**: แนะนำการปรับสมดุลพอร์ต (Rebalancing) เพื่อกระจายความเสี่ยงอย่างเหมาะสม

### 4. 📰 AI-Powered Financial News & Reader
- **News Aggregator**: รวบรวมข่าวสารการเงินและหุ้นรายตัวล่าสุดจากตลาดสหรัฐฯ และตลาดโลก
- **AI Summarization & Sentiment**: สรุปประเด็นสำคัญของข่าวแบบกระชับ พร้อมระบุ Sentiment ตลาด (Bullish / Neutral / Bearish)
- **Instant Translation**: แปลสรุปข่าวเป็นภาษาไทยเข้าใจง่ายได้ด้วยคลิกเดียว

### 5. 💰 Dividend Tracking & Projections
- **Dividend Calendar & Projections**: จำลองและคำนวณเงินปันผลที่คาดว่าจะได้รับรายเดือนและรายปี
- **Yield Analysis**: วิเคราะห์ Dividend Yield เทียบกับเงินต้น (Yield on Cost) และมูลค่าตลาด

### 6. 🎯 Watchlist & Transaction Records
- **Watchlist with Target Buy Price**: ติดตามหุ้นที่สนใจพร้อมตั้งราคาเป้าหมาย (Target Price) และแจ้งเตือนเมื่อราคาเข้าใกล้เป้าหมาย
- **Transaction History**: บันทึกประวัติรายการ ซื้อ (BUY) / ขาย (SELL) หุ้นอย่างเป็นระบบ
- **Export to CSV**: รองรับการดาวน์โหลดประวัติธุรกรรมออกมาเป็นไฟล์ `.csv` สำหรับนำไปใช้งานต่อ

### 7. 🎨 Social Share Card Generator
- **Custom Canvas Export**: สร้างการ์ดสรุปผลตอบแทนพอร์ตดีไซน์หรูหราคมชัดระดับ HD สำหรับแชร์ลง Social Media ได้ทันที

### 8. 🔐 Supabase Cloud Authentication & Row Level Security (RLS)
- ระบบล็อกอินปลอดภัยด้วย Supabase Auth (Email / Password และ Magic Link)
- แยกข้อมูลของผู้ใช้แต่ละคนอย่างปลอดภัย 100% ด้วย PostgreSQL Row Level Security (RLS) Policies
- รองรับการทำงานแบบ Guest / Local Mode หากยังไม่ได้เชื่อมต่อฐานข้อมูล

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

| ส่วนประกอบ | เทคโนโลยีที่เลือกใช้ |
| :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Server & Client Components) |
| **Frontend Library** | [React 19](https://react.dev/) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **Styling & Design** | [Tailwind CSS v4](https://tailwindcss.com/), Glassmorphism, Ambient Background Effects |
| **Interactive Charts** | [TradingView Lightweight Charts v5](https://tradingview.github.io/lightweight-charts/) & [Recharts v3](https://recharts.org/) |
| **AI Intelligence** | [Google Gemini API](https://ai.google.dev/) (`@google/genai`) |
| **Market Data Feed** | [Yahoo Finance API](https://github.com/gadicc/node-yahoo-finance2) (`yahoo-finance2`), Cheerio Web Scraper |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL Database + Row Level Security + SSR Auth) |
| **Mobile & PWA** | Progressive Web App (PWA) Ready with Web App Manifest |

---

## 🚀 เริ่มต้นใช้งาน (Getting Started)

### ข้อกำหนดเบื้องต้น (Prerequisites)
- [Node.js](https://nodejs.org/) เวอร์ชั่น 18.18 ขึ้นไป (แนะนำ Node.js 20+)
- ตัวจัดการแพ็กเกจ: `npm`, `yarn`, `pnpm` หรือ `bun`
- บัญชี [Google AI Studio](https://aistudio.google.com/) สำหรับรับ Gemini API Key
- บัญชี [Supabase](https://supabase.com/) สำหรับจัดเก็บข้อมูลพอร์ตและระบบยืนยันตัวตน

---

### ขั้นตอนการติดตั้ง (Installation)

1. **โคลนคลังโค้ด (Clone Repository):**
   ```bash
   git clone https://github.com/your-username/Stock-Wise.git
   cd Stock-Wise
   ```

2. **ติดตั้ง Dependencies:**
   ```bash
   npm install
   # หรือ yarn install / pnpm install / bun install
   ```

3. **ตั้งค่า Environment Variables:**
   คัดลอกไฟล์ `.env.example` ไปเป็น `.env.local`
   ```bash
   cp .env.example .env.local
   ```
   จากนั้นเปิดไฟล์ `.env.local` และใส่ค่า Credentials ของคุณ:
   ```env
   # Google Gemini API Key สำหรับระบบวิเคราะห์พอร์ตและสรุปข่าว
   GEMINI_API_KEY=your_gemini_api_key_here

   # Supabase Project Credentials (ดูได้จาก Project Settings > API ใน Supabase Dashboard)
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
   ```

4. **ตั้งค่าฐานข้อมูล Supabase (Database Setup):**
   - เข้าไปที่ [Supabase Dashboard](https://supabase.com/dashboard) ของโปรเจกต์คุณ
   - ไปที่เมนู **SQL Editor** ในแถบด้านซ้าย
   - เปิดไฟล์ [`supabase/schema.sql`](supabase/schema.sql) ในโปรเจกต์นี้ คัดลอกโค้ดทั้งหมดแล้ววางลงใน SQL Editor
   - กดปุ่ม **Run** เพื่อสร้างตาราง `portfolios`, `transactions`, `watchlist` พร้อมตั้งค่า Row Level Security (RLS) ทั้งหมด

5. **รัน Development Server:**
   ```bash
   npm run dev
   ```
   เปิดเบราว์เซอร์แล้วเข้าไปที่ [http://localhost:3000](http://localhost:3000)

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```text
Stock-Wise/
├── app/                        # Next.js App Router (Pages & API Routes)
│   ├── analytics/              # หน้ารวมบทวิเคราะห์ สุขภาพพอร์ต และการกระจายความเสี่ยง
│   ├── api/                    # Serverless API endpoints
│   │   ├── analytics/          # API สำหรับดึงข้อมูลสรุปผลพอร์ต
│   │   ├── chart/              # API ฟีดราคากราฟแท่งเทียนย้อนหลัง
│   │   ├── earnings/           # API ปฏิทินผลประกอบการ
│   │   ├── news-content/       # Scraper อ่านเนื้อหาข่าวเต็ม
│   │   ├── news-summary/       # Gemini AI สรุปและวิเคราะห์ Sentiment ข่าว
│   │   ├── portfolio-chat/     # Gemini AI ถาม-ตอบและวิเคราะห์พอร์ตส่วนตัว
│   │   ├── quotes/             # ดึงราคาหุ้นและดัชนีแบบเรียลไทม์ (Yahoo Finance)
│   │   ├── search/             # ค้นหารายชื่อหุ้นทั่วโลก
│   │   └── translate/          # แปลภาษาเนื้อหาข่าวเป็นภาษาไทย
│   ├── auth/                   # หน้าเข้าสู่ระบบและสมัครสมาชิก
│   ├── news/                   # หน้ารวมข่าวสารและการวิเคราะห์ตลาดด้วย AI
│   ├── portfolio/              # หน้าภาพรวมพอร์ต, ตรวจสุขภาพพอร์ต, ปันผล, และสัดส่วนสินทรัพย์
│   ├── share/                  # หน้าสร้างและส่งออกการ์ดสรุปพอร์ตสำหรับ Social Media
│   ├── transactions/           # หน้าบันทึกและส่งออกประวัติการซื้อ-ขายหุ้น
│   ├── watchlist/              # หน้าติดตามราคาหุ้นและแจ้งเตือนเป้าหมายราคา
│   ├── layout.tsx              # Root Layout พร้อม AppShell, Theme และ Providers
│   └── page.tsx                # Dashboard หลัก (Market Live, กราฟ, Benchmark)
├── components/                 # React Components
│   ├── ai/                     # AI Chatbot & Floating Advisor
│   ├── analytics/              # กราฟโดนัทสัดส่วน, P/L Breakdown, Health Score
│   ├── auth/                   # Modal เข้าสู่ระบบและสลับโหมด Guest/User
│   ├── charts/                 # TradingView Lightweight Charts & Technical Overlays
│   ├── common/                 # Reusable UI widgets, Modals, Badges, Loaders
│   ├── dashboard/              # การ์ดสรุปภาพรวม, กราฟเปรียบเทียบ Benchmark, ปฏิทิน
│   ├── layout/                 # Sidebar, Navigation, TopBar, Currency Switcher
│   ├── portfolio/              # ตาราง Holdings, AI Doctor, Dividend, Heatmap, Share Modal
│   ├── transactions/           # ฟอร์มบันทึกการซื้อ-ขาย และตารางประวัติ
│   └── watchlist/              # ตาราง Watchlist และ Modal เพิ่มหุ้น
├── context/                    # React Context State Management
│   ├── AuthContext.tsx         # สถานะผู้ใช้และ Supabase Session
│   ├── CurrencyContext.tsx     # ระบบสลับค่าเงิน USD / THB พร้อมอัตราแลกเปลี่ยน
│   ├── TransactionContext.tsx  # จัดการรายการ Transaction และการคำนวณต้นทุน
│   └── WatchlistContext.tsx    # จัดการรายการหุ้นที่ติดตาม
├── hooks/                      # Custom React Hooks (usePortfolioQuotes, ฯลฯ)
├── lib/                        # Utility Functions & Business Logic
│   ├── diversification.ts      # คำนวณค่าดัชนีความเสี่ยง HHI และสัดส่วน Sector
│   ├── dividends.ts            # คำนวณเงินปันผลและรอบจ่าย
│   ├── export-csv.ts           # ฟังก์ชันแปลงข้อมูลธุรกรรมเป็นไฟล์ CSV
│   ├── indicators.ts           # คำนวณสูตรเทคนิคอล (RSI, MACD, SMA, EMA, BB)
│   ├── portfolio-doctor.ts     # คำนวณเกรดสุขภาพพอร์ตและจำลองวิกฤติตลาด
│   ├── shareCardCanvas.ts      # เรนเดอร์ภาพการ์ดสรุปพอร์ตผ่าน HTML5 Canvas
│   ├── supabase.ts             # Supabase Client configuration
│   └── utils.ts                # ฟังก์ชันจัดรูปแบบตัวเลข ค่าเงิน และเปอร์เซ็นต์
├── public/                     # Static assets, Web App Manifest & App Icons
├── supabase/                   # Supabase Schema Migration & RLS scripts
│   └── schema.sql              # สคริปต์ SQL สร้างตารางและ RLS Policies
├── package.json
└── tsconfig.json
```

---

## 🔒 ความปลอดภัยของข้อมูล (Security & RLS)

- **Row Level Security (RLS)**: ข้อมูลในตาราง `portfolios`, `transactions`, และ `watchlist` ได้รับการป้องกันด้วย Supabase RLS ทุกตาราง ผู้ใช้แต่ละคนสามารถเข้าถึงและแก้ไขได้เฉพาะข้อมูลของบัญชีตนเองเท่านั้น
- **Server-side Security**: API Routes ที่เรียกใช้งานภายนอก (เช่น Yahoo Finance, Gemini API) มีการตรวจสอบ Input, ป้องกันการโจมตีแบบ Injection และซ่อน API Keys ไว้ฝั่ง Server เสมอ

---

## 📜 คำสั่ง Scripts ที่สามารถใช้งานได้ (Available Scripts)

- `npm run dev` — เริ่มต้น Development Server สำหรับการพัฒนา
- `npm run build` — คอมไพล์และสร้าง Production Bundle
- `npm run start` — รัน Production Server หลังจากสั่ง build
- `npm run lint` — ตรวจสอบคุณภาพโค้ดและ Syntax ด้วย ESLint

---

## 🤝 การมีส่วนร่วมพัฒนา (Contributing)

ยินดีรับฟังข้อเสนอแนะและ Pull Requests จากทุกคน!
1. Fork โปรเจกต์นี้
2. สร้าง Feature Branch ของคุณ (`git checkout -b feature/AmazingFeature`)
3. Commit การเปลี่ยนแปลง (`git commit -m 'Add some AmazingFeature'`)
4. Push ไปยัง Branch (`git push origin feature/AmazingFeature`)
5. เปิด Pull Request

---

## 📄 ใบอนุญาต (License)

โปรเจกต์นี้เผยแพร่ภายใต้ใบอนุญาต **MIT License** — สามารถนำไปพัฒนาต่อและปรับใช้ได้ตามสะดวก
