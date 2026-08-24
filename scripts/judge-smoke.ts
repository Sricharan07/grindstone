import "dotenv/config";
import { getJudge, type RunRequest } from "@/lib/judge";

const cases: Array<{ name: string; request: RunRequest }> = [
  { name: "infinite loop", request: { language: "python", code: "while True:\n    pass", timeoutMs: 900 } },
  { name: "memory ceiling", request: { language: "python", code: "x = bytearray(1024 * 1024 * 1024)\nprint(len(x))", memoryMb: 128, timeoutMs: 4000 } },
  { name: "outbound network", request: { language: "python", code: "import urllib.request\nprint(urllib.request.urlopen('https://example.com', timeout=2).status)", timeoutMs: 4000 } },
  { name: "process ceiling", request: { language: "python", code: "import os\nwhile True:\n    os.fork()", timeoutMs: 4000 } },
];

async function main() {
const judge = getJudge();
const health = await judge.health();
if (!health.ok) throw new Error(`Judge is not healthy: ${health.detail}`);
await judge.ensureLanguages(["python"]);

for (const smokeCase of cases) {
  const result = await judge.run(smokeCase.request);
  if (result.outcome === "ok") {
    throw new Error(`${smokeCase.name} escaped containment and returned ok`);
  }
  console.info(`${smokeCase.name}: ${result.outcome} (${result.durationMs} ms)`);
}

console.info(`Judge smoke test passed with ${judge.name}.`);
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
