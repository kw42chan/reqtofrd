import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { DEFAULT_OPENROUTER_MODEL, getOpenRouterDiagnostics, invokeOpenRouter, markOpenRouterMapped, OPENROUTER_CANDIDATE_MODELS, VERIFIED_OPENROUTER_MODELS } from "./openrouter";
import {
  ENTERPRISE_AUDIT_FRD_TEMPLATE,
  REQUIRED_QUESTION_CATEGORIES,
} from "../lib/req-to-frd/templates/enterprise-audit-frd";

const roleType = z.enum(["Reviewer", "Approver", "Informer"]);
const distributionDepartment = z.enum(["Requestor of Business", "Department Head", "IT Department"]);
const questionCategory = z.enum(REQUIRED_QUESTION_CATEGORIES);
const metadataSchema = z.object({
  requestId: z.string().default("REQ-0001"),
  region: z.string().default("Global"),
  system: z.string().default("Target System"),
  enhancementTitle: z.string().default("Requirement Enhancement"),
  distributionList: z.array(z.object({
    id: z.string(),
    department: distributionDepartment,
    name: z.string(),
    title: z.string(),
    roleType,
  })).min(3).default([
    { id: "dist-requestor", department: "Requestor of Business", name: "", title: "Requestor of Business", roleType: "Reviewer" },
    { id: "dist-department-head", department: "Department Head", name: "", title: "Department Head of Requestor of Business", roleType: "Approver" },
    { id: "dist-it", department: "IT Department", name: "", title: "IT Department", roleType: "Informer" },
  ]),
  revisionVersion: z.string().default("1.0"),
  revisionDescription: z.string().default("Initial draft"),
  updatedBy: z.string().default("ReqToFRD Analyst"),
  revisionDate: z.string().default("13-AUG-26"),
  revisionRemarks: z.string().default("Generated from approved requirement input"),
});

const commonInput = z.object({
  requirement: z.string().min(20),
  templateId: z.string().default("enterprise-audit-frd"),
  formattingProfile: z.string().default("Banking/Treasury Standard"),
  customGuidelines: z.string().default(""),
  documentTitle: z.string().default("Untitled FRD"),
  model: z.string().min(3).default(DEFAULT_OPENROUTER_MODEL),
  openRouterApiKey: z.string().min(20).max(500).optional(),
  metadata: metadataSchema,
});

const clarificationSchema = z.object({
  phase: z.literal("CLARIFICATION"),
  gap_summary: z.string().min(1),
  questions: z.array(z.object({
    id: z.string().regex(/^q[1-5]$/),
    category: questionCategory,
    question: z.string().min(1),
  })).min(3).max(5),
});

function strictDate(value: string) {
  return /^\d{2}-[A-Z]{3}-\d{2}$/.test(value) ? value : "13-AUG-26";
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  reqToFrd: router({
    models: publicProcedure.query(() => ({ apiKeyConfigured: Boolean(process.env.OPENROUTER_API_KEY), defaultModel: DEFAULT_OPENROUTER_MODEL, verified: VERIFIED_OPENROUTER_MODELS, candidates: OPENROUTER_CANDIDATE_MODELS })),
    diagnostics: publicProcedure.query(() => getOpenRouterDiagnostics()),
    probe: publicProcedure.input(z.object({ model: z.string().min(3), openRouterApiKey: z.string().min(20).max(500).optional() })).mutation(async ({ input }) => {
      const result = await invokeOpenRouter({ apiKey: input.openRouterApiKey, model: input.model, operation: "probe", outputMode: "json_object", messages: [{ role: "user", content: "Return exactly this JSON object: {\"ok\":true}" }], responseFormat: { type: "json_object" } });
      const parsed = JSON.parse(result.content) as { ok?: boolean };
      if (parsed.ok !== true) throw new Error("OpenRouter probe did not map to the expected response contract.");
      markOpenRouterMapped(result, "probe", "json_object", { responseKeys: Object.keys(parsed) });
      return { ok: true, model: result.model, elapsedMs: result.elapsedMs };
    }),
    analyze: publicProcedure.input(commonInput).mutation(async ({ input }) => {
      const prompt = `${ENTERPRISE_AUDIT_FRD_TEMPLATE}\n\nANALYSIS INPUT\nRequirement:\n${input.requirement}\n\nMetadata:\n${JSON.stringify({ ...input.metadata, revisionDate: strictDate(input.metadata.revisionDate) })}\n\nFormatting profile: ${input.formattingProfile}\nCustom guidelines: ${input.customGuidelines || "None"}\n\nReturn only the strict CLARIFICATION JSON object. Do not generate the FRD.`;
      const response = await invokeOpenRouter({
        apiKey: input.openRouterApiKey,
        model: input.model,
        operation: "clarification",
        outputMode: "json_object",
        messages: [
          { role: "system", content: "You are an enterprise systems analyst. Return only valid JSON matching the requested contract." },
          { role: "user", content: prompt },
        ],
        responseFormat: { type: "json_object" },
      });
      const parsed = clarificationSchema.parse(JSON.parse(response.content));
      markOpenRouterMapped(response, "clarification", "json_object", { responseKeys: Object.keys(parsed), storyCount: parsed.questions.length });
      return parsed;
    }),
    generate: publicProcedure.input(commonInput.extend({
      questions: z.array(z.object({ id: z.string(), category: questionCategory, question: z.string() })).min(3).max(5),
      answers: z.record(z.string(), z.string()),
    })).mutation(async ({ input }) => {
      const prompt = `${ENTERPRISE_AUDIT_FRD_TEMPLATE}\n\nGENERATION INPUT\nHigh-Level Requirement:\n${input.requirement}\n\nDocument title: ${input.documentTitle}\nMetadata:\n${JSON.stringify({ ...input.metadata, revisionDate: strictDate(input.metadata.revisionDate) }, null, 2)}\n\nFormatting profile: ${input.formattingProfile}\nCustom guidelines: ${input.customGuidelines || "None"}\n\nClarifying Questions and Answers:\n${input.questions.map(q => `${q.id} [${q.category}] ${q.question}\nAnswer: ${input.answers[q.id] || "No answer provided"}`).join("\n\n")}\n\nGenerate only the complete FRD in Markdown. Use the mandatory six sections, strict tables, exact role labels, DD-MMM-YY dates, and FR-01 style identifiers. Do not add a preamble.`;
      const response = await invokeOpenRouter({
        apiKey: input.openRouterApiKey,
        model: input.model,
        operation: "generation",
        outputMode: "markdown",
        messages: [
          { role: "system", content: "You are an audit-compliant enterprise FRD generator. Produce precise technical Markdown with no filler." },
          { role: "user", content: prompt },
        ],
      });
      const markdown = response.content.replace(/^```(?:markdown)?\s*/i, "").replace(/\s*```$/i, "").trim();
      if (!markdown) throw new Error("The FRD generator returned empty content.");
      markOpenRouterMapped(response, "generation", "markdown", { responseKeys: ["markdown"] });
      return { markdown };
    }),
  }),
});

export type AppRouter = typeof appRouter;
