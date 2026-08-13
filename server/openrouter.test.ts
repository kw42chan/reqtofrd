import { afterEach, describe, expect, it, vi } from "vitest";
import { getOpenRouterDiagnostics, invokeOpenRouter } from "./openrouter";

const originalFetch = global.fetch;

afterEach(() => { global.fetch = originalFetch; vi.restoreAllMocks(); });

describe("OpenRouter diagnostics", () => {
  it("records redacted lifecycle failures without exposing bearer values", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response("Bearer secret-value is invalid", { status: 401 })) as unknown as typeof fetch;
    await expect(invokeOpenRouter({ operation: "probe", outputMode: "json_object", messages: [{ role: "user", content: "probe" }] })).rejects.toThrow("OpenRouter request failed");
    const latest = getOpenRouterDiagnostics().requestLifecycle.at(-1);
    expect(latest?.event).toBe("request_failed");
    expect(latest?.errorType).toBe("auth");
    expect(latest?.message).not.toContain("secret-value");
  });
});
