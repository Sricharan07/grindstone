import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  JUDGE_DEFAULTS,
  truncateOutput,
  type JudgeAdapter,
  type JudgeHealth,
  type Language,
  type RunRequest,
  type RunResult,
} from "./types";

const IMAGE: Record<Language, string> = {
  python: "python:3.12-alpine",
  java: "eclipse-temurin:21-jdk-alpine",
  cpp: "gcc:14",
};

const FILE: Record<Language, string> = {
  python: "solution.py",
  java: "Main.java",
  cpp: "solution.cpp",
};

const COMMAND: Record<Language, string[]> = {
  python: ["python", "/workspace/solution.py"],
  java: ["sh", "-c", "mkdir -p /tmp/out && javac -d /tmp/out /workspace/Main.java && java -cp /tmp/out Main"],
  cpp: ["sh", "-c", "g++ -O2 -std=c++20 /workspace/solution.cpp -o /tmp/solution && /tmp/solution"],
};

export function buildDockerRunArgs(request: RunRequest, workDir: string) {
  return [
    "run",
    "--rm",
    "--network",
    "none",
    "--memory",
    `${request.memoryMb ?? JUDGE_DEFAULTS.memoryMb}m`,
    "--pids-limit",
    String(JUDGE_DEFAULTS.pidsLimit),
    "--read-only",
    "--cpus",
    "1",
    "--tmpfs",
    "/tmp:rw,exec,nosuid,nodev,size=64m",
    "--volume",
    `${workDir}:/workspace:ro`,
    "--workdir",
    "/workspace",
    IMAGE[request.language],
    ...COMMAND[request.language],
  ];
}

function runProcess(command: string, args: string[], timeoutMs: number, stdin = "") {
  return new Promise<{
    stdout: string;
    stderr: string;
    code: number | null;
    signal: NodeJS.Signals | null;
    timedOut: boolean;
  }>((resolve, reject) => {
    const child = spawn(command, args, { stdio: "pipe" });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      stdout = truncateOutput(stdout + chunk.toString());
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr = truncateOutput(stderr + chunk.toString());
    });
    child.on("error", reject);
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, code, signal, timedOut });
    });
    child.stdin.end(stdin);
  });
}

export class DockerRunAdapter implements JudgeAdapter {
  readonly name = "docker-run";
  private readonly readyLanguages = new Set<Language>();

  async health(): Promise<JudgeHealth> {
    try {
      const result = await runProcess("docker", ["version", "--format", "{{.Server.Version}}"], 3000);
      return {
        ok: result.code === 0,
        adapter: this.name,
        detail: result.code === 0 ? `Docker ${result.stdout.trim()}` : result.stderr,
        languages: result.code === 0 ? (["python", "java", "cpp"] as Language[]) : [],
      };
    } catch (error) {
      return {
        ok: false,
        adapter: this.name,
        detail: error instanceof Error ? error.message : "Docker is unavailable",
        languages: [],
      };
    }
  }

  async ensureLanguages(languages: readonly Language[]): Promise<void> {
    for (const language of languages) {
      if (this.readyLanguages.has(language)) continue;
      const inspect = await runProcess("docker", ["image", "inspect", IMAGE[language]], 5_000);
      if (inspect.code === 0) {
        this.readyLanguages.add(language);
        continue;
      }
      const result = await runProcess("docker", ["pull", IMAGE[language]], 120_000);
      if (result.code !== 0) throw new Error(result.stderr || `Could not pull ${IMAGE[language]}`);
      this.readyLanguages.add(language);
    }
  }

  async run(request: RunRequest): Promise<RunResult> {
    await this.ensureLanguages([request.language]);
    const workDir = await mkdtemp(join(tmpdir(), "grindstone-"));
    const startedAt = performance.now();
    const timeoutMs = request.timeoutMs ?? JUDGE_DEFAULTS.timeoutMs;

    try {
      await writeFile(
        join(/* turbopackIgnore: true */ workDir, FILE[request.language]),
        request.code,
        { mode: 0o444 },
      );
      const args = buildDockerRunArgs(request, workDir);
      const result = await runProcess("docker", args, timeoutMs, request.stdin);
      const compileError = /error:/i.test(result.stderr) && request.language !== "python";
      return {
        outcome: result.timedOut
          ? "timeout"
          : compileError
            ? "compile_error"
            : result.code === 0
              ? "ok"
              : "runtime_error",
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.code,
        signal: result.signal,
        durationMs: Math.round(performance.now() - startedAt),
      };
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  }
}
