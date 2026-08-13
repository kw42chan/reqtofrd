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

  it("uses a supplied session key only for the current request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: "{\"ok\":true}" } }] }), { status: 200 }));
    global.fetch = fetchMock as unknown as typeof fetch;
    await invokeOpenRouter({ apiKey: "session-only-key-1234567890", operation: "probe", outputMode: "json_object", messages: [{ role: "user", content: "probe" }], responseFormat: { type: "json_object" } });
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer session-only-key-1234567890");
    expect(JSON.stringify(getOpenRouterDiagnostics())).not.toContain("session-only-key-1234567890");
  });
});
