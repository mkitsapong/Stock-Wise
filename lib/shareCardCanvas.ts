import { PortfolioShareSnapshot } from "./shareUtils";

export type CardTheme = "neon" | "emerald" | "gold" | "cyber";
export type CardAspectRatio = "square" | "story";

export interface ShareCardRenderOptions {
  snapshot: PortfolioShareSnapshot;
  theme: CardTheme;
  aspectRatio: CardAspectRatio;
}

interface ThemeConfig {
  bgGradient: [string, string, string];
  cardBg: string;
  cardBorder: string;
  primaryAccent: string;
  secondaryAccent: string;
  glowColor1: string;
  glowColor2: string;
  textPrimary: string;
  textSecondary: string;
  profitColor: string;
  lossColor: string;
  brandGradient: [string, string];
  holdingPillBg: string;
}

const THEMES: Record<CardTheme, ThemeConfig> = {
  neon: {
    bgGradient: ["#070a13", "#0c1324", "#080c18"],
    cardBg: "rgba(18, 26, 48, 0.75)",
    cardBorder: "rgba(99, 102, 241, 0.35)",
    primaryAccent: "#6366f1",
    secondaryAccent: "#38bdf8",
    glowColor1: "rgba(99, 102, 241, 0.35)",
    glowColor2: "rgba(56, 189, 248, 0.25)",
    textPrimary: "#f8fafc",
    textSecondary: "#94a3b8",
    profitColor: "#10b981",
    lossColor: "#f43f5e",
    brandGradient: ["#818cf8", "#38bdf8"],
    holdingPillBg: "rgba(30, 41, 69, 0.8)",
  },
  emerald: {
    bgGradient: ["#04120e", "#08261e", "#051610"],
    cardBg: "rgba(10, 36, 29, 0.75)",
    cardBorder: "rgba(16, 185, 129, 0.35)",
    primaryAccent: "#10b981",
    secondaryAccent: "#34d399",
    glowColor1: "rgba(16, 185, 129, 0.35)",
    glowColor2: "rgba(52, 211, 153, 0.25)",
    textPrimary: "#ecfdf5",
    textSecondary: "#6ee7b7",
    profitColor: "#34d399",
    lossColor: "#fb7185",
    brandGradient: ["#10b981", "#6ee7b7"],
    holdingPillBg: "rgba(14, 48, 38, 0.8)",
  },
  gold: {
    bgGradient: ["#0f0c08", "#211a10", "#140f09"],
    cardBg: "rgba(36, 28, 17, 0.75)",
    cardBorder: "rgba(245, 158, 11, 0.35)",
    primaryAccent: "#f59e0b",
    secondaryAccent: "#fbbf24",
    glowColor1: "rgba(245, 158, 11, 0.35)",
    glowColor2: "rgba(251, 191, 36, 0.22)",
    textPrimary: "#fffbeb",
    textSecondary: "#fde68a",
    profitColor: "#10b981",
    lossColor: "#f43f5e",
    brandGradient: ["#f59e0b", "#fbbf24"],
    holdingPillBg: "rgba(48, 37, 22, 0.8)",
  },
  cyber: {
    bgGradient: ["#130718", "#240d2d", "#15081c"],
    cardBg: "rgba(38, 15, 48, 0.75)",
    cardBorder: "rgba(236, 72, 153, 0.35)",
    primaryAccent: "#ec4899",
    secondaryAccent: "#a855f7",
    glowColor1: "rgba(236, 72, 153, 0.35)",
    glowColor2: "rgba(168, 85, 247, 0.25)",
    textPrimary: "#fdf2f8",
    textSecondary: "#f472b6",
    profitColor: "#10b981",
    lossColor: "#fb7185",
    brandGradient: ["#ec4899", "#a855f7"],
    holdingPillBg: "rgba(51, 20, 64, 0.8)",
  },
};

