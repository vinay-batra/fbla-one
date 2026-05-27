"use client";

import { usePathname } from "next/navigation";
import { AmbientOrbs } from "./AmbientOrbs";

/** Mounts AmbientOrbs everywhere EXCEPT inside /app (dashboard stays clean). */
const HIDDEN_PREFIXES = ["/app", "/auth"];

export function ConditionalAmbientOrbs() {
  const pathname = usePathname() || "/";
  if (HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return null;
  }
  return <AmbientOrbs />;
}
