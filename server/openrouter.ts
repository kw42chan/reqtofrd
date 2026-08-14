type Operation = "probe" | "clarification" | "generation";
type OutputMode = "json_schema" | "json_object" | "markdown";

export type OpenRouterDiagnostic = {
  timestamp: number;
  requestId: string;
  runId: string;
  model: string;
  operation: Operation;
  outputMode: OutputMode;
  event: "request_started" | "response_received" | "response_mapped" | "request_failed";
  status?: number;
  elapsedMs?: number;
  responseKeys?: string[];
  storyCount?: number;
  errorType?: "auth" | "rate_limit" | "schema" | "empty_response" | "invalid_json" | "network" | "timeout" | "unknown";
  message?: string;
  timeoutMs?: number;
  maxTokens?: number;
  attempt?: number;
  providerSort?: "throughput";
};

export const VERIFIED_OPENROUTER_MODELS = ["deepseek/deepseek-v4-pro-0813"] as const;
export const OPENROUTER_CANDIDATE_MODELS: readonly string[] = ["openai/gpt-4o-mini", "nvidia/nemotron-3.5-lightning:free", "liquid/lfm-2.5-2.6b:free"];
export const DEFAULT_OPENROUTER_MODEL = VERIFIED_OPENROUTER_MODELS[0];
const RETENTION = 120;
const lifecycle: OpenRouterDiagnostic[] = [];

function compactMessage(message: unknown) { return String(message ?? "Unknown failure").replace(/Bearer\s+\S+/gi, "Bearer [redacted]").slice(0, 180); }
function record(entry: OpenRouterDiagnostic) { lifecycle.push(entry); if (lifecycle.length > RETENTION) lifecycle.splice(0, lifecycle.length - RETENTION); }
function classify(status: number, message: string): OpenRouterDiagnostic["errorType"] {
  if (status === 401 || status === 403) return "auth";
  if (status === 429) return "rate_limit";
  if (status === 400 && /schema|response.?format/i.test(message)) return "schema";
  return "unknown";
}

export function getOpenRouterDiagnostics() { return { version: 1, retention: RETENTION, requestLifecycle: [...lifecycle], modelHistory: Object.values(lifecycle.reduce<Record<string, OpenRouterDiagnostic[]>>((history, entry) => { (history[entry.model] ??= []).push(entry); return history; }, {})) }; }

export async function invokeOpenRouter(input: { apiKey?: string; model?: string; operation: Operation; outputMode: OutputMode; messages: Array<{ role: "system" | "user"; content: string }>; responseFormat?: Record<string, unknown>; maxTokens?: number; retryDelayMs?: number }) {
  const key = input.apiKey || process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not configured.");
  const model = input.model || DEFAULT_OPENROUTER_MODEL;
  const requestId = crypto.randomUUID();
  const runId = crypto.randomUUID();
  const started = Date.now();
  const timeoutMs = input.operation === "generation" ? 38_000 : 30_000;
  const baseMaxTokens = input.maxTokens ?? (input.operation === "generation" ? 1_800 : 1_200);
  record({ timestamp: started, requestId, runId, model, operation: input.operation, outputMode: input.outputMode, event: "request_started", timeoutMs, maxTokens: baseMaxTokens, attempt: 1, ...(input.operation === "generation" ? { providerSort: "throughput" } : {}) });
  const attempts = 2;
  const retryDelayMs = input.retryDelayMs ?? 500;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const compactRetry = input.operation === "generation" && attempt === 2;
    const maxTokens = compactRetry ? Math.min(baseMaxTokens, 1_200) : baseMaxTokens;
    const messages = compactRetry
      ? [{ role: "system" as const, content: "Retry in concise mode. Preserve all mandatory FRD decisions and identifiers, but use compact tables and short bullet points so the response completes quickly. Do not add a preamble." }, ...input.messages]
      : input.messages;
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "HTTP-Referer": "https://reqtofrd.manus.space", "X-Title": "ReqToFRD" },
        body: JSON.stringify({ model, messages, reasoning: { effort: "none" }, max_tokens: maxTokens, ...(input.operation === "generation" ? { provider: { sort: "throughput" } } : {}), ...(input.responseFormat ? { response_format: input.responseFormat } : {}) }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      const text = await response.text();
      if (!response.ok) {
        const message = compactMessage(text);
        const retryable = response.status === 408 || response.status === 429 || response.status >= 500;
        record({ timestamp: Date.now(), requestId, runId, model, operation: input.operation, outputMode: input.outputMode, event: "request_failed", status: response.status, elapsedMs: Date.now() - started, errorType: classify(response.status, message), message, timeoutMs, maxTokens, attempt, ...(input.operation === "generation" ? { providerSort: "throughput" } : {}) });
        if (retryable && attempt < attempts) { await new Promise(resolve => setTimeout(resolve, retryDelayMs)); continue; }
        throw new Error(`OpenRouter request failed (${response.status}): ${message}`);
      }
      const parsed = JSON.parse(text) as { choices?: Array<{ message?: { content?: string } }> };
      const content = parsed.choices?.[0]?.message?.content ?? "";
      record({ timestamp: Date.now(), requestId, runId, model, operation: input.operation, outputMode: input.outputMode, event: "response_received", status: response.status, elapsedMs: Date.now() - started, responseKeys: Object.keys(parsed), timeoutMs, maxTokens, attempt, ...(input.operation === "generation" ? { providerSort: "throughput" } : {}) });
      if (!content.trim()) throw new Error("OpenRouter returned empty content.");
      return { content, model, requestId, runId, elapsedMs: Date.now() - started };
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("OpenRouter request failed")) throw error;
      const message = compactMessage(error);
      const timedOut = error instanceof Error && (error.name === "TimeoutError" || /aborted due to timeout|timeout/i.test(error.message));
      const retryable = timedOut || (error instanceof TypeError && /fetch|network/i.test(error.message));
      record({ timestamp: Date.now(), requestId, runId, model, operation: input.operation, outputMode: input.outputMode, event: "request_failed", elapsedMs: Date.now() - started, errorType: timedOut ? "timeout" : "network", message, timeoutMs, maxTokens, attempt, ...(input.operation === "generation" ? { providerSort: "throughput" } : {}) });
      if (retryable && attempt < attempts) { await new Promise(resolve => setTimeout(resolve, retryDelayMs)); continue; }
      if (timedOut) throw new Error("OpenRouter generation timed out after a standard and concise retry. Your clarification answers are preserved; retry generation or choose a faster model.");
      throw error;
    }
  }
  throw new Error("OpenRouter request did not complete.");
}

export function markOpenRouterMapped(result: { requestId: string; runId: string; model: string; elapsedMs: number }, operation: Operation, outputMode: OutputMode, options: { responseKeys?: string[]; storyCount?: number } = {}) {
  record({ timestamp: Date.now(), requestId: result.requestId, runId: result.runId, model: result.model, operation, outputMode, event: "response_mapped", elapsedMs: result.elapsedMs, responseKeys: options.responseKeys, storyCount: options.storyCount });
}
