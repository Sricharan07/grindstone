import { afterEach, describe, expect, it, vi } from "vitest";
import { PistonAdapter } from "./piston";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Piston adapter", () => {
  it("reports healthy only when every product language is installed", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify([
      { language: "python", version: "3.12.0", aliases: [] },
      { language: "java", version: "21.0.0", aliases: [] },
    ]), { status: 200 })));

    const health = await new PistonAdapter("http://judge").health();

    expect(health.ok).toBe(false);
    expect(health.languages).toEqual(["python", "java"]);
    expect(health.detail).toContain("C++");
  });

  it("uses compiler-friendly filenames and Piston's timeout status", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      language: "java",
      version: "21.0.0",
      run: { stdout: "", stderr: "", code: null, signal: "SIGKILL", status: "TO" },
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await new PistonAdapter("http://judge").run({
      language: "java",
      code: "public class Main {}",
      timeoutMs: 500,
    });

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(request.body)).files[0].name).toBe("Main.java");
    expect(result.outcome).toBe("timeout");
  });

  it("preserves Piston's bounded validation detail in infrastructure errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ message: "run_timeout cannot exceed the configured limit" }),
      { status: 400 },
    )));

    await expect(new PistonAdapter("http://judge").run({ language: "python", code: "print(1)" }))
      .rejects.toThrow("400: run_timeout cannot exceed the configured limit");
  });
});
