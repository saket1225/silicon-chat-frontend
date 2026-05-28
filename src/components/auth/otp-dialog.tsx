"use client";

import * as React from "react";
import { CircleNotch, PencilSimple } from "@phosphor-icons/react/dist/ssr";

import type { useResendCooldown } from "@/lib/use-resend";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OtpInput } from "./otp-input";
import { ResendRow } from "./resend-row";

interface OtpDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  /** The target shown to the user (email or +phone). */
  target: string;
  /** Pencil → go back and edit the target. */
  onEdit: () => void;
  onVerify: (code: string) => void;
  resend: ReturnType<typeof useResendCooldown>;
  onResend: () => void;
  loading: boolean;
}

/** OTP entry dialog with a pencil-to-edit affordance and escalating resend. */
export function OtpDialog({
  open,
  onOpenChange,
  title,
  target,
  onEdit,
  onVerify,
  resend,
  onResend,
  loading,
}: OtpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-1.5">
            <span>
              code sent to <span className="font-medium text-foreground">{target}</span>
            </span>
            <button
              type="button"
              onClick={onEdit}
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="edit"
              title="edit"
            >
              <PencilSimple className="h-3.5 w-3.5" />
            </button>
          </DialogDescription>
        </DialogHeader>
        {/* Body lives inside DialogContent so it unmounts on close — the code box
            resets itself on each open without an effect. */}
        <OtpBody
          target={target}
          onVerify={onVerify}
          resend={resend}
          onResend={onResend}
          loading={loading}
        />
      </DialogContent>
    </Dialog>
  );
}

function OtpBody({
  target,
  onVerify,
  resend,
  onResend,
  loading,
}: Pick<OtpDialogProps, "target" | "onVerify" | "resend" | "onResend" | "loading">) {
  const [code, setCode] = React.useState("");
  return (
    <div className="space-y-4">
      <OtpInput value={code} onChange={setCode} autoFocus onComplete={onVerify} />
      <ResendRow resend={resend} onResend={onResend} loading={loading} />
      <Button
        onClick={() => onVerify(code)}
        disabled={code.length !== 6 || loading}
        className="w-full"
      >
        {loading && <CircleNotch className="animate-spin" />}
        verify
      </Button>
    </div>
  );
}
