import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type ComposeService = {
  build?: { target?: string };
  ports?: string[];
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
});
