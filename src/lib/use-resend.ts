"use client";

import * as React from "react";

import { useCooldown } from "./use-cooldown";

interface ResendOptions {
  /** Cooldown after the first (initial) send, in seconds. */
  initial?: number;
  /** Cooldown after every subsequent send, in seconds. */
  escalated?: number;
  /** Max number of resends (not counting the initial send) before lockout. */
  max?: number;
}

/**
 * Resend throttle for OTP flows. The first send arms a short cooldown; every
 * resend after that arms a longer one. After `max` resends the flow locks out
 * until reset. Call `send()` once for the initial code and once per resend.
 */
export function useResendCooldown({ initial = 20, escalated = 60, max = 10 }: ResendOptions = {}) {
  const cd = useCooldown();
  const [sends, setSends] = React.useState(0); // total sends, including the initial one

  const resends = Math.max(0, sends - 1);
  const lockedOut = resends >= max;

  const send = React.useCallback(() => {
    cd.start(sends === 0 ? initial : escalated);
    setSends((s) => s + 1);
  }, [cd, sends, initial, escalated]);

  const reset = React.useCallback(() => {
    setSends(0);
  }, []);

  return {
    remaining: cd.remaining,
    active: cd.active,
    sends,
    resends,
    max,
    lockedOut,
    /** Arm a cooldown for an initial send or a resend. */
    send,
    /** Clear the resend counter (e.g. when the user edits the target). */
    reset,
  };
}
