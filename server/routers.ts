import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  DEFAULT_OPENROUTER_MODEL,
  getOpenRouterDiagnostics,
  invokeOpenRouter,
  markOpenRouterMapped,
  OPENROUTER_CANDIDATE_MODELS,
  VERIFIED_OPENROUTER_MODELS,
} from "./openrouter";
import {
  ENTERPRISE_AUDIT_FRD_TEMPLATE,
  REQUIRED_QUESTION_CATEGORIES,
} from "../lib/req-to-frd/templates/enterprise-audit-frd";

const roleType = z.enum(["Reviewer", "Approver", "Informer"]);
const distributionDepartment = z.enum([
  "Requestor of Business",
  "Department Head",
  "IT Department",
]);
const questionCategory = z.enum(REQUIRED_QUESTION_CATEGORIES);
const metadataSchema = z.object({
  requestId: z.string().default("REQ-0001"),
  region: z.string().default("Global"),
  system: z.string().default("Target System"),
  enhancementTitle: z.string().default("Requirement Enhancement"),
  distributionList: z
    .array(
      z.object({
        id: z.string(),
        department: distributionDepartment,
        name: z.string(),
        title: z.string(),
        roleType,
      })
    )
    .min(3)
    .default([
      {
        id: "dist-requestor",
        department: "Requestor of Business",
        name: "",
        title: "Requestor of Business",
        roleType: "Reviewer",
      },
      {
        id: "dist-department-head",
        department: "Department Head",
        name: "",
        title: "Department Head of Requestor of Business",
        roleType: "Approver",
      },
      {
        id: "dist-it",
        department: "IT Department",
        name: "",
        title: "IT Department",
        roleType: "Informer",
      },
    ]),
  revisionVersion: z.string().default("1.0"),
  revisionDescription: z.string().default("Initial draft"),
  updatedBy: z.string().default("ReqToFRD Analyst"),
  revisionDate: z.string().default("13-AUG-26"),
  revisionRemarks: z
    .string()
    .default("Generated from approved requirement input"),
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
  questions: z
    .array(
      z.object({
        id: z.string().regex(/^q[1-5]$/),
        category: questionCategory,
        question: z.string().min(1),
      })
    )
    .min(3)
    .max(5),
});

const rawClarificationSchema = z.object({
  phase: z.literal("CLARIFICATION"),
  gap_summary: z.string().min(1),
  questions: z.array(
    z.object({
      id: z.string().optional(),
      category: z.string(),
      question: z.string(),
    })
  ),
});

function normalizeQuestions(value: unknown) {
  if (!Array.isArray(value)) return value;
  return value.slice(0, 5).map((item, index) => {
    const question = item as Record<string, unknown>;
    return { ...question, id: `q${index + 1}` };
  });
}

function normalizeClarification(value: unknown) {
  const raw = rawClarificationSchema.parse(value);
  return clarificationSchema.parse({
    ...raw,
    questions: normalizeQuestions(raw.questions),
  });
}

