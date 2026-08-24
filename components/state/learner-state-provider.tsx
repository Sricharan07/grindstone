"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createDefaultLearnerState } from "@/lib/product/default-state";
import { reduceLearnerState } from "@/lib/product/reducer";
import type { LearnerAction, LearnerState } from "@/lib/product/types";
import { synchronizeTemporalState } from "@/lib/product/sprint-clock";
import { hydrateLearnerState } from "@/lib/product/hydrate-state";

interface LearnerStateValue {
  state: LearnerState;
  dispatch: (action: LearnerAction) => void;
  ready: boolean;
  persistence: "postgres" | "memory" | "browser";
}

const LearnerStateContext = createContext<LearnerStateValue | null>(null);
const storageKey = "grindstone-learner-state-v2";
const legacyStorageKey = "grindstone-learner-state-v1";

export function LearnerStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LearnerState>(createDefaultLearnerState);
  const [ready, setReady] = useState(false);
  const [persistence, setPersistence] = useState<LearnerStateValue["persistence"]>("browser");
  const syncQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    const local = window.localStorage.getItem(storageKey) ?? window.localStorage.getItem(legacyStorageKey);
    if (local) {
      try {
        const parsed = JSON.parse(local) as LearnerState;
        window.queueMicrotask(() => setState(synchronizeTemporalState(hydrateLearnerState(parsed))));
      } catch { window.localStorage.removeItem(storageKey); }
    }
    const controller = new AbortController();
    fetch("/api/state", { signal: controller.signal })
      .then(async (response) => response.ok ? response.json() as Promise<{ state: LearnerState; persistence: "postgres" | "memory" }> : null)
      .then((result) => {
        if (!result) return;
        setState((current) => result.state.revision >= current.revision ? synchronizeTemporalState(hydrateLearnerState(result.state)) : current);
        setPersistence(result.persistence);
      })
      .catch(() => undefined)
      .finally(() => setReady(true));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state]);

  const dispatch = useCallback((action: LearnerAction) => {
    setState((current) => reduceLearnerState(current, action));
    syncQueue.current = syncQueue.current
      .catch(() => undefined)
      .then(async () => {
        const response = await fetch("/api/state", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(action) });
        if (!response.ok) throw new Error("State sync failed");
        const result = await response.json() as { state: LearnerState; persistence: "postgres" | "memory" };
        setPersistence(result.persistence);
        setState((latest) => result.state.revision >= latest.revision ? result.state : latest);
      })
      .catch(() => setPersistence("browser"));
  }, []);

  const value = useMemo(() => ({ state, dispatch, ready, persistence }), [state, dispatch, ready, persistence]);
  return <LearnerStateContext.Provider value={value}>{children}</LearnerStateContext.Provider>;
}

export function useLearnerState() {
  const value = useContext(LearnerStateContext);
  if (!value) throw new Error("useLearnerState must be used inside LearnerStateProvider");
  return value;
}
