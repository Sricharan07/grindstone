import { DockerRunAdapter } from "./docker-run";
import { PistonAdapter } from "./piston";
import type { JudgeAdapter } from "./types";

let adapter: JudgeAdapter | undefined;

export function getJudge(): JudgeAdapter {
  if (adapter) return adapter;
  adapter =
    process.env.JUDGE_ADAPTER === "docker-run"
      ? new DockerRunAdapter()
      : new PistonAdapter();
  return adapter;
}

export * from "./types";
