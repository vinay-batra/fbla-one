"use client";

/**
 * Thin wrapper over the browser's Web Speech API (SpeechRecognition, or the
 * webkit-prefixed one in Chrome and Safari). Feature-detected after mount so
 * the server render never shows a mic that might not work; `supported` stays
 * false in Firefox and anywhere else without the API, and callers hide the mic.
 *
 * Final phrases are handed to `onFinal` as they settle; the in-progress phrase
 * is exposed as `interim` for a live transcript.
 */
import { useCallback, useEffect, useRef, useState } from "react";

// The DOM lib bundled with this TypeScript version has no speech recognition
// types, so declare the small surface used here.
type RecognitionAlternative = { transcript: string };
type RecognitionResult = { isFinal: boolean; length: number; [index: number]: RecognitionAlternative };
type RecognitionEvent = {
  resultIndex: number;
  results: { length: number; [index: number]: RecognitionResult };
};
type RecognitionErrorEvent = { error: string };
type Recognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type RecognitionCtor = new () => Recognition;

function getCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const ERROR_TEXT: Record<string, string> = {
  "not-allowed": "Microphone access was blocked. Allow it in your browser settings, or type instead.",
  "service-not-allowed": "Speech recognition is turned off in this browser. You can type instead.",
  "audio-capture": "No microphone was found. You can type instead.",
  network: "Speech recognition lost its connection. Your words so far are saved.",
};

export function useSpeech(onFinal: (text: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  const recRef = useRef<Recognition | null>(null);
  // Chrome ends a session after a pause in speech. While the student still has
  // the mic on, restart it so a breath between points does not cut them off.
  const wantRef = useRef(false);
  const onFinalRef = useRef(onFinal);

  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  useEffect(() => {
    setSupported(getCtor() !== null);
    return () => {
      wantRef.current = false;
      recRef.current?.abort();
    };
  }, []);

  const stop = useCallback(() => {
    wantRef.current = false;
    recRef.current?.stop();
    setListening(false);
    setInterim("");
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) return;
    setError("");
    if (!recRef.current) {
      const rec = new Ctor();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";
      rec.onresult = (e) => {
        let live = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const result = e.results[i];
          const text = result[0]?.transcript ?? "";
          if (result.isFinal) {
            if (text.trim()) onFinalRef.current(text.trim());
          } else {
            live += text;
          }
        }
        setInterim(live.trim());
      };
      rec.onerror = (e) => {
        // "no-speech" and "aborted" are routine (a quiet pause, or a stop).
        if (e.error === "no-speech" || e.error === "aborted") return;
        wantRef.current = false;
        setListening(false);
        setInterim("");
        setError(ERROR_TEXT[e.error] ?? "Speech recognition stopped. You can keep typing.");
      };
      rec.onend = () => {
        setInterim("");
        if (wantRef.current) {
          try {
            rec.start();
            return;
          } catch {
            // Fall through: the browser refused to restart.
          }
        }
        wantRef.current = false;
        setListening(false);
      };
      recRef.current = rec;
    }
    try {
      wantRef.current = true;
      recRef.current.start();
      setListening(true);
    } catch {
      // Already started; treat as listening.
      setListening(true);
    }
  }, []);

  return { supported, listening, interim, error, start, stop };
}
