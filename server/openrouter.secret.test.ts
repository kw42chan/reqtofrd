import { describe, expect, it } from "vitest";

describe("OpenRouter credential", () => {
  it("authenticates against the lightweight models endpoint", async () => {
    const key = process.env.OPENROUTER_API_KEY;
    expect(key, "OPENROUTER_API_KEY must be configured").toBeTruthy();

    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(10_000),
    });

    expect(response.status, "OpenRouter models request should authenticate").toBe(200);
    const body = await response.json() as { data?: unknown[] };
    expect(Array.isArray(body.data)).toBe(true);
  }, 15_000);
});
