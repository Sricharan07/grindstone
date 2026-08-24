/**
 * The judge is the single most load-bearing component in Grindstone: it runs
 * learner code, verifies AI-generated answers, measures complexity, and produces
 * execution traces. Everything else assumes it is both correct and contained.
 *
 * Two implementations exist because Piston needs `privileged: true` to let
 * isolate manage cgroups, and that is the one thing we cannot verify from a Mac.
 * `docker-run` is the fallback if WSL2 refuses. See docs/WINDOWS_HOSTING.md.
 */

export const LANGUAGES = ['python', 'java', 'cpp'] as const;
export type Language = (typeof LANGUAGES)[number];

export function isLanguage(value: string): value is Language {
  return (LANGUAGES as readonly string[]).includes(value);
}

/** Display names, used in the UI and in generated content. */
export const LANGUAGE_LABEL: Record<Language, string> = {
  python: 'Python',
  java: 'Java',
  cpp: 'C++',
};

export type RunOutcome =
  | 'ok'
  | 'compile_error'
  | 'runtime_error'
  | 'timeout'
  | 'memory_exceeded'
  | 'internal_error';

export interface RunRequest {
  language: Language;
  code: string;
  stdin?: string;
  /** Wall-clock ceiling. The sandbox kills the process past this. */
  timeoutMs?: number;
  memoryMb?: number;
}

export interface RunResult {
  outcome: RunOutcome;
  stdout: string;
  stderr: string;
  /** null when the process was killed by a signal rather than exiting. */
  exitCode: number | null;
  signal: string | null;
  /** Wall-clock duration of the run phase, used for complexity inference. */
  durationMs: number;
  compileOutput?: string;
}

export interface JudgeHealth {
  ok: boolean;
  adapter: string;
  detail: string;
  languages: Language[];
}

export interface JudgeAdapter {
  readonly name: string;
  health(): Promise<JudgeHealth>;
  /** Idempotent. Installs/pulls whatever the adapter needs for these languages. */
  ensureLanguages(languages: readonly Language[]): Promise<void>;
  run(request: RunRequest): Promise<RunResult>;
}

export const JUDGE_DEFAULTS = {
  timeoutMs: Number(process.env.JUDGE_TIMEOUT_MS ?? 8000),
  memoryMb: Number(process.env.JUDGE_MEMORY_MB ?? 256),
  pidsLimit: Number(process.env.JUDGE_PIDS_LIMIT ?? 64),
} as const;

/** Truncated so a runaway print loop cannot blow up a response or a DB row. */
export const MAX_OUTPUT_BYTES = 64 * 1024;

export function truncateOutput(value: string): string {
  if (value.length <= MAX_OUTPUT_BYTES) return value;
  return `${value.slice(0, MAX_OUTPUT_BYTES)}\n…output truncated at ${MAX_OUTPUT_BYTES} bytes…`;
}
