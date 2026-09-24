"use client";

import { useEffect } from "react";

/** Registers /sw.js once — enables offline cache + PWA installability. No UI. */
export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && window.location.protocol.startsWith("http")) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Offline support is best-effort; site works fine without it.
      });
    }
  }, []);
  return null;
}
