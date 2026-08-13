import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
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

function extractText(response: Awaited<ReturnType<typeof invokeLLM>>) {
  const content = response.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map(part => "text" in part ? part.text : "").join("");
  return "";
}

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
    analyze: publicProcedure.input(commonInput).mutation(async ({ input }) => {
      const prompt = `${ENTERPRISE_AUDIT_FRD_TEMPLATE}\n\nANALYSIS INPUT\nRequirement:\n${input.requirement}\n\nMetadata:\n${JSON.stringify({ ...input.metadata, revisionDate: strictDate(input.metadata.revisionDate) })}\n\nFormatting profile: ${input.formattingProfile}\nCustom guidelines: ${input.customGuidelines || "None"}\n\nReturn only the strict CLARIFICATION JSON object. Do not generate the FRD.`;
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are an enterprise systems analyst. Return only valid JSON matching the requested contract." },
          { role: "user", content: prompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "clarification_response",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                phase: { type: "string", enum: ["CLARIFICATION"] },
                gap_summary: { type: "string" },
                questions: {
                  type: "array", minItems: 3, maxItems: 5,
                  items: {
                    type: "object", additionalProperties: false,
                    properties: {
                      id: { type: "string", pattern: "^q[1-5]$" },
                      category: { type: "string", enum: [...REQUIRED_QUESTION_CATEGORIES] },
                      question: { type: "string" },
                    },
                    required: ["id", "category", "question"],
                  },
                },
              },
              required: ["phase", "gap_summary", "questions"],
            },
          },
        },
      });
      const parsed = clarificationSchema.parse(JSON.parse(extractText(response)));
      return parsed;
    }),
    generate: publicProcedure.input(commonInput.extend({
      questions: z.array(z.object({ id: z.string(), category: questionCategory, question: z.string() })).min(3).max(5),
      answers: z.record(z.string(), z.string()),
    })).mutation(async ({ input }) => {
      const prompt = `${ENTERPRISE_AUDIT_FRD_TEMPLATE}\n\nGENERATION INPUT\nHigh-Level Requirement:\n${input.requirement}\n\nDocument title: ${input.documentTitle}\nMetadata:\n${JSON.stringify({ ...input.metadata, revisionDate: strictDate(input.metadata.revisionDate) }, null, 2)}\n\nFormatting profile: ${input.formattingProfile}\nCustom guidelines: ${input.customGuidelines || "None"}\n\nClarifying Questions and Answers:\n${input.questions.map(q => `${q.id} [${q.category}] ${q.question}\nAnswer: ${input.answers[q.id] || "No answer provided"}`).join("\n\n")}\n\nGenerate only the complete FRD in Markdown. Use the mandatory six sections, strict tables, exact role labels, DD-MMM-YY dates, and FR-01 style identifiers. Do not add a preamble.`;
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are an audit-compliant enterprise FRD generator. Produce precise technical Markdown with no filler." },
          { role: "user", content: prompt },
        ],
      });
      const markdown = extractText(response).replace(/^```(?:markdown)?\s*/i, "").replace(/\s*```$/i, "").trim();
      if (!markdown) throw new Error("The FRD generator returned empty content.");
      return { markdown };
    }),
  }),
});

export type AppRouter = typeof appRouter;
