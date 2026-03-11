"use client";

import { useEffect, useState } from "react";
import { getScanHistory, ScanListItem } from "@/lib/scanApi";
import Link from "next/link";

export default function ScanHistory() {
  const [list, setList] = useState<ScanListItem[]>([]);

  useEffect(() => {
    getScanHistory()
      .then((res) => {
        setList(res.results || []);
      })
      .catch(() => {
        setList([]);
      });
  }, []);

  return (
    <div className="space-y-3">
      {list.map((scan) => (
        <Link
          key={scan.id}
          href={`/scan/${scan.id}`}
          className="block border p-3 rounded"
        >
          {scan.target_url} - {scan.status}
        </Link>
      ))}
    </div>
  );
}
