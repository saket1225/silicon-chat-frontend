"use client";

import * as React from "react";
import {
  Check,
  Checks,
  DotsThree,
  MusicNote,
  Sparkle,
  Trash,
  WarningCircle,
} from "@phosphor-icons/react/dist/ssr";

import type { Event, ProgressState } from "@/lib/types";
import { cn, relativeTime } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IdAvatar } from "@/components/profile/id-avatar";
import { MediaAttachment } from "@/components/chat/media-attachment";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type MessageStatus =
  | "pending" // optimistic local insert — POST not acked yet
  | "sent" // server acked POST → at server, awaiting broadcast
  | "delivered" // WS broadcast echoed back to us → on its way to peers
  | "read" // peer issued a read_receipt at or past this event
  | "failed"; // POST errored — show retry affordance

interface Props {
  event: Event;
  isMine: boolean;
  isOwnSilicon?: boolean;
  onTakeBack?: (eventId: string, force?: boolean) => void;
  /** Send-receipt for messages this Carbon authored. Ignored for received messages. */
  status?: MessageStatus;
  /** Photo URL for the sender — used when rendering the message-side avatar. */
  senderPhotoUrl?: string | null;
  /** Click on the avatar/profile chip opens the sender's profile. */
  onSenderClick?: (sender: { kind: "carbon" | "silicon"; handle: string }) => void;
  /**
   * Set by the parent based on whether this message is the *last* in a
   * (sender, minute) group. When false, we skip the meta row entirely —
   * earlier messages in the same minute share the time + receipt rendered
   * on the last bubble in the run.
   */
  showTime?: boolean;
  /** First bubble of a (received) sender run renders the avatar + handle. */
  showSender?: boolean;
}

