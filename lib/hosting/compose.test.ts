import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type ComposeService = {
  build?: { target?: string };
  depends_on?: Record<string, { condition?: string }>;
  environment?: Record<string, string>;
  ports?: string[];
  volumes?: string[];
};

function compose(path: string) {
  return parse(readFileSync(path, "utf8")) as { services: Record<string, ComposeService> };
}

describe("production container topology", () => {
  it("builds the web and worker from their intended Dockerfile stages", () => {
    const services = compose("docker-compose.yml").services;
    expect(services.web.build?.target).toBe("runner");
    expect(services.worker.build?.target).toBe("worker");
  });

  it("publishes only the reverse proxy on the AWS host", () => {
    const services = compose("compose.aws.yml").services;
    expect(services.caddy.ports).toEqual(["80:80"]);
    expect(services.web).toBeUndefined();
  });

  it("keeps Piston limits aligned with the public judge contract", () => {
    const judge = compose("docker-compose.yml").services.judge;
    expect(judge.environment).toMatchObject({
      PISTON_DISABLE_NETWORKING: "true",
      PISTON_MAX_CONCURRENT_JOBS: "4",
      PISTON_RUN_TIMEOUT: "15000",
      PISTON_RUN_MEMORY_LIMIT: "268435456",
    });
  });

  it("initializes Codex volume ownership before web and worker start", () => {
    const services = compose("docker-compose.yml").services;
    expect(services["codex-init"].volumes).toContain("codexhome:/codex-home");
    expect(services.web.depends_on?.["codex-init"]?.condition).toBe("service_completed_successfully");
    expect(services.worker.depends_on?.["codex-init"]?.condition).toBe("service_completed_successfully");
  });
});
