"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CODE_LENGTH, findSessionByCode, joinSession, normalizeCode } from "@/lib/mock";

/**
 * Resolve a join code and join. RLS only returns sessions from the caller's own
 * chapter, so a code from another school simply finds nothing.
 */
export async function joinByCode(
  rawCode: string,
  userId: string
): Promise<{ id: string } | { error: string }> {
  const code = normalizeCode(rawCode);
  if (code.length !== CODE_LENGTH) return { error: `Codes are ${CODE_LENGTH} characters.` };
  const session = await findSessionByCode(code);
  if (!session) return { error: "No session with that code in your chapter. Check the projector and try again." };
  if (session.status === "ended") return { id: session.id }; // go straight to the results
  const err = await joinSession(session.id, userId);
  if (err) return { error: err };
  return { id: session.id };
}

export function JoinPanel({ userId }: { userId: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await joinByCode(code, userId);
    if ("error" in res) {
      setError(res.error);
      setBusy(false);
      return;
    }
    router.push(`/app/mock/${res.id}`);
  }

  return (
    <form className="sheet mock-join" onSubmit={submit} aria-labelledby="mock-join-title">
      <div className="sheet-head">
        <span className="sheet-meta">Join</span>
        <span className="sheet-event">Mock Regionals</span>
      </div>
      <h2 id="mock-join-title" className="mock-setup-title">Enter the code on the board</h2>
      <label htmlFor="mock-code" className="sr-only">Join code</label>
      <input
        id="mock-code"
        className="mock-code-input"
        value={code}
        onChange={(e) => setCode(normalizeCode(e.target.value))}
        inputMode="text"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        maxLength={CODE_LENGTH}
        placeholder="ABC234"
        aria-describedby={error ? "mock-join-error" : undefined}
      />
      {error && (
        <p id="mock-join-error" role="alert" className="mock-alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-accent btn-lg mock-join-btn" disabled={busy || code.length !== CODE_LENGTH}>
        {busy ? "Joining..." : "Join the session"}
      </button>
    </form>
  );
}
