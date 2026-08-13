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
  errorType?: "auth" | "rate_limit" | "schema" | "empty_response" | "invalid_json" | "network" | "unknown";
  message?: string;
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

export async function invokeOpenRouter(input: { apiKey?: string; model?: string; operation: Operation; outputMode: OutputMode; messages: Array<{ role: "system" | "user"; content: string }>; responseFormat?: Record<string, unknown>; maxTokens?: number }) {
  const key = input.apiKey || process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not configured.");
  const model = input.model || DEFAULT_OPENROUTER_MODEL;
  const requestId = crypto.randomUUID();
  const runId = crypto.randomUUID();
  const started = Date.now();
  record({ timestamp: started, requestId, runId, model, operation: input.operation, outputMode: input.outputMode, event: "request_started" });
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "HTTP-Referer": "https://reqtofrd.manus.space", "X-Title": "ReqToFRD" },
      body: JSON.stringify({ model, messages: input.messages, reasoning: { effort: "none" }, max_tokens: input.maxTokens ?? (input.operation === "generation" ? 6_000 : 1_500), ...(input.responseFormat ? { response_format: input.responseFormat } : {}) }),
      signal: AbortSignal.timeout(75_000),
    });
    const text = await response.text();
    if (!response.ok) {
      const message = compactMessage(text);
      record({ timestamp: Date.now(), requestId, runId, model, operation: input.operation, outputMode: input.outputMode, event: "request_failed", status: response.status, elapsedMs: Date.now() - started, errorType: classify(response.status, message), message });
      throw new Error(`OpenRouter request failed (${response.status}): ${message}`);
    }
    const parsed = JSON.parse(text) as { choices?: Array<{ message?: { content?: string } }> };
    const content = parsed.choices?.[0]?.message?.content ?? "";
    record({ timestamp: Date.now(), requestId, runId, model, operation: input.operation, outputMode: input.outputMode, event: "response_received", status: response.status, elapsedMs: Date.now() - started, responseKeys: Object.keys(parsed) });
    if (!content.trim()) {
      record({ timestamp: Date.now(), requestId, runId, model, operation: input.operation, outputMode: input.outputMode, event: "request_failed", elapsedMs: Date.now() - started, errorType: "empty_response", message: "Provider returned no usable message content." });
      throw new Error("OpenRouter returned empty content.");
    }
    return { content, model, requestId, runId, elapsedMs: Date.now() - started };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("OpenRouter request failed")) throw error;
    record({ timestamp: Date.now(), requestId, runId, model, operation: input.operation, outputMode: input.outputMode, event: "request_failed", elapsedMs: Date.now() - started, errorType: "network", message: compactMessage(error) });
    throw error;
  }
}

export function markOpenRouterMapped(result: { requestId: string; runId: string; model: string; elapsedMs: number }, operation: Operation, outputMode: OutputMode, options: { responseKeys?: string[]; storyCount?: number } = {}) {
  record({ timestamp: Date.now(), requestId: result.requestId, runId: result.runId, model: result.model, operation, outputMode, event: "response_mapped", elapsedMs: result.elapsedMs, responseKeys: options.responseKeys, storyCount: options.storyCount });
}
