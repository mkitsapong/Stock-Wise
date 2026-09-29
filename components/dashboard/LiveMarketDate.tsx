"use client";

import { useEffect, useState } from "react";

export default function LiveMarketDate() {
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    setDateStr(
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  }, []);

  return <span>{dateStr}</span>;
}
