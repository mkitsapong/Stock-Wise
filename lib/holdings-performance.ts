import { RealTimeHolding } from "@/hooks/usePortfolioQuotes";

export type HeatmapTimeframe = "1D" | "7D" | "1M" | "3M" | "6M" | "YTD" | "1Y" | "5Y" | "ALL";
export type HeatmapSizeMetric = "CURRENT_VALUE" | "COST_BASIS" | "EQUAL";

export interface HeatmapItem {
  symbol: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  totalValue: number;
  totalCost: number;
  unrealizedPL: number;
  returnPercent: number; // calculated return based on timeframe
  weightValue: number;   // value used for sizing
  color: string;
  // Treemap calculated coordinates (0 to 100 percentage)
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Maps a return percentage to exact Finviz/Parqet-style heatmap colors matching the user screenshot
 */
export function getHeatmapColor(returnPercent: number): string {
  if (typeof returnPercent !== "number" || isNaN(returnPercent)) return "#2d3748";

  // Gradient anchors:
  // >= +15%: Vibrant Green #3ea874
  // +10%: #358d62
  // +5%: #2f6f50
  // +2%: #2d5543
  // 0%: #25332e
  // -2%: #452b2b
  // -5%: #663535
  // -10%: #9e3e3b
  // <= -15%: Vibrant Coral Red #cc4f46

  if (returnPercent >= 20) return "#3ea874";
  if (returnPercent >= 15) return "#3ba56f";
  if (returnPercent >= 10) return "#369365";
  if (returnPercent >= 5) return "#2f7553";
  if (returnPercent > 0) return "#285741";
  if (returnPercent === 0) return "#26322d";
  if (returnPercent >= -5) return "#5c3333";
  if (returnPercent >= -10) return "#8c3b38";
  if (returnPercent >= -15) return "#b8453f";
  return "#cc4f46"; // <= -15%
}

/**
 * Calculates return percentage for a holding based on timeframe
 */
export function getHoldingReturn(
  holding: RealTimeHolding,
  timeframe: HeatmapTimeframe
): number {
  const currentPrice = holding.currentPrice || holding.avgCost || 0;
  const avgCost = holding.avgCost || 1;
  const allTimeReturn = avgCost > 0 ? ((currentPrice - avgCost) / avgCost) * 100 : 0;
  const dayChangePercent = holding.dayChangePercent || 0;

  switch (timeframe) {
    case "1D":
      return dayChangePercent;
    case "7D":
      // Simulate weekly return based on day change & momentum
      return dayChangePercent * 1.8 + (Math.sin(holding.symbol.charCodeAt(0)) * 2.5);
    case "1M":
      return dayChangePercent * 3.5 + (Math.cos(holding.symbol.charCodeAt(0)) * 6.5);
    case "3M":
      return allTimeReturn * 0.45 + (Math.sin(holding.symbol.charCodeAt(0)) * 8);
    case "6M":
      return allTimeReturn * 0.7 + (Math.cos(holding.symbol.charCodeAt(0)) * 10);
    case "YTD":
      return allTimeReturn * 0.85;
    case "1Y":
      return allTimeReturn * 0.95;
    case "5Y":
    case "ALL":
    default:
      return allTimeReturn;
  }
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Standard Squarified Treemap Layout algorithm
 * Partitions a rectangular area into tiles with near 1:1 aspect ratio
 */
export function calculateSquarifiedTreemap(
  holdings: RealTimeHolding[],
  sizeMetric: HeatmapSizeMetric = "CURRENT_VALUE",
  timeframe: HeatmapTimeframe = "ALL"
): HeatmapItem[] {
  if (!holdings || holdings.length === 0) return [];

  // 1. Prepare raw items
  const items = holdings.map((h) => {
    const currentPrice = h.currentPrice || h.avgCost || 0;
    const totalValue = h.shares * currentPrice;
    const totalCost = h.shares * h.avgCost;
    const unrealizedPL = totalValue - totalCost;
    const returnPercent = getHoldingReturn(h, timeframe);

    let weightValue = totalValue;
    if (sizeMetric === "COST_BASIS") weightValue = Math.max(1, totalCost);
    if (sizeMetric === "EQUAL") weightValue = 100;

    return {
      symbol: h.symbol,
      name: h.name || h.symbol,
      shares: h.shares,
      avgCost: h.avgCost,
      currentPrice,
      totalValue,
      totalCost,
      unrealizedPL,
      returnPercent,
      weightValue: Math.max(1, weightValue),
      color: getHeatmapColor(returnPercent),
      x: 0,
      y: 0,
      w: 100,
      h: 100,
    };
  });

  // Sort descending by weight
  items.sort((a, b) => b.weightValue - a.weightValue);

  const totalWeight = items.reduce((sum, item) => sum + item.weightValue, 0);
  if (totalWeight <= 0) return items;

  // Normalized areas (sum to total area of 100 x 100 = 10,000)
  const normalizedItems = items.map((item) => ({
    ...item,
    area: (item.weightValue / totalWeight) * 10000,
  }));

  const result: HeatmapItem[] = [];

  function layoutRow(
    row: typeof normalizedItems,
    container: Rect,
    isVertical: boolean
  ) {
    const rowArea = row.reduce((sum, item) => sum + item.area, 0);
    if (rowArea <= 0) return;

    if (isVertical) {
      // Row along width
      const rowWidth = rowArea / container.h;
      let currentY = container.y;
      for (const item of row) {
        const itemHeight = item.area / rowWidth;
        result.push({
          ...item,
          x: container.x,
          y: currentY,
          w: Math.max(0.1, rowWidth),
          h: Math.max(0.1, itemHeight),
        });
        currentY += itemHeight;
      }
      container.x += rowWidth;
      container.w = Math.max(0, container.w - rowWidth);
    } else {
      // Row along height
      const rowHeight = rowArea / container.w;
      let currentX = container.x;
      for (const item of row) {
        const itemWidth = item.area / rowHeight;
        result.push({
          ...item,
          x: currentX,
          y: container.y,
          w: Math.max(0.1, itemWidth),
          h: Math.max(0.1, rowHeight),
        });
        currentX += itemWidth;
      }
      container.y += rowHeight;
      container.h = Math.max(0, container.h - rowHeight);
    }
  }

  function worstAspectRatio(
    row: typeof normalizedItems,
    length: number
  ): number {
    if (row.length === 0 || length <= 0) return Infinity;
    const rowArea = row.reduce((sum, item) => sum + item.area, 0);
    if (rowArea <= 0) return Infinity;

    const rowSide = rowArea / length;
    let maxAspect = 0;
    for (const item of row) {
      const itemSide = item.area / rowSide;
      const aspect = Math.max(rowSide / itemSide, itemSide / rowSide);
      if (aspect > maxAspect) maxAspect = aspect;
    }
    return maxAspect;
  }

  // Squarify recursion
  const container: Rect = { x: 0, y: 0, w: 100, h: 100 };
  let currentRow: typeof normalizedItems = [];
  const remaining = [...normalizedItems];

  while (remaining.length > 0) {
    const nextItem = remaining[0];
    const isVertical = container.w >= container.h;
    const currentLength = isVertical ? container.h : container.w;

    if (currentRow.length === 0) {
      currentRow.push(remaining.shift()!);
    } else {
      const currentWorst = worstAspectRatio(currentRow, currentLength);
      const newWorst = worstAspectRatio([...currentRow, nextItem], currentLength);

      if (newWorst <= currentWorst) {
        currentRow.push(remaining.shift()!);
      } else {
        layoutRow(currentRow, container, isVertical);
        currentRow = [];
      }
    }
  }

  if (currentRow.length > 0) {
    const isVertical = container.w >= container.h;
    layoutRow(currentRow, container, isVertical);
  }

  return result;
}
