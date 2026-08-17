"use client";

import { useEffect, useRef } from "react";
import { useWatchlist } from "@/context/WatchlistContext";

const ALERT_THRESHOLD_PERCENT = 2; // fire when price is within ±2% of target
const ALERT_COOLDOWN_HOURS = 4;     // don't re-alert for the same symbol for 4 hours
const STORAGE_KEY = "stockwise_price_alerts_fired";

interface WatchlistLiveItem {
  symbol: string;
  name: string;
  targetBuyPrice: number | null;
  currentPrice?: number;
  alertEnabled?: boolean;
}

/** Read & write the "last alerted" map from localStorage */
function getFiredAlerts(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setFiredAlert(symbol: string) {
  try {
    const map = getFiredAlerts();
    map[symbol] = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

function isCoolingDown(symbol: string): boolean {
  const map = getFiredAlerts();
  const last = map[symbol];
  if (!last) return false;
  return Date.now() - last < ALERT_COOLDOWN_HOURS * 60 * 60 * 1000;
}

/**
 * usePriceAlerts
 *
 * Checks each watchlist item that has a targetBuyPrice and sends a browser
 * Web Notification when the live price is within ±ALERT_THRESHOLD_PERCENT.
 *
 * Call once in AppShell so it runs globally.
 */
export function usePriceAlerts(liveItems: WatchlistLiveItem[]) {
  const permissionRef = useRef<NotificationPermission | null>(null);

  // Request notification permission once
  useEffect(() => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "granted") {
      permissionRef.current = "granted";
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((perm) => {
        permissionRef.current = perm;
      });
    } else {
      permissionRef.current = Notification.permission;
    }
  }, []);

  // Watch for price alerts whenever live items change
  useEffect(() => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;
    if (!liveItems || liveItems.length === 0) return;

    for (const item of liveItems) {
      const { symbol, name, targetBuyPrice, currentPrice, alertEnabled } = item;

      // Skip if alert disabled, no target, or no live price
      if (alertEnabled === false) continue;
      if (!targetBuyPrice || !currentPrice || currentPrice <= 0) continue;
      if (isCoolingDown(symbol)) continue;

      const distancePct = Math.abs((currentPrice - targetBuyPrice) / targetBuyPrice) * 100;

      if (distancePct <= ALERT_THRESHOLD_PERCENT) {
        const direction = currentPrice <= targetBuyPrice ? "reached" : "near";
        const emoji = currentPrice <= targetBuyPrice ? "🟢" : "🔔";

        try {
          new Notification(`${emoji} Price Alert: ${symbol}`, {
            body: `${name || symbol} is ${direction} your target of $${targetBuyPrice.toFixed(2)}. Current: $${currentPrice.toFixed(2)}`,
            icon: "/icons/icon-192.png",
            tag: `price-alert-${symbol}`,
          });
          setFiredAlert(symbol);
        } catch (err) {
          console.warn("[PriceAlert] Notification failed:", err);
        }
      }
    }
  }, [liveItems]);
}

/**
 * Per-symbol alert toggle stored in localStorage.
 * Returns [isEnabled, toggle] for a given symbol.
 */
export function usePriceAlertToggle(symbol: string): [boolean, () => void] {
  const TOGGLE_KEY = "stockwise_alert_disabled";

  function getDisabledSet(): Set<string> {
    try {
      const raw = localStorage.getItem(TOGGLE_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  }

  const isEnabled = !getDisabledSet().has(symbol);

  const toggle = () => {
    const set = getDisabledSet();
    if (set.has(symbol)) {
      set.delete(symbol);
    } else {
      set.add(symbol);
    }
    try {
      localStorage.setItem(TOGGLE_KEY, JSON.stringify([...set]));
    } catch {}
    // Force re-render by dispatching a storage event
    window.dispatchEvent(new Event("storage"));
  };

  return [isEnabled, toggle];
}
