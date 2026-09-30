"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getMockContext } from "@/lib/mock";
import { joinByCode } from "./JoinPanel";

/** /app/mock/join/[code]: the QR target. Joins, then drops the student into the room. */
export function MockJoinLink({ code }: { code: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      const ctx = await getMockContext();
      if (!ctx) {
        setError("Sign in, then scan the code again.");
        return;
      }
      if (!ctx.chapter) {
        setError("Join your chapter first, then scan the code again.");
        return;
      }
      if (ctx.isHost) {
        setError("You are the advisor, so you host sessions instead of joining them.");
        return;
      }
      const res = await joinByCode(code, ctx.userId);
      if ("error" in res) setError(res.error);
      else router.replace(`/app/mock/${res.id}`);
    })();
  }, [code, router]);

  if (error) {
    return (
      <div className="mock-page">
        <div className="card mock-note">
          <h3>Could not join</h3>
          <p role="alert">{error}</p>
          <Link href="/app/mock" className="btn btn-accent btn-sm">Enter the code by hand</Link>
        </div>
      </div>
    );
  }
  return <p className="mock-muted mock-page" role="status">Finding your seat...</p>;
}
