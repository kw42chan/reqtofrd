import { afterEach, describe, expect, it, vi } from "vitest";
import { getOpenRouterDiagnostics, invokeOpenRouter } from "./openrouter";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("OpenRouter diagnostics", () => {
  it("records redacted lifecycle failures without exposing bearer values", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(
        new Response("Bearer secret-value is invalid", { status: 401 })
      ) as unknown as typeof fetch;
    await expect(
      invokeOpenRouter({
        operation: "probe",
        outputMode: "json_object",
        messages: [{ role: "user", content: "probe" }],
      })
    ).rejects.toThrow("OpenRouter request failed");
    const latest = getOpenRouterDiagnostics().requestLifecycle.at(-1);
    expect(latest?.event).toBe("request_failed");
    expect(latest?.errorType).toBe("auth");
    expect(latest?.message).not.toContain("secret-value");
  });

  it("uses a supplied session key only for the current request", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: '{"ok":true}' } }],
          }),
          { status: 200 }
        )
      );
    global.fetch = fetchMock as unknown as typeof fetch;
    await invokeOpenRouter({
      apiKey: "session-only-key-1234567890",
      operation: "probe",
      outputMode: "json_object",
      messages: [{ role: "user", content: "probe" }],
      responseFormat: { type: "json_object" },
    });
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Record<
      string,
      string
    >;
    expect(headers.Authorization).toBe("Bearer session-only-key-1234567890");
    expect(JSON.stringify(getOpenRouterDiagnostics())).not.toContain(
      "session-only-key-1234567890"
    );
  });

  it("uses the configured server key for generation when no session override is supplied", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "configured-project-key-1234567890");
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: { content: "# Functional Requirements\n\n### FR-01" },
              },
            ],
          }),
          { status: 200 }
        )
      );
    global.fetch = fetchMock as unknown as typeof fetch;
    await invokeOpenRouter({
      operation: "generation",
      outputMode: "markdown",
      messages: [{ role: "user", content: "Generate an FRD" }],
    });
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Record<
      string,
      string
    >;
    expect(headers.Authorization).toBe(
      "Bearer configured-project-key-1234567890"
    );
    expect(JSON.stringify(getOpenRouterDiagnostics())).not.toContain(
      "configured-project-key-1234567890"
    );
  });

  it("retries a transient timeout once and returns the recovered model response", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(
        new DOMException(
          "The operation was aborted due to timeout",
          "TimeoutError"
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ choices: [{ message: { content: "# FRD" } }] }),
          { status: 200 }
        )
      );
    global.fetch = fetchMock as unknown as typeof fetch;
    await expect(
      invokeOpenRouter({
        operation: "generation",
        outputMode: "markdown",
        messages: [{ role: "user", content: "generate" }],
        retryDelayMs: 0,
      })
    ).resolves.toMatchObject({ content: "# FRD" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const firstBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    const secondBody = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    expect(firstBody).toMatchObject({
      max_tokens: 1800,
      provider: { sort: "throughput" },
    });
    expect(secondBody).toMatchObject({
      max_tokens: 1200,
      provider: { sort: "throughput" },
    });
    expect(secondBody.messages[0].content).toContain("concise mode");
  });

  it("reports a clear recovery error after both bounded timeout attempts fail", async () => {
    global.fetch = vi
      .fn()
      .mockRejectedValue(
        new DOMException(
          "The operation was aborted due to timeout",
          "TimeoutError"
        )
      ) as unknown as typeof fetch;
    await expect(
      invokeOpenRouter({
        operation: "generation",
        outputMode: "markdown",
        messages: [{ role: "user", content: "generate" }],
        retryDelayMs: 0,
      })
    ).rejects.toThrow("standard and concise retry");
    expect(getOpenRouterDiagnostics().requestLifecycle.at(-1)).toMatchObject({
      errorType: "timeout",
      attempt: 2,
      maxTokens: 1200,
      providerSort: "throughput",
    });
  });
});
