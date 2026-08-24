import "server-only";

import { getCodexAppServer } from "./codex-app-server";

export function getAiClient() {
  return getCodexAppServer();
}

export function assertWithinAiBudget(monthToDateUsd?: number, requestedUsd?: number) {
  void monthToDateUsd;
  void requestedUsd;
  // ChatGPT-account usage is governed by Codex rate limits, not API-key spend.
}