export function MessageBubble({
  event,
  isMine,
  isOwnSilicon,
  onTakeBack,
  status,
  senderPhotoUrl,
  onSenderClick,
  showTime = true,
  showSender = true,
}: Props) {
  if (event.type === "m.system") {
    return (
      <div className="my-2 flex justify-center">
        <Badge variant="secondary">{String(event.content.body ?? "system event")}</Badge>
      </div>
    );
  }
  if (event.type === "m.session_marker") {
    const action = String(event.content.action ?? "new");
    return (
      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <div className="text-xs text-muted-foreground">
          session {action} {event.content.summary ? `· ${event.content.summary}` : ""}
        </div>
        <div className="h-px flex-1 bg-border" />
      </div>
    );
  }
  if (event.type === "m.progress" && event.content.state === "done") {
    return (
      <div className="my-2 flex items-start gap-2">
        <Sparkle className="mt-1 h-4 w-4 text-primary" />
        <div className="text-sm">
          <div className="font-medium">Silicon finished</div>
          {event.content.summary ? (
            <div className="text-muted-foreground">{String(event.content.summary)}</div>
          ) : null}
        </div>
      </div>
    );
  }

  const redacted = event.redacted_at !== null;
  // Prefer the sender's handle (carbon username == carbon_id, or silicon name);
  // fall back to the kind only if we don't have it (e.g. system events).
  const senderLabel = event.sender_handle
    ? `@${event.sender_handle}`
    : event.sender_kind === "silicon"
      ? "Silicon"
      : event.sender_kind === "carbon"
        ? "Carbon"
        : "system";
  const senderHandle = event.sender_handle ?? "";
  const senderKind = event.sender_kind === "silicon" ? "silicon" : "carbon";
  const handleAvatarClick = () => {
    if (!senderHandle) return;
    if (event.sender_kind !== "carbon" && event.sender_kind !== "silicon") return;
    onSenderClick?.({ kind: senderKind, handle: senderHandle });
  };

  // We tighten the vertical gap between consecutive bubbles in the same
  // (sender, minute) group so they read as a single block.
  const inGroupGap = !showSender && !showTime;

  return (
    <div
      className={cn(
        "flex w-full gap-2",
        inGroupGap ? "my-0.5" : "my-1.5",
        isMine ? "justify-end" : "justify-start",
      )}
    >
      {!isMine && (
        // Avatar slot stays present even on middle-of-group bubbles so the
        // text aligns vertically; we just hide the actual mark when it's
        // not the first message in the run.
        <div className="mt-1 w-7 shrink-0">
          {showSender && (
            <button
              type="button"
              onClick={handleAvatarClick}
              aria-label={senderHandle ? `${senderHandle} — profile` : "profile"}
              className="block transition-opacity hover:opacity-80"
            >
              <IdAvatar seed={senderHandle || "?"} src={senderPhotoUrl} size={28} />
            </button>
          )}
        </div>
      )}
      <div className={cn("max-w-[70%] space-y-1", isMine && "items-end")}>
        {/* Sender label on the first received bubble of a run only. */}
        {!isMine && showSender && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span>{senderLabel}</span>
          </div>
        )}
        <div
          className={cn(
            "group relative rounded-lg px-3 py-2 text-sm",
            redacted
              ? "border bg-muted text-muted-foreground italic"
              : isMine
                ? "bg-primary text-primary-foreground"
                : "border bg-card",
          )}
        >
          {redacted ? (
            <span>[message redacted: {event.redaction_reason}]</span>
          ) : (
            <Body event={event} />
          )}
          {isMine && isOwnSilicon && !redacted && onTakeBack && (
            <div className="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-primary-foreground/80">
                    <DotsThree className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onTakeBack(event.event_id)}>
                    <Trash className="mr-2 h-3.5 w-3.5" />
                    take back (if unread)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onTakeBack(event.event_id, true)}>
                    <Trash className="mr-2 h-3.5 w-3.5" />
                    take back (force)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
        {/* Time + receipt — rendered only on the last bubble of a (sender,
            minute) run, so a quick back-to-back exchange shows one common
            timestamp instead of one per line. Streaming indicator escapes
            the gate because it's a live state, not historical metadata. */}
        {(showTime || !event.is_final) && (
          <div
            className={cn(
              "flex items-center gap-1.5 text-[10px] text-muted-foreground",
              isMine && "justify-end",
            )}
          >
            {showTime && <span>{relativeTime(event.created_at)}</span>}
            {showTime && isMine && status && <Receipt status={status} />}
            {!event.is_final && <span className="text-primary">streaming…</span>}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * WhatsApp/Telegram-style send-state pip rendered next to the timestamp on
 * my own messages.
 *   • pending   → single ✓, low opacity (POST in flight)
 *   • sent      → single ✓ (server acked)
 *   • delivered → double ✓ (WS broadcast confirms it's been distributed)
 *   • read      → double ✓ in success green (peer issued a read_receipt)
 *   • failed    → a small alert (POST errored, retry on next send)
 */
function Receipt({ status }: { status: MessageStatus }) {
  const title =
    status === "pending"
      ? "sending"
      : status === "sent"
        ? "sent"
        : status === "delivered"
          ? "delivered"
          : status === "read"
            ? "read"
            : "failed";
  if (status === "failed")
    return <WarningCircle className="h-3 w-3 text-destructive" aria-label={title} />;
  if (status === "delivered")
    return <Checks className="h-3 w-3" aria-label={title} />;
  if (status === "read")
    return <Checks className="h-3 w-3 text-[var(--success)]" aria-label={title} />;
  return (
    <Check
      className={cn("h-3 w-3", status === "pending" && "opacity-40")}
      aria-label={title}
    />
  );
}

function Body({ event }: { event: Event }) {
  const c = event.content;
  switch (event.type) {
    case "m.text":
      return <div className="whitespace-pre-wrap break-words">{String(c.body ?? "")}</div>;
    case "m.image":
    case "m.file":
      return c.media_id ? (
        <MediaAttachment
          mediaId={String(c.media_id)}
          mime={c.mime ? String(c.mime) : undefined}
          caption={c.caption ? String(c.caption) : undefined}
        />
      ) : (
        <span className="text-xs text-muted-foreground">{String(c.caption ?? "attachment")}</span>
      );
    case "m.voice":
      return (
        <div className="space-y-1">
          {c.media_id ? (
            <MediaAttachment mediaId={String(c.media_id)} mime="audio/mpeg" />
          ) : (
            <div className="flex items-center gap-2 text-xs">
              <MusicNote className="h-4 w-4" /> voice note
            </div>
          )}
          {c.transcript ? (
            <div className="text-xs text-muted-foreground">“{String(c.transcript)}”</div>
          ) : null}
        </div>
      );
    case "m.tts":
      return (
        <div className="space-y-1">
          {c.media_id ? (
            <MediaAttachment mediaId={String(c.media_id)} mime="audio/mpeg" />
          ) : (
            <div className="flex items-center gap-2 text-xs">
              <Sparkle className="h-4 w-4" /> tts
            </div>
          )}
          {c.text ? <div className="text-xs italic">“{String(c.text)}”</div> : null}
        </div>
      );
    case "m.progress": {
      const state = (c.state as ProgressState) || "thinking";
      return (
        <div className="flex items-center gap-2 text-xs">
          <Sparkle className="h-3.5 w-3.5" />
          <span>{state.replaceAll("_", " ")}</span>
          {c.note ? <span className="text-muted-foreground">· {String(c.note)}</span> : null}
        </div>
      );
    }
    default:
      return <pre className="text-xs">{JSON.stringify(c, null, 2)}</pre>;
  }
}
