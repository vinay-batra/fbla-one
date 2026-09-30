"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

/**
 * Mock Regionals QR target: /mock/<CODE>. Public, so a student who scans the
 * projector QR while signed out is sent through sign-in and then straight back
 * into the room (/app itself redirects to /auth without a return path).
 */
export default function MockByCode() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const code = String((params?.code as string) || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    const room = `/app/mock/join/${code}`;
    const supa = getSupabase();
    if (!supa) {
      router.replace(`/auth?next=${encodeURIComponent(room)}`);
      return;
    }
    supa.auth.getUser().then(({ data }) => {
      router.replace(data.user ? room : `/auth?next=${encodeURIComponent(room)}`);
    });
  }, [params, router]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, background: "var(--bg)", color: "var(--text3)" }}>
      <div style={{ width: 28, height: 28, border: "2.5px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p style={{ fontSize: 14 }}>Finding your test room...</p>
    </div>
  );
}
