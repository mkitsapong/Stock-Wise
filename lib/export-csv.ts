import type { Transaction } from "@/context/TransactionContext";

/**
 * Converts transaction data to a downloadable CSV file.
 * Includes both USD and THB columns for tax reporting purposes.
 */
export function exportTransactionsCSV(
  transactions: Transaction[],
  currency: "USD" | "THB",
  exchangeRate: number
): void {
  const headers = [
    "Date",
    "Type",
    "Symbol",
    "Name",
    "Portfolio",
    "Shares",
    "Price (USD)",
    "Total (USD)",
    "Price (THB)",
    "Total (THB)",
  ];

  const rows = transactions.map((tx) => {
    const priceUSD = tx.price;
    const totalUSD = tx.total ?? tx.shares * tx.price;
    const priceTHB = (priceUSD * exchangeRate).toFixed(2);
    const totalTHB = (totalUSD * exchangeRate).toFixed(2);

    return [
      tx.date,
      tx.type,
      tx.symbol,
      `"${(tx.name || tx.symbol).replace(/"/g, '""')}"`, // escape quotes in name
      tx.portfolioId || "growth",
      tx.shares,
      priceUSD.toFixed(4),
      totalUSD.toFixed(2),
      priceTHB,
      totalTHB,
    ].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  }); // BOM for Excel UTF-8

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const today = new Date().toISOString().split("T")[0];
  link.setAttribute("href", url);
  link.setAttribute("download", `stockwise-transactions-${today}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Groups transactions by month and calculates realized P&L per month.
 * Used for the monthly/yearly P&L summary export.
 */
export function exportPLSummaryCSV(
  transactions: Transaction[],
  exchangeRate: number
): void {
  // Calculate realized P&L per symbol using FIFO
  const buyQueues: Record<string, { shares: number; price: number }[]> = {};
  const monthlyPL: Record<string, number> = {};

  // Process chronologically
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  for (const tx of sorted) {
    const sym = tx.symbol;
    if (!buyQueues[sym]) buyQueues[sym] = [];

    if (tx.type === "BUY") {
      buyQueues[sym].push({ shares: tx.shares, price: tx.price });
    } else if (tx.type === "SELL") {
      let sharesLeft = tx.shares;
      let realizedPL = 0;

      while (sharesLeft > 0 && buyQueues[sym].length > 0) {
        const buy = buyQueues[sym][0];
        const matched = Math.min(sharesLeft, buy.shares);
        realizedPL += matched * (tx.price - buy.price);
        buy.shares -= matched;
        sharesLeft -= matched;
        if (buy.shares <= 0) buyQueues[sym].shift();
      }

      const month = tx.date.substring(0, 7); // YYYY-MM
      monthlyPL[month] = (monthlyPL[month] || 0) + realizedPL;
    }
  }

  const headers = ["Month", "Realized P/L (USD)", "Realized P/L (THB)"];
  const rows = Object.entries(monthlyPL)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, pl]) => [
      month,
      pl.toFixed(2),
      (pl * exchangeRate).toFixed(2),
    ].join(","));

  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const today = new Date().toISOString().split("T")[0];
  link.setAttribute("href", url);
  link.setAttribute("download", `stockwise-pl-summary-${today}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
