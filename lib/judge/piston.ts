import {
  JUDGE_DEFAULTS,
  LANGUAGES,
  LANGUAGE_LABEL,
  truncateOutput,
  type JudgeAdapter,
  type JudgeHealth,
  type Language,
  type RunRequest,
  type RunResult,
} from "./types";

const PISTON_LANGUAGE: Record<Language, string> = {
  python: "python",
  java: "java",
  cpp: "c++",
};

const PISTON_FILENAME: Record<Language, string> = {
  python: "solution.py",
  java: "Main.java",
  cpp: "solution.cpp",
};

interface PistonRuntime {
  language: string;
  version: string;
  aliases: string[];
}

interface PistonExecuteResponse {
  language: string;
  version: string;
  run: { stdout: string; stderr: string; code: number | null; signal: string | null; status?: string | null };
  compile?: { stdout: string; stderr: string; code: number | null; signal: string | null; status?: string | null };
}

export class PistonAdapter implements JudgeAdapter {
  readonly name = "piston";

  constructor(private readonly baseUrl = process.env.PISTON_URL ?? "http://localhost:2000") {}

  private async runtimes() {
    const response = await fetch(`${this.baseUrl}/api/v2/runtimes`, {
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Piston health returned ${response.status}`);
    return (await response.json()) as PistonRuntime[];
  }

  async health(): Promise<JudgeHealth> {
    try {
      const runtimes = await this.runtimes();
      const languages = (Object.keys(PISTON_LANGUAGE) as Language[]).filter(
        (language) => runtimes.some((runtime) => runtime.language === PISTON_LANGUAGE[language]),
      );
      return {
        ok: languages.length === LANGUAGES.length,
        adapter: this.name,
        detail:
          languages.length === LANGUAGES.length
            ? `Python, Java, and C++ ready (${runtimes.length} runtimes installed)`
            : `Missing ${LANGUAGES.filter((language) => !languages.includes(language)).map((language) => LANGUAGE_LABEL[language]).join(", ")}`,
        languages,
      };
    } catch (error) {
      return {
        ok: false,
        adapter: this.name,
        detail: error instanceof Error ? error.message : "Piston is unreachable",
        languages: [],
      };
    }
  }

  async ensureLanguages(languages: readonly Language[]): Promise<void> {
    const runtimes = await this.runtimes();
    const missing = languages.filter(
      (language) => !runtimes.some((runtime) => runtime.language === PISTON_LANGUAGE[language]),
    );
    if (missing.length > 0) {
      throw new Error(
        `Piston is missing ${missing.map((language) => LANGUAGE_LABEL[language]).join(", ")}. Install them through Piston before accepting traffic.`,
      );
    }
  }

  async run(request: RunRequest): Promise<RunResult> {
    const startedAt = performance.now();
    const timeoutMs = request.timeoutMs ?? JUDGE_DEFAULTS.timeoutMs;
    const response = await fetch(`${this.baseUrl}/api/v2/execute`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        language: PISTON_LANGUAGE[request.language],
        version: "*",
        files: [{ name: PISTON_FILENAME[request.language], content: request.code }],
        stdin: request.stdin ?? "",
        run_timeout: timeoutMs,
        compile_timeout: timeoutMs,
        run_memory_limit: (request.memoryMb ?? JUDGE_DEFAULTS.memoryMb) * 1024 * 1024,
      }),
      signal: AbortSignal.timeout(timeoutMs + 2500),
    });

    if (!response.ok) {
      const detail = await response.text();
      let message = detail;
      try {
        message = (JSON.parse(detail) as { message?: string }).message ?? detail;
      } catch {
        // Keep the plain-text response.
      }
      throw new Error(`Piston execution returned ${response.status}${message ? `: ${message.slice(0, 300)}` : ""}`);
    }

    const payload = (await response.json()) as PistonExecuteResponse;
    const compileFailed = payload.compile && payload.compile.code !== 0;
    const timedOut = payload.run.status === "TO" || payload.compile?.status === "TO";
    const outcome = compileFailed
      ? "compile_error"
      : timedOut
        ? "timeout"
        : payload.run.code === 0
          ? "ok"
          : "runtime_error";

    return {
      outcome,
      stdout: truncateOutput(payload.run.stdout),
      stderr: truncateOutput(payload.run.stderr),
      exitCode: payload.run.code,
      signal: payload.run.signal,
      durationMs: Math.round(performance.now() - startedAt),
      compileOutput: payload.compile
        ? truncateOutput(`${payload.compile.stdout}${payload.compile.stderr}`)
        : undefined,
    };
  }
}
