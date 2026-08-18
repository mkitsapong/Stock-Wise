export interface ShareableHolding {
  symbol: string;
  name?: string;
  weight: number; // e.g. 35.4 (%)
  shares?: number;
  value?: number;
  avgCost?: number;
  currentPrice?: number;
  plPercent: number;
}

export interface PortfolioShareSnapshot {
  v: number; // version
  name: string;
  strategy?: string;
  totalValue?: number;
  totalCost?: number;
  unrealizedPL?: number;
  returnPercent: number;
  healthScore: number;
  healthGrade: string;
  currency: "USD" | "THB";
  hideBalances: boolean;
  holdings: ShareableHolding[];
  updatedAt: string;
}

/**
 * UTF-8 safe Base64 URL Encoder
 */
export function encodePortfolioSnapshot(snapshot: PortfolioShareSnapshot): string {
  try {
    const jsonStr = JSON.stringify(snapshot);
    if (typeof window === "undefined") {
      return Buffer.from(jsonStr, "utf-8")
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
    }
    const bytes = new TextEncoder().encode(jsonStr);
    let binString = "";
    for (let i = 0; i < bytes.length; i++) {
      binString += String.fromCharCode(bytes[i]);
    }
    return btoa(binString)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  } catch (err) {
    console.error("Failed to encode portfolio snapshot:", err);
    return "";
  }
}

/**
 * UTF-8 safe Base64 URL Decoder
 */
export function decodePortfolioSnapshot(encoded: string): PortfolioShareSnapshot | null {
  try {
    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }

    let jsonStr = "";
    if (typeof window === "undefined") {
      jsonStr = Buffer.from(base64, "base64").toString("utf-8");
    } else {
      const binString = atob(base64);
      const bytes = new Uint8Array(binString.length);
      for (let i = 0; i < binString.length; i++) {
        bytes[i] = binString.charCodeAt(i);
      }
      jsonStr = new TextDecoder().decode(bytes);
    }

    return JSON.parse(jsonStr) as PortfolioShareSnapshot;
  } catch (err) {
    console.error("Failed to decode portfolio snapshot:", err);
    return null;
  }
}

/**
 * Generate full share URL
 */
export function getShareUrl(snapshot: PortfolioShareSnapshot): string {
  const encoded = encodePortfolioSnapshot(snapshot);
  const origin = typeof window !== "undefined" ? window.location.origin : "https://stock-wise-coral-iota.vercel.app";
  return `${origin}/share?data=${encoded}`;
}

/**
 * Copy image blob to system clipboard
 */
export async function copyImageToClipboard(blob: Blob): Promise<boolean> {
  try {
    if (!navigator.clipboard || !window.ClipboardItem) {
      return false;
    }
    await navigator.clipboard.write([
      new ClipboardItem({
        "image/png": blob,
      }),
    ]);
    return true;
  } catch (err) {
    console.warn("ClipboardItem write failed, fallback or unsupported:", err);
    return false;
  }
}

/**
 * Web Share API Helper (for mobile devices / supported browsers)
 */
export async function shareViaWebShare(data: {
  title: string;
  text: string;
  url?: string;
  files?: File[];
}): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.share) {
    return false;
  }

  try {
    if (data.files && navigator.canShare && navigator.canShare({ files: data.files })) {
      await navigator.share({
        title: data.title,
        text: data.text,
        files: data.files,
      });
      return true;
    }

    await navigator.share({
      title: data.title,
      text: data.text,
      url: data.url,
    });
    return true;
  } catch (err: any) {
    if (err.name === "AbortError") {
      // User cancelled share
      return true;
    }
    console.warn("Web share failed:", err);
    return false;
  }
}
