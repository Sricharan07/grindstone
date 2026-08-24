"use client";

import { useEffect, useMemo, useState } from "react";
import { useLearnerState } from "./learner-state-provider";

export interface CohortMember {
  id: string;
  name: string;
  initials: string;
  xp: number;
  totalXp: number;
  streak: number;
  gate: number | null;
  self: boolean;
}

export interface CohortActivity {
  id: string;
  name: string;
  initials: string;
  action: string;
  detail: string;
  createdAt: string;
}

export function relativeTime(value: string) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

export function useCohort() {
  const { state } = useLearnerState();
  const [remote, setRemote] = useState<{ members: CohortMember[]; activity: CohortActivity[] } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/cohort", { signal: controller.signal })
      .then(async (response) => response.ok ? response.json() as Promise<{ members: CohortMember[]; activity: CohortActivity[] }> : null)
      .then(setRemote)
      .catch(() => undefined);
    return () => controller.abort();
  }, [state.revision]);

  return useMemo(() => remote ?? {
    members: [{ id: "current", name: state.profile.name, initials: state.profile.initials, xp: state.xp, totalXp: state.xp, streak: state.streak.days, gate: state.sprint.gate?.score ?? null, self: true }],
    activity: [],
  }, [remote, state]);
}
