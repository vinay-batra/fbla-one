"use client";

import { useEffect, useState } from "react";

/**
 * A QR code for `text`, drawn in the browser as a data URL. Invite links and
 * Mock Regionals codes are secrets, so they are never sent to an outside QR
 * service. The library loads only on the pages that show a code.
 */
export function useQrCode(text: string, size: number): string | null {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    import("qrcode")
      .then((QR) => QR.toDataURL(text, { width: size, margin: 0, errorCorrectionLevel: "M" }))
      .then((url) => { if (!cancelled) setSrc(url); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [text, size]);
  return src;
}
