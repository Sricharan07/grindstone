const unavailablePattern =
  /fetch failed|econnrefused|econnreset|socket hang up|cannot connect|connection refused|docker daemon|docker is unavailable|spawn docker enoent/i;

export function publicJudgeError(error: unknown, fallback = "Code execution failed") {
  if (!(error instanceof Error) || !error.message.trim()) return fallback;
  if (unavailablePattern.test(error.message)) {
    return "Code execution is temporarily unavailable. Please retry in a moment.";
  }
  return error.message;
}
