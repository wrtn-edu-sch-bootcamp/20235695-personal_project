"use client";

import { useEffect } from "react";

export function DevCacheReset() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (typeof window === "undefined") return;

    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (!isLocal) return;

    const resetDevCache = async () => {
      // 로컬 개발에서는 이전 PWA 캐시가 스타일/청크 로딩을 깨뜨릴 수 있어 정리한다.
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
      }

      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    };

    resetDevCache();
  }, []);

  return null;
}

