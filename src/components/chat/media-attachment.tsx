"use client";

import * as React from "react";
import {
  ArrowsOutSimple,
  CircleNotch,
  DownloadSimple,
  File,
  FilePdf,
} from "@phosphor-icons/react/dist/ssr";

import { api } from "@/lib/api";
import type { MediaObject } from "@/lib/types";
import { cn } from "@/lib/utils";

import { MediaPreviewer, downloadAsset } from "./media-previewer";

/**
 * Renders an attachment inline (image/video/audio thumbnail / PDF chip / file
 * chip) and opens a fullscreen previewer on click for everything we can
 * render in-browser. Dev presigns (`dev-download.local`) skip the actual
 * fetch and just show a labelled chip.
 */
export function MediaAttachment({
  mediaId,
  mime,
  caption,
}: {
  mediaId: string;
  mime?: string;
  caption?: string;
}) {
  const [url, setUrl] = React.useState<string | null>(null);
  const [media, setMedia] = React.useState<MediaObject | null>(null);
  const [failed, setFailed] = React.useState(false);
  const [previewOpen, setPreviewOpen] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await api.mediaDetail(mediaId);
        if (!alive) return;
        setMedia(r.media);
        setUrl(r.download_url);
      } catch {
        if (alive) setFailed(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [mediaId]);

  const m = (mime || media?.mime || "").toLowerCase();
  const isImage = m.startsWith("image/") || media?.kind === "image";
  const isVideo = m.startsWith("video/");
  const isAudio = m.startsWith("audio/") || media?.kind === "voice" || media?.kind === "tts_output";
  const isPdf = m.includes("pdf");
  const isDev = !!url && (url.includes("dev-download.local") || url.includes("dev-upload.local"));

  // Decide the placeholder shape *before* the URL is known, so the bubble
  // doesn't visibly snap to size when the image actually arrives.
  const probablyVisual =
    (mime || "").toLowerCase().startsWith("image/") ||
    (mime || "").toLowerCase().startsWith("video/");

  if (failed) return <span className="text-xs text-destructive">attachment unavailable</span>;
  if (!url) {
    if (probablyVisual) {
      return (
        <div
          className="flex w-72 max-w-full items-center justify-center border bg-card"
          style={{ aspectRatio: "4 / 3" }}
          aria-busy="true"
        >
          <CircleNotch className="h-4 w-4 animate-spin opacity-40" />
        </div>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <CircleNotch className="h-3 w-3 animate-spin" /> loading…
      </span>
    );
  }

  // Filename / label used by both the preview header and the download.
  const filename = caption?.trim() || media?.kind || "file";

  // Image — clickable thumbnail in a fixed-aspect frame so the bubble
  // doesn't reflow when the actual pixels arrive over the network.
  if (isImage && !isDev) {
    return (
      <>
        <figure className="space-y-1">
          <div
            className="group relative w-72 max-w-full border bg-card"
            style={{ aspectRatio: "4 / 3" }}
          >
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              aria-label="preview image"
              className="block h-full w-full"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- presigned/public S3 */}
              <img
                src={url}
                alt={caption || ""}
                className="h-full w-full object-contain transition-opacity hover:opacity-90"
              />
            </button>
            <DownloadOverlay onClick={() => downloadAsset(url, filename)} />
          </div>
          {caption && <figcaption className="text-xs text-muted-foreground">{caption}</figcaption>}
        </figure>
        <MediaPreviewer
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          url={url}
          mime={m}
          filename={filename}
        />
      </>
    );
  }

  // Video — same fixed-aspect-frame treatment so loading doesn't shift the
  // bubble; the inline player handles its own controls.
  if (isVideo && !isDev) {
    return (
      <>
        <div
          className="group relative w-72 max-w-full border bg-card"
          style={{ aspectRatio: "16 / 9" }}
        >
          <video
            src={url}
            controls
            className="h-full w-full bg-black object-contain"
          />
          <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <IconChip onClick={() => setPreviewOpen(true)} label="expand">
              <ArrowsOutSimple />
            </IconChip>
            <IconChip onClick={() => downloadAsset(url, filename)} label="download">
              <DownloadSimple />
            </IconChip>
          </div>
        </div>
        <MediaPreviewer
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          url={url}
          mime={m}
          filename={filename}
        />
      </>
    );
  }

  // Audio — inline player with download next to it. No previewer (modal
  // doesn't help audio).
  if (isAudio && !isDev) {
    return (
      <div className="flex w-full items-center gap-2">
        <audio src={url} controls className="min-w-0 flex-1" />
        <IconChip onClick={() => downloadAsset(url, filename)} label="download">
          <DownloadSimple />
        </IconChip>
      </div>
    );
  }

  // PDF — chip with preview + download. We don't try to render the iframe
  // inline since most PDFs need real estate. `text-foreground` is explicit
  // because the parent (my own bubble) sets `text-primary-foreground` and
  // would otherwise leave the chip's text invisible-on-card.
  if (isPdf && !isDev) {
    return (
      <>
        <div className="flex items-center gap-2 border bg-card px-3 py-2 text-xs text-foreground">
          <FilePdf className="h-5 w-5 shrink-0" />
          <span className="min-w-0 flex-1 truncate">{filename}</span>
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="border bg-foreground px-2 py-1 text-background transition-opacity hover:opacity-80"
          >
            preview
          </button>
          <IconChip onClick={() => downloadAsset(url, filename)} label="download">
            <DownloadSimple />
          </IconChip>
        </div>
        <MediaPreviewer
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          url={url}
          mime={m}
          filename={filename}
        />
      </>
    );
  }

  // Fallback: file chip with download. Used for unknown types or any asset
  // served via a dev placeholder URL. Same `text-foreground` rationale as
  // the PDF chip — pin the ink color so the chip stays readable inside a
  // primary-colored "mine" bubble.
  return (
    <div className="inline-flex items-center gap-2 border bg-card px-3 py-2 text-xs text-foreground">
      <File className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{filename}</span>
      {!isDev && (
        <IconChip onClick={() => downloadAsset(url, filename)} label="download">
          <DownloadSimple />
        </IconChip>
      )}
    </div>
  );
}

/** Hover-revealed download tag in the corner of an image. */
function DownloadOverlay({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="download"
      className={cn(
        "absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center border",
        "bg-background/80 text-foreground opacity-0 backdrop-blur-sm transition-opacity",
        "group-hover:opacity-100",
      )}
    >
      <DownloadSimple className="h-3.5 w-3.5" />
    </button>
  );
}

/** Small bordered icon button used in the video overlay and the file chip. */
function IconChip({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center border bg-background text-foreground transition-colors hover:bg-accent"
    >
      {children}
    </button>
  );
}
