"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
  disabled?: boolean;
  /** Fired once all boxes are filled. */
  onComplete?: (value: string) => void;
  className?: string;
  ariaLabel?: string;
}

/** A segmented numeric code input (one box per digit) with paste + keyboard nav. */
export function OtpInput({
  value,
  onChange,
  length = 6,
  autoFocus,
  disabled,
  onComplete,
  className,
  ariaLabel = "Verification code",
}: OtpInputProps) {
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);

  const digits = React.useMemo(() => {
    const arr = value.replace(/\D/g, "").slice(0, length).split("");
    while (arr.length < length) arr.push("");
    return arr;
  }, [value, length]);

  const focusBox = (i: number) => {
    const idx = Math.max(0, Math.min(length - 1, i));
    const el = refs.current[idx];
    el?.focus();
    el?.select();
  };

  const commit = (next: string[], focusAt: number) => {
    const joined = next.join("").slice(0, length);
    onChange(joined);
    focusBox(focusAt);
    if (joined.length === length) onComplete?.(joined);
  };

  const handleChange = (i: number, raw: string) => {
    const only = raw.replace(/\D/g, "");
    const next = digits.slice();
    if (!only) {
      next[i] = "";
      onChange(next.join(""));
      return;
    }
    let pos = i;
    for (const ch of only.split("")) {
      if (pos >= length) break;
      next[pos] = ch;
      pos++;
    }
    commit(next, pos);
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = digits.slice();
      if (next[i]) {
        next[i] = "";
        onChange(next.join(""));
      } else if (i > 0) {
        next[i - 1] = "";
        onChange(next.join(""));
        focusBox(i - 1);
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusBox(i - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusBox(i + 1);
    }
  };

  const handlePaste = (i: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!text) return;
    e.preventDefault();
    const next = digits.slice();
    let pos = i;
    for (const ch of text.split("")) {
      if (pos >= length) break;
      next[pos] = ch;
      pos++;
    }
    commit(next, pos);
  };

  return (
    <div
      className={cn("flex gap-2", className)}
      role="group"
      aria-label={ariaLabel}
    >
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={length}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          onFocus={(e) => e.target.select()}
          aria-label={`Digit ${i + 1}`}
          className="h-12 w-full min-w-0 border border-input bg-transparent text-center text-lg tabular-nums outline-none transition-colors focus-visible:border-ring disabled:opacity-50"
        />
      ))}
    </div>
  );
}
