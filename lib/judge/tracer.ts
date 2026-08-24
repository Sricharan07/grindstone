import type { JudgeAdapter } from "./types";

const marker = "__GRINDSTONE_TRACE__";

export interface TraceFrame {
  line: number;
  locals: Record<string, string>;
  stack: string[];
}

export function buildPythonTraceProgram(code: string) {
  return `import json, sys
frames = []
def safe(value):
    try:
        text = repr(value)
        return text[:240]
    except Exception:
        return '<unrepresentable>'
def trace(frame, event, arg):
    if frame.f_code.co_filename == '<learner>' and event == 'line' and len(frames) < 200:
        stack = []
        cursor = frame
        while cursor and cursor.f_code.co_filename == '<learner>':
            stack.append(cursor.f_code.co_name)
            cursor = cursor.f_back
        frames.append({'line': frame.f_lineno, 'locals': {key: safe(value) for key, value in frame.f_locals.items() if not key.startswith('__')}, 'stack': stack})
    return trace
namespace = {}
sys.settrace(trace)
try:
    exec(compile(${JSON.stringify(code)}, '<learner>', 'exec'), namespace, namespace)
finally:
    sys.settrace(None)
print('${marker}' + json.dumps(frames))`;
}

export async function tracePython(judge: JudgeAdapter, code: string) {
  const result = await judge.run({ language: "python", code: buildPythonTraceProgram(code), timeoutMs: 5000, memoryMb: 128 });
  const markerIndex = result.stdout.lastIndexOf(marker);
  if (result.outcome !== "ok" || markerIndex < 0) return { result, frames: [] as TraceFrame[] };
  const frames = JSON.parse(result.stdout.slice(markerIndex + marker.length).trim()) as TraceFrame[];
  return { result: { ...result, stdout: result.stdout.slice(0, markerIndex).trimEnd() }, frames };
}
