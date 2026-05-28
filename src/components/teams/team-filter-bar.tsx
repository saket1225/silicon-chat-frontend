"use client";

import * as React from "react";
import { Info, Sparkle, Tray, UsersThree } from "@phosphor-icons/react/dist/ssr";

import type { Team } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface ChatFilters {
  teams: string[]; // selected team slugs
  unread: boolean;
  kinds: ("carbon" | "silicon")[];
}

export const EMPTY_FILTERS: ChatFilters = { teams: [], unread: false, kinds: [] };

interface Props {
  teams: Team[];
  filters: ChatFilters;
  onChange: (f: ChatFilters) => void;
  onOpenTeam: (slug: string) => void;
}

/** WhatsApp-style filter row: composable Unread / Carbons / Silicons + a chip
 *  per team (toggles a team filter; the info icon opens the team panel). */
export function TeamFilterBar({ teams, filters, onChange, onOpenTeam }: Props) {
  const toggleKind = (k: "carbon" | "silicon") =>
    onChange({
      ...filters,
      kinds: filters.kinds.includes(k)
        ? filters.kinds.filter((x) => x !== k)
        : [...filters.kinds, k],
    });

  const toggleTeam = (slug: string) =>
    onChange({
      ...filters,
      teams: filters.teams.includes(slug)
        ? filters.teams.filter((x) => x !== slug)
        : [...filters.teams, slug],
    });

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto border-b py-2 pl-6 pr-3">
      <Chip active={filters.unread} onClick={() => onChange({ ...filters, unread: !filters.unread })}>
        <Tray className="h-3.5 w-3.5" /> Unread
      </Chip>
      <Chip active={filters.kinds.includes("carbon")} onClick={() => toggleKind("carbon")}>
        <UsersThree className="h-3.5 w-3.5" /> Carbons
      </Chip>
      <Chip active={filters.kinds.includes("silicon")} onClick={() => toggleKind("silicon")}>
        <Sparkle className="h-3.5 w-3.5" /> Silicons
      </Chip>

      {teams.length > 0 && <span className="mx-1 h-5 w-px shrink-0 bg-border" />}

      {teams.map((t) => (
        <Chip key={t.slug} active={filters.teams.includes(t.slug)} onClick={() => toggleTeam(t.slug)}>
          {t.name}
          <button
            type="button"
            aria-label={`${t.name} details`}
            onClick={(e) => {
              e.stopPropagation();
              onOpenTeam(t.slug);
            }}
            className="-mr-1 ml-0.5 grid h-4 w-4 place-items-center opacity-60 hover:opacity-100"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </Chip>
      ))}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 border px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "bg-card hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}
