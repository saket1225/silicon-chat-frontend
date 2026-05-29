// Ultra-minimal inline markdown.
//
// We render `**bold**`, `*italic*` / `_italic_`, `~~strike~~`, `` `code` ``,
// auto-link bare URLs, and keep newlines. Anything else is treated as plain
// text. No HTML injection — every output node is either a literal string or
// one of the wrappers below, and React escapes children itself.

import * as React from "react";

const URL_RE = /\bhttps?:\/\/[^\s<>"']+/g;

// The single regex matches every supported token. Order matters: bold
// before italic so `**` doesn't get eaten by the single-asterisk rule.
const TOKEN_RE =
  /(\*\*[^*\n]+\*\*)|(__[^_\n]+__)|(~~[^~\n]+~~)|(`[^`\n]+`)|(\*[^*\n]+\*)|(_[^_\n]+_)|(\bhttps?:\/\/[^\s<>"']+)/g;

/** Returns an array of React nodes (and bare strings) rendered from `text`. */
export function renderMarkdown(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  // Split on newlines first so we can preserve them as <br /> nodes.
  const lines = text.split("\n");
  lines.forEach((line, i) => {
    out.push(...inline(line, `${i}`));
    if (i < lines.length - 1) out.push(React.createElement("br", { key: `br-${i}` }));
  });
  return out;
}

function inline(text: string, base: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;
  let n = 0;
  while ((match = TOKEN_RE.exec(text)) !== null) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
    const raw = match[0];
    const key = `${base}-${n++}`;
    if (raw.startsWith("**") && raw.endsWith("**")) {
      nodes.push(React.createElement("strong", { key }, raw.slice(2, -2)));
    } else if (raw.startsWith("__") && raw.endsWith("__")) {
      nodes.push(React.createElement("strong", { key }, raw.slice(2, -2)));
    } else if (raw.startsWith("~~") && raw.endsWith("~~")) {
      nodes.push(React.createElement("del", { key }, raw.slice(2, -2)));
    } else if (raw.startsWith("`") && raw.endsWith("`")) {
      nodes.push(
        React.createElement(
          "code",
          { key, className: "rounded bg-foreground/10 px-1 font-mono text-[0.9em]" },
          raw.slice(1, -1),
        ),
      );
    } else if (raw.startsWith("*") && raw.endsWith("*")) {
      nodes.push(React.createElement("em", { key }, raw.slice(1, -1)));
    } else if (raw.startsWith("_") && raw.endsWith("_")) {
      nodes.push(React.createElement("em", { key }, raw.slice(1, -1)));
    } else if (URL_RE.test(raw)) {
      URL_RE.lastIndex = 0;
      nodes.push(
        React.createElement(
          "a",
          {
            key,
            href: raw,
            target: "_blank",
            rel: "noopener noreferrer",
            className: "underline underline-offset-2 hover:opacity-80",
          },
          raw,
        ),
      );
    } else {
      nodes.push(raw);
    }
    cursor = match.index + raw.length;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

/** Extract every URL from a chunk of text — used for link previews. */
export function extractUrls(text: string): string[] {
  const found = text.match(URL_RE);
  return found ? Array.from(new Set(found)) : [];
}
