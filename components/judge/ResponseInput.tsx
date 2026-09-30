"use client";

import { useEffect, useRef } from "react";
import { useSpeech } from "./useSpeech";
import { countWords } from "./types";

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  /** Called once when any text arrives from the microphone. */
  onSpoken?: () => void;
  placeholder?: string;
  hint?: string;
  rows?: number;
  maxLength?: number;
  disabled?: boolean;
  /** Show a spoken-length estimate next to the word count. */
  showSpokenEstimate?: boolean;
  /** Visually hide the label (it stays for screen readers). */
  hideLabel?: boolean;
};

// Conversational speaking pace used for the "about N min aloud" estimate.
const WORDS_PER_MINUTE = 140;

function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}

export function ResponseInput({
  id,
  label,
  value,
  onChange,
  onSpoken,
  placeholder,
  hint,
  rows = 10,
  maxLength,
  disabled,
  showSpokenEstimate,
  hideLabel,
}: Props) {
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const speech = useSpeech((phrase) => {
    const prev = valueRef.current;
    const joiner = prev && !/\s$/.test(prev) ? " " : "";
    let next = prev + joiner + phrase;
    if (maxLength) next = next.slice(0, maxLength);
    valueRef.current = next;
    onChange(next);
    onSpoken?.();
  });

  // Stop listening if the field is locked mid-sentence (time up, submitted).
  const { listening, stop } = speech;
  useEffect(() => {
    if (disabled && listening) stop();
  }, [disabled, listening, stop]);

  const words = countWords(value);
  const minutes = words / WORDS_PER_MINUTE;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = speech.error ? `${id}-mic-error` : undefined;

  return (
    <div className="judge-input">
      <div className="judge-input-head">
        <label htmlFor={id} className={hideLabel ? "sr-only" : "judge-input-label"}>
          {label}
        </label>
        {speech.supported && (
          <button
            type="button"
            className={`judge-mic${speech.listening ? " judge-mic-on" : ""}`}
            aria-pressed={speech.listening}
            onClick={speech.listening ? speech.stop : speech.start}
            disabled={disabled}
          >
            <MicIcon />
            <span>{speech.listening ? "Stop listening" : "Speak"}</span>
            {speech.listening && <span className="judge-mic-dot" aria-hidden="true" />}
          </button>
        )}
      </div>
      {hint && (
        <p id={hintId} className="judge-input-hint">
          {hint}
        </p>
      )}
      <textarea
        id={id}
        className="input-field judge-textarea"
        rows={rows}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {speech.listening && (
        <p className="judge-interim">
          <span className="judge-interim-label">Listening</span>
          {speech.interim ? <span className="judge-interim-text">{speech.interim}</span> : <span className="judge-interim-text judge-interim-idle">Start talking. Your words appear above as you finish each phrase.</span>}
        </p>
      )}
      {speech.error && (
        <p id={errorId} className="judge-input-error" role="alert">
          {speech.error}
        </p>
      )}
      <p className="judge-count">
        {words} {words === 1 ? "word" : "words"}
        {showSpokenEstimate && words > 0 && `, about ${minutes < 1 ? "under 1" : Math.round(minutes)} min aloud`}
      </p>
    </div>
  );
}
