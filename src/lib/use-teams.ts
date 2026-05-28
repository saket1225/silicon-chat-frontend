"use client";

import * as React from "react";

import { api } from "./api";
import { authStore } from "./auth";
import type { Team } from "./types";

/** Loads the teams the current principal belongs to. */
export function useTeams() {
  const [teams, setTeams] = React.useState<Team[]>([]);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    try {
      setTeams(await api.teams());
    } catch {
      /* leave prior teams */
    }
    setLoading(false);
  }, []);

  // Inline the mount load so no setState runs synchronously in the effect body.
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const t = await api.teams();
        if (alive) setTeams(t);
      } catch {
        /* leave prior teams */
      }
      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { teams, loading, refresh };
}

/** Is the signed-in Carbon a head of this team? */
export function isTeamHead(team: Team): boolean {
  const me = authStore.getCarbon();
  return Boolean(me && team.team_heads.includes(me.carbon_id));
}
