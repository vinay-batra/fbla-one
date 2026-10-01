"use client";

import { useQrCode } from "./useQrCode";

/** A QR code drawn in the browser (see useQrCode); an empty square until ready. */
export function QrImage({ text, size, alt }: { text: string; size: number; alt: string }) {
  const src = useQrCode(text, size);
  if (!src) return <span style={{ display: "block", width: size, height: size }} aria-hidden="true" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} width={size} height={size} />;
}
