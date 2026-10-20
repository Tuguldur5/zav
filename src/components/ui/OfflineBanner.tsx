"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-warm px-4 py-2 text-[0.9em] font-medium text-warm-ink"
    >
      <WifiOff aria-hidden className="size-4" />
      Интернэт холболтгүй байна. Дахин холбогдсоны дараа үргэлжлүүлнэ үү.
    </div>
  );
}