const generationQuestionsSchema = z.preprocess(
  normalizeQuestions,
  z
    .array(
      z.object({
        id: z.string().regex(/^q[1-5]$/),
        category: questionCategory,
        question: z.string().min(1),
      })
    )
    .min(3)
    .max(5)
);

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
    models: publicProcedure.query(() => ({
      apiKeyConfigured: Boolean(process.env.OPENROUTER_API_KEY),
      defaultModel: DEFAULT_OPENROUTER_MODEL,
      verified: VERIFIED_OPENROUTER_MODELS,
      candidates: OPENROUTER_CANDIDATE_MODELS,
    })),
    diagnostics: publicProcedure.query(() => getOpenRouterDiagnostics()),
    probe: publicProcedure
      .input(
        z.object({
          model: z.string().min(3),
          openRouterApiKey: z.string().min(20).max(500).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const result = await invokeOpenRouter({
          apiKey: input.openRouterApiKey,
          model: input.model,
          operation: "probe",
          outputMode: "json_object",
          messages: [
            {
              role: "user",
              content: 'Return exactly this JSON object: {"ok":true}',
            },
          ],
          responseFormat: { type: "json_object" },
        });
        const parsed = JSON.parse(result.content) as { ok?: boolean };
        if (parsed.ok !== true)
          throw new Error(
            "OpenRouter probe did not map to the expected response contract."
          );
        markOpenRouterMapped(result, "probe", "json_object", {
          responseKeys: Object.keys(parsed),
        });
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
          {
            role: "system",
            content:
              "You are an enterprise systems analyst. Return only valid JSON matching the requested contract.",
          },
          { role: "user", content: prompt },
        ],
        responseFormat: { type: "json_object" },
      });
      const parsed = normalizeClarification(JSON.parse(response.content));
      markOpenRouterMapped(response, "clarification", "json_object", {
        responseKeys: Object.keys(parsed),
        storyCount: parsed.questions.length,
      });
      return parsed;
    }),
    generate: publicProcedure
      .input(
        commonInput.extend({
          questions: generationQuestionsSchema,
          answers: z.record(z.string(), z.string()),
          categoryExtras: z.record(z.string(), z.string()).optional(),
          generationScope: z
            .enum(["document", "requirement-item"])
            .default("document"),
          itemNumber: z.number().int().min(1).default(1),
        })
      )
      .mutation(async ({ input }) => {
        const generationInstruction =
          input.generationScope === "requirement-item"
            ? `This is Functional Requirement Item ${input.itemNumber}, appended to an existing FRD session. Generate ONLY the Functional Requirement section for this new item — the FR-${String(input.itemNumber).padStart(2, "0")} identifier block and its subsections (Input Parameters, Processing Logic, Output/Response, Exception Handling). Do NOT emit a Cover Page, Executive Summary, Revision History, Integration section, Out of Scope section, Distribution & Sign-off Table, document title, or any other document-level section. Start directly with the FR identifier heading and continue numbering from FR-${String(input.itemNumber).padStart(2, "0")}.`
            : "Generate the complete FRD body in Markdown. The application renders the authoritative Cover Page and Distribution & Sign-off Table from controlled metadata, so do not emit either document-control section in your Markdown. Include the remaining mandatory body sections, strict tables where needed, DD-MMM-YY dates, and FR-01 style identifiers.";
        const categoryExtras = input.categoryExtras ?? {};
        const seen = new Set<string>();
        const categories = input.questions
          .map(q => q.category)
          .filter(c => (seen.has(c) ? false : (seen.add(c), true)));
        const categorySections = categories
          .map(category => {
            const qs = input.questions.filter(q => q.category === category);
            const extra = (categoryExtras[category] ?? "").trim();
            const qLines = qs
              .map(q => {
                const answer = (input.answers[q.id] ?? "").trim();
                return answer
                  ? `${q.id} ${q.question}\nAnswer: ${answer}`
                  : null;
              })
              .filter(Boolean);
            if (qLines.length === 0 && !extra) return null;
            const parts = [`[${category}]`, ...qLines];
            if (extra) parts.push(`Additional information: ${extra}`);
            return parts.join("\n");
          })
          .filter(Boolean)
          .join("\n\n");
        const clarificationBlock =
          categorySections ||
          "No clarification answers provided — generate based on the high-level requirement alone.";
        const prompt = `${ENTERPRISE_AUDIT_FRD_TEMPLATE}\n\nGENERATION INPUT\nHigh-Level Requirement:\n${input.requirement}\n\nDocument title: ${input.documentTitle}\nMetadata:\n${JSON.stringify({ ...input.metadata, revisionDate: strictDate(input.metadata.revisionDate) }, null, 2)}\n\nFormatting profile: ${input.formattingProfile}\nCustom guidelines: ${input.customGuidelines || "None"}\n\nClarifying Questions and Answers:\n${clarificationBlock}\n\n${generationInstruction}\nDo not add a preamble.`;
        const response = await invokeOpenRouter({
          apiKey: input.openRouterApiKey,
          model: input.model,
          operation: "generation",
          outputMode: "markdown",
          messages: [
            {
              role: "system",
              content:
                "You are an audit-compliant enterprise FRD generator. Produce precise technical Markdown with no filler.",
            },
            { role: "user", content: prompt },
          ],
        });
        const markdown = response.content
          .replace(/^```(?:markdown)?\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();
        if (!markdown)
          throw new Error("The FRD generator returned empty content.");
        markOpenRouterMapped(response, "generation", "markdown", {
          responseKeys: ["markdown"],
        });
        return { markdown };
      }),
  }),
});

export type AppRouter = typeof appRouter;
