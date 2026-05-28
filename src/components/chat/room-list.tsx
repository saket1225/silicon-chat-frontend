"use client";

import * as React from "react";

import type { Room } from "@/lib/types";
import { roomDisplay } from "@/lib/peers";
import { cn, relativeTime } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IdAvatar } from "@/components/profile/id-avatar";

interface Props {
  rooms: Room[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  loading?: boolean;
  className?: string;
  /** Set when a file is being dragged over a row; we use it to switch into
   *  that room after a brief hold (see chat page). */
  hoverRoomId?: string | null;
  onRoomDragEnter?: (roomId: string) => void;
  onRoomDragLeave?: (roomId: string) => void;
}

export function RoomList({
  rooms,
  selectedId,
  onSelect,
  onNew,
  loading,
  className,
  hoverRoomId,
  onRoomDragEnter,
  onRoomDragLeave,
}: Props) {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col bg-background", className)}>
      <ScrollArea className="flex-1">
        <ul className="divide-y">
          {loading && (
            <li className="py-6 pl-6 pr-4 text-sm text-muted-foreground">loading…</li>
          )}
          {!loading && rooms.length === 0 && (
            <li>
              <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
                <p className="text-sm text-muted-foreground">No conversations yet.</p>
                <Button onClick={onNew}>Start a new chat</Button>
              </div>
            </li>
          )}
          {rooms.map((r) => {
            const d = roomDisplay(r);
            const isHover = hoverRoomId === r.room_id;
            return (
              <li key={r.room_id}>
                <button
                  type="button"
                  onClick={() => onSelect(r.room_id)}
                  onDragEnter={(e) => {
                    // Only the file-drag case matters — text/link drags from
                    // within the page would otherwise also fire this.
                    if (e.dataTransfer?.types?.includes("Files")) {
                      onRoomDragEnter?.(r.room_id);
                    }
                  }}
                  onDragLeave={() => onRoomDragLeave?.(r.room_id)}
                  onDragOver={(e) => {
                    if (e.dataTransfer?.types?.includes("Files")) e.preventDefault();
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 py-3 pl-6 pr-4 text-left transition-colors",
                    selectedId === r.room_id
                      ? "bg-secondary"
                      : isHover
                        ? "bg-accent"
                        : "hover:bg-secondary/60",
                  )}
                >
                  <IdAvatar
                    seed={d.handle}
                    src={d.photoUrl}
                    size={36}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{d.name}</span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {relativeTime(r.updated_at)}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {d.subtitle}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </div>
  );
}