const ASSET_COLORS = [
  "#6366f1", "#38bdf8", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6", "#f97316"
];

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number | number[]
) {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, width, height, radius);
  } else {
    // Fallback
    const r = typeof radius === "number" ? radius : radius[0] || 0;
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

/**
 * Render StockWise Share Card onto a Canvas
 */
export function renderShareCardToCanvas(
  canvas: HTMLCanvasElement,
  options: ShareCardRenderOptions
) {
  const { snapshot, theme: themeKey, aspectRatio } = options;
  const theme = THEMES[themeKey] || THEMES.neon;

  const width = 1080;
  const height = aspectRatio === "story" ? 1920 : 1080;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // 1. Draw Background Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, theme.bgGradient[0]);
  bgGrad.addColorStop(0.5, theme.bgGradient[1]);
  bgGrad.addColorStop(1, theme.bgGradient[2]);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Ambient Lighting Glows
  // Glow 1: Top Right
  const glow1 = ctx.createRadialGradient(width * 0.85, height * 0.15, 20, width * 0.85, height * 0.15, width * 0.5);
  glow1.addColorStop(0, theme.glowColor1);
  glow1.addColorStop(1, "transparent");
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, width, height);

  // Glow 2: Bottom Left
  const glow2 = ctx.createRadialGradient(width * 0.15, height * 0.85, 20, width * 0.15, height * 0.85, width * 0.5);
  glow2.addColorStop(0, theme.glowColor2);
  glow2.addColorStop(1, "transparent");
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, width, height);

  // 3. Subtle Background Grid Pattern
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
  ctx.lineWidth = 1;
  const gridSize = 48;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();

  // 4. Main Glass Container Card
  const padX = 56;
  const padY = aspectRatio === "story" ? 140 : 56;
  const cardW = width - padX * 2;
  const cardH = height - padY * 2;

  ctx.save();
  // Card Shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 20;

  drawRoundedRect(ctx, padX, padY, cardW, cardH, 40);
  ctx.fillStyle = theme.cardBg;
  ctx.fill();
  ctx.restore();

  // Card Border
  ctx.save();
  drawRoundedRect(ctx, padX, padY, cardW, cardH, 40);
  ctx.strokeStyle = theme.cardBorder;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // Content coordinates inside card
  let currentY = padY + 60;
  const contentLeft = padX + 50;
  const contentRight = padX + cardW - 50;
  const contentWidth = contentRight - contentLeft;

  // -------------------------------------------------------------
  // HEADER: Logo + Brand + Portfolio Name Badge
  // -------------------------------------------------------------
  // StockWise Icon Badge
  const iconSize = 56;
  ctx.save();
  const iconGrad = ctx.createLinearGradient(contentLeft, currentY, contentLeft + iconSize, currentY + iconSize);
  iconGrad.addColorStop(0, theme.brandGradient[0]);
  iconGrad.addColorStop(1, theme.brandGradient[1]);
  drawRoundedRect(ctx, contentLeft, currentY, iconSize, iconSize, 16);
  ctx.fillStyle = iconGrad;
  ctx.fill();

  // Icon symbol (Lightning / Trending Up)
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(contentLeft + 16, currentY + 36);
  ctx.lineTo(contentLeft + 26, currentY + 26);
  ctx.lineTo(contentLeft + 33, currentY + 32);
  ctx.lineTo(contentLeft + 42, currentY + 20);
  ctx.stroke();
  // Arrow head
  ctx.beginPath();
  ctx.moveTo(contentLeft + 34, currentY + 20);
  ctx.lineTo(contentLeft + 42, currentY + 20);
  ctx.lineTo(contentLeft + 42, currentY + 28);
  ctx.stroke();
  ctx.restore();

  // Brand Name & Tagline
  ctx.font = "800 28px 'Inter', sans-serif";
  ctx.fillStyle = theme.textPrimary;
  ctx.fillText("StockWise", contentLeft + iconSize + 18, currentY + 26);

  ctx.font = "500 14px 'Inter', sans-serif";
  ctx.fillStyle = theme.textSecondary;
  ctx.fillText("Smart Portfolio Tracker", contentLeft + iconSize + 18, currentY + 48);

  // Portfolio Name & Strategy Badge (Right aligned)
  const portName = snapshot.name || "My Portfolio";
  ctx.font = "700 16px 'Inter', sans-serif";
  const badgeText = `🎯 ${portName}`;
  const badgeMetrics = ctx.measureText(badgeText);
  const badgeW = badgeMetrics.width + 32;
  const badgeH = 40;
  const badgeX = contentRight - badgeW;
  const badgeY = currentY + 8;

  ctx.save();
  drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 20);
  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.fill();
  ctx.strokeStyle = theme.cardBorder;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = theme.textPrimary;
  ctx.fillText(badgeText, badgeX + 16, badgeY + 25);
  ctx.restore();

  currentY += iconSize + (aspectRatio === "story" ? 60 : 36);

  // -------------------------------------------------------------
  // HERO RETURN SECTION (P&L Card)
  // -------------------------------------------------------------
  const isPositive = snapshot.returnPercent >= 0;
  const heroCardH = aspectRatio === "story" ? 230 : 180;

  ctx.save();
  const heroBgGrad = ctx.createLinearGradient(contentLeft, currentY, contentRight, currentY + heroCardH);
  if (isPositive) {
    heroBgGrad.addColorStop(0, "rgba(16, 185, 129, 0.15)");
    heroBgGrad.addColorStop(1, "rgba(16, 185, 129, 0.03)");
  } else {
    heroBgGrad.addColorStop(0, "rgba(244, 63, 94, 0.15)");
    heroBgGrad.addColorStop(1, "rgba(244, 63, 94, 0.03)");
  }

  drawRoundedRect(ctx, contentLeft, currentY, contentWidth, heroCardH, 28);
  ctx.fillStyle = heroBgGrad;
  ctx.fill();
  ctx.strokeStyle = isPositive ? "rgba(16, 185, 129, 0.3)" : "rgba(244, 63, 94, 0.3)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Return Label
  ctx.font = "700 13px 'Inter', sans-serif";
  ctx.fillStyle = isPositive ? theme.profitColor : theme.lossColor;
  ctx.fillText("TOTAL ALL-TIME RETURN", contentLeft + 32, currentY + 38);

  // Return Percentage (Large & Bold)
  const returnStr = `${isPositive ? "+" : ""}${snapshot.returnPercent.toFixed(2)}%`;
  ctx.font = `800 ${aspectRatio === "story" ? "68px" : "56px"} 'JetBrains Mono', monospace`;
  ctx.fillStyle = isPositive ? theme.profitColor : theme.lossColor;
  ctx.fillText(returnStr, contentLeft + 32, currentY + (aspectRatio === "story" ? 112 : 100));

  // Subtitle / Balances or Privacy Tag
  if (snapshot.hideBalances) {
    // Privacy Shield Badge
    const privY = currentY + (aspectRatio === "story" ? 165 : 145);
    ctx.font = "600 15px 'Inter', sans-serif";
    ctx.fillStyle = theme.textSecondary;
    ctx.fillText("🔒 Balances hidden for privacy · Verified Portfolio Snapshot", contentLeft + 32, privY);
  } else {
    const valStr = snapshot.currency === "THB"
      ? `฿${(snapshot.totalValue || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : `$${(snapshot.totalValue || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const plStr = `${isPositive ? "+" : ""}${snapshot.currency === "THB" ? "฿" : "$"}${(snapshot.unrealizedPL || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const privY = currentY + (aspectRatio === "story" ? 170 : 145);
    ctx.font = "700 18px 'JetBrains Mono', monospace";
    ctx.fillStyle = theme.textPrimary;
    ctx.fillText(valStr, contentLeft + 32, privY);

    ctx.font = "600 15px 'JetBrains Mono', monospace";
    ctx.fillStyle = isPositive ? theme.profitColor : theme.lossColor;
    ctx.fillText(` (${plStr})`, contentLeft + 32 + ctx.measureText(valStr).width, privY);
  }
  ctx.restore();

  currentY += heroCardH + (aspectRatio === "story" ? 44 : 26);

  // -------------------------------------------------------------
  // 3-COLUMN STATS ROW (Health Score, Best Gainer, Asset Count)
  // -------------------------------------------------------------
  const statCardW = (contentWidth - 28) / 3;
  const statCardH = aspectRatio === "story" ? 140 : 105;

  // Best Performer calculation
  let bestHolding = snapshot.holdings && snapshot.holdings.length > 0
    ? [...snapshot.holdings].sort((a, b) => b.plPercent - a.plPercent)[0]
    : null;

  const statItems = [
    {
      label: "HEALTH SCORE",
      val: snapshot.healthScore > 0 ? `${snapshot.healthScore}/100` : "—",
      sub: snapshot.healthGrade ? `Grade ${snapshot.healthGrade}` : "Balanced",
      color: snapshot.healthScore >= 75 ? theme.profitColor : theme.primaryAccent,
    },
    {
      label: "TOP ASSET",
      val: bestHolding ? bestHolding.symbol : "—",
      sub: bestHolding ? `${bestHolding.plPercent >= 0 ? "+" : ""}${bestHolding.plPercent.toFixed(1)}%` : "N/A",
      color: bestHolding && bestHolding.plPercent >= 0 ? theme.profitColor : theme.textPrimary,
    },
    {
      label: "TOTAL ASSETS",
      val: `${snapshot.holdings?.length || 0}`,
      sub: "Holdings Tracked",
      color: theme.primaryAccent,
    },
  ];

  statItems.forEach((item, idx) => {
    const sX = contentLeft + idx * (statCardW + 14);
    ctx.save();
    drawRoundedRect(ctx, sX, currentY, statCardW, statCardH, 20);
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = "700 11px 'Inter', sans-serif";
    ctx.fillStyle = theme.textSecondary;
    ctx.fillText(item.label, sX + 18, currentY + 26);

    ctx.font = `800 ${aspectRatio === "story" ? "26px" : "22px"} 'JetBrains Mono', monospace`;
    ctx.fillStyle = item.color;
    ctx.fillText(item.val, sX + 18, currentY + (aspectRatio === "story" ? 64 : 56));

    ctx.font = "600 12px 'Inter', sans-serif";
    ctx.fillStyle = theme.textSecondary;
    ctx.fillText(item.sub, sX + 18, currentY + (aspectRatio === "story" ? 96 : 82));
    ctx.restore();
  });

  currentY += statCardH + (aspectRatio === "story" ? 44 : 26);

  // -------------------------------------------------------------
  // ALLOCATION BAR & TOP HOLDINGS
  // -------------------------------------------------------------
  const topHoldings = (snapshot.holdings || []).slice(0, 5);

  ctx.save();
  ctx.font = "700 14px 'Inter', sans-serif";
  ctx.fillStyle = theme.textPrimary;
  ctx.fillText("PORTFOLIO ASSET ALLOCATION", contentLeft, currentY + 12);
  ctx.restore();

  currentY += 24;

  // Segmented Allocation Bar
  const allocBarH = 14;
  let barCurrentX = contentLeft;
  const totalWeight = topHoldings.reduce((sum, h) => sum + (h.weight || 0), 0) || 100;

  ctx.save();
  // Draw background bar
  drawRoundedRect(ctx, contentLeft, currentY, contentWidth, allocBarH, 7);
  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.fill();

  topHoldings.forEach((h, idx) => {
    const segW = Math.max(8, (h.weight / totalWeight) * contentWidth);
    const color = ASSET_COLORS[idx % ASSET_COLORS.length];

    ctx.fillStyle = color;
    if (idx === 0) {
      drawRoundedRect(ctx, barCurrentX, currentY, segW, allocBarH, [7, 0, 0, 7]);
    } else if (idx === topHoldings.length - 1) {
      drawRoundedRect(ctx, barCurrentX, currentY, segW, allocBarH, [0, 7, 7, 0]);
    } else {
      ctx.fillRect(barCurrentX, currentY, segW, allocBarH);
    }
    ctx.fill();
    barCurrentX += segW;
  });
  ctx.restore();

  currentY += allocBarH + 20;

  // Holdings Pill List
  const maxPillsPerRow = aspectRatio === "story" ? 2 : 4;
  const pillW = (contentWidth - (maxPillsPerRow - 1) * 12) / maxPillsPerRow;
  const pillH = aspectRatio === "story" ? 64 : 54;

  topHoldings.slice(0, aspectRatio === "story" ? 6 : 4).forEach((h, idx) => {
    const row = Math.floor(idx / maxPillsPerRow);
    const col = idx % maxPillsPerRow;
    const pX = contentLeft + col * (pillW + 12);
    const pY = currentY + row * (pillH + 12);
    const color = ASSET_COLORS[idx % ASSET_COLORS.length];

    ctx.save();
    drawRoundedRect(ctx, pX, pY, pillW, pillH, 14);
    ctx.fillStyle = theme.holdingPillBg;
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Color dot
    ctx.beginPath();
    ctx.arc(pX + 16, pY + pillH / 2, 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Symbol & Weight
    ctx.font = "700 14px 'Inter', sans-serif";
    ctx.fillStyle = theme.textPrimary;
    ctx.fillText(h.symbol, pX + 28, pY + 22);

    ctx.font = "600 12px 'JetBrains Mono', monospace";
    ctx.fillStyle = theme.textSecondary;
    ctx.fillText(`${h.weight.toFixed(1)}% weight`, pX + 28, pY + 40);

    // Return % (Right side of pill)
    const plSign = h.plPercent >= 0 ? "+" : "";
    const plText = `${plSign}${h.plPercent.toFixed(1)}%`;
    ctx.font = "700 12px 'JetBrains Mono', monospace";
    ctx.fillStyle = h.plPercent >= 0 ? theme.profitColor : theme.lossColor;
    const plMetrics = ctx.measureText(plText);
    ctx.fillText(plText, pX + pillW - plMetrics.width - 12, pY + 22);
    ctx.restore();
  });

  // -------------------------------------------------------------
  // FOOTER: Verified Watermark + Timestamp + URL
  // -------------------------------------------------------------
  const footerY = padY + cardH - 36;

  ctx.save();
  // Watermark Verified
  ctx.font = "600 13px 'Inter', sans-serif";
  ctx.fillStyle = theme.textSecondary;
  ctx.fillText("✓ Verified by StockWise", contentLeft, footerY);

  // Date
  const dateStr = new Date(snapshot.updatedAt || Date.now()).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  ctx.font = "500 13px 'Inter', sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.fillText(`Snapshot: ${dateStr}`, contentLeft + 180, footerY);

  // Domain badge (Right aligned)
  const domainText = "stockwise.app";
  ctx.font = "700 13px 'Inter', sans-serif";
  ctx.fillStyle = theme.primaryAccent;
  const domainMetrics = ctx.measureText(domainText);
  ctx.fillText(domainText, contentRight - domainMetrics.width, footerY);
  ctx.restore();
}

/**
 * Generate a high quality PNG Blob from the share card options
 */
export async function generateShareCardBlob(
  options: ShareCardRenderOptions
): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  renderShareCardToCanvas(canvas, options);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, "image/png", 1.0);
  });
}

/**
 * Trigger immediate browser download of the share card
 */
export async function downloadShareCard(
  options: ShareCardRenderOptions,
  filename = "stockwise-portfolio.png"
) {
  const blob = await generateShareCardBlob(options);
  if (!blob) return;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
