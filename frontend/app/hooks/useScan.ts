"use client";

import { useState } from "react";
import { startScan } from "@/lib/scanApi";

export default function useScan() {
  const [loading, setLoading] = useState(false);

  const start = async (url: string) => {
    try {
      setLoading(true);
      const sanitizedUrl = url.trim();
      const targetUrl = sanitizedUrl.startsWith("http://") || sanitizedUrl.startsWith("https://")
        ? sanitizedUrl
        : `https://${sanitizedUrl}`;
      const data = await startScan(targetUrl);
      return data;
    } finally {
      setLoading(false);
    }
  };

  return { start, loading };
}
