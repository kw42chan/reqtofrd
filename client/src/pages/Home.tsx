import { useMemo, useRef, useState } from "react";
import { Streamdown } from "streamdown";
import { ArrowUpRight, Check, ChevronDown, Clipboard, Download, FileText, Loader2, PanelLeft, Play, RotateCcw, ShieldCheck, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { auditMarkdown, ClarifyingQuestion, defaultMetadata, DocumentMetadata, formattingProfiles, sampleRequirement, WorkflowStatus } from "@/lib/reqToFrd";
import { downloadDocx } from "@/lib/exportDocx";

const initialMarkdown = `# Functional Requirement Document

Your generated FRD will appear here after the clarification phase. ReqToFRD will preserve the selected template, metadata, answers, and audit controls in the final document.

> Start by describing the requirement on the left.`;

const statusStyles: Record<WorkflowStatus, string> = {
  Idle: "border-slate-300 bg-slate-100 text-slate-600",
  Clarifying: "border-amber-300 bg-amber-50 text-amber-700",
  Generating: "border-cyan-300 bg-cyan-50 text-cyan-700",
  Completed: "border-emerald-300 bg-emerald-50 text-emerald-700",
};

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="grid gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500"><span>{label}</span><Input value={value} placeholder={placeholder} onChange={event => onChange(event.target.value)} className="h-9 border-slate-200 bg-white text-sm font-normal tracking-normal text-slate-800 shadow-none" /></label>;
}

export default function Home() {
  const [status, setStatus] = useState<WorkflowStatus>("Idle");
  const [requirement, setRequirement] = useState("");
  const [title, setTitle] = useState("Payment Workflow Enhancement");
  const [profile, setProfile] = useState("banking-treasury");
  const [customGuidelines, setCustomGuidelines] = useState("");
  const [metadata, setMetadata] = useState<DocumentMetadata>(defaultMetadata);
  const [questions, setQuestions] = useState<ClarifyingQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [gapSummary, setGapSummary] = useState("");
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [activeTab, setActiveTab] = useState("preview");
  const [quickEdit, setQuickEdit] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const generationController = useRef<AbortController | null>(null);
  const analyze = trpc.reqToFrd.analyze.useMutation();
  const generate = trpc.reqToFrd.generate.useMutation();
  const selectedProfile = formattingProfiles.find(item => item.id === profile) ?? formattingProfiles[2];
  const audit = useMemo(() => auditMarkdown(markdown, metadata), [markdown, metadata]);

  const updateMetadata = (key: keyof DocumentMetadata, value: string) => setMetadata(current => ({ ...current, [key]: value }));
  const updateRole = (key: "requestor" | "departmentHead" | "itDepartment", value: DocumentMetadata["signOffRoles"]["requestor"]) => setMetadata(current => ({ ...current, signOffRoles: { ...current.signOffRoles, [key]: value } }));

  const handleAnalyze = async () => {
    if (requirement.trim().length < 20) { toast.error("Add a little more detail so the analyst can find meaningful gaps."); return; }
    setStatus("Clarifying");
    try {
      const result = await analyze.mutateAsync({ requirement, templateId: "enterprise-audit-frd", formattingProfile: selectedProfile.label, customGuidelines, documentTitle: title, metadata });
      setQuestions(result.questions); setGapSummary(result.gap_summary); setAnswers({});
      toast.success(`${result.questions.length} clarification questions identified.`);
    } catch (error) {
      setStatus("Idle"); toast.error(error instanceof Error ? error.message : "Clarification could not be completed.");
    }
  };

  const handleGenerate = async () => {
    if (!questions.length) { toast.error("Run Analyze & Clarify before generating the FRD."); return; }
    setStatus("Generating"); setMarkdown(""); setIsStreaming(true); setActiveTab("preview"); generationController.current?.abort(); generationController.current = new AbortController();
    try {
      const result = await generate.mutateAsync({ requirement, templateId: "enterprise-audit-frd", formattingProfile: selectedProfile.label, customGuidelines, documentTitle: title, metadata, questions, answers });
      const content = result.markdown;
      for (let index = 0; index < content.length; index += 80) { if (generationController.current?.signal.aborted) throw new DOMException("Generation cancelled", "AbortError");
        await new Promise(resolve => window.setTimeout(resolve, 16));
        setMarkdown(content.slice(0, index + 80));
      }
      setIsStreaming(false); setStatus("Completed"); toast.success("FRD generated and ready for review.");
    } catch (error) {
      setIsStreaming(false); if (error instanceof DOMException && error.name === "AbortError") { setStatus("Idle"); return; } setStatus("Clarifying"); toast.error(error instanceof Error ? error.message : "FRD generation failed.");
    }
  };

  const handleReset = () => { generationController.current?.abort(); generationController.current = null; setStatus("Idle"); setRequirement(""); setQuestions([]); setAnswers({}); setGapSummary(""); setMarkdown(initialMarkdown); setActiveTab("preview"); setIsStreaming(false); };
  const handleCopy = async () => { await navigator.clipboard.writeText(markdown); toast.success("Markdown copied to clipboard."); };
  const handleQuickEdit = () => { setActiveTab("raw"); setQuickEdit(true); window.setTimeout(() => editorRef.current?.focus(), 40); };
  const handleExport = async () => { if (!markdown.trim()) return; await downloadDocx(markdown, title); toast.success("Word document downloaded."); };

  return <div className="min-h-screen bg-[#edf1f2] text-slate-900">
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-[#f7f9f8]/95 backdrop-blur-xl">
      <div className="flex min-h-[68px] items-center gap-4 px-5 lg:px-8">
        <div className="flex min-w-fit items-center gap-3"><div className="grid size-9 place-items-center rounded-xl bg-[#112a36] text-[#b9f0e6] shadow-[0_8px_24px_rgba(17,42,54,0.22)]"><FileText size={18} /></div><div><div className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#112a36]">ReqToDoc</div><div className="text-[10px] text-slate-500">FRD studio / v1.0</div></div></div>
        <Separator orientation="vertical" className="hidden h-8 sm:block" />
        <div className="min-w-0 max-w-[155px] flex-1 sm:max-w-md"><Input aria-label="Document title" value={title} onChange={event => setTitle(event.target.value)} className="h-9 max-w-full overflow-hidden text-ellipsis border-0 bg-transparent px-1 text-lg font-semibold tracking-tight shadow-none focus-visible:ring-0" /></div>
        <div className="hidden items-center gap-2 md:flex"><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Template</span><select value={profile} onChange={event => setProfile(event.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-[#9ee8dc]"><option value="banking-treasury">Enterprise Audit-Compliant FRD</option><option value="ieee-830">IEEE 830 alignment</option><option value="agile-enterprise">Agile Enterprise alignment</option><option value="custom">Custom alignment</option></select></div>
        <Badge aria-live="polite" aria-label={`Workflow status: ${status}`} className={`hidden gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold shadow-none sm:flex ${statusStyles[status]}`}><span className={`size-1.5 rounded-full ${status === "Completed" ? "bg-emerald-500" : status === "Idle" ? "bg-slate-400" : status === "Clarifying" ? "bg-amber-500" : "bg-cyan-500 animate-pulse"}`} />{status}</Badge>
        <Button onClick={handleExport} disabled={!markdown.trim() || isStreaming} className="h-9 gap-2 rounded-lg bg-[#112a36] px-3 text-xs font-semibold text-white shadow-[0_6px_16px_rgba(17,42,54,0.16)] hover:bg-[#193e4d]"><Download size={14} /> <span className="hidden lg:inline">Export Word</span></Button>
      </div>
    </header>

    <main className="mx-auto grid min-h-[calc(100vh-68px)] max-w-[1800px] grid-cols-1 lg:grid-cols-2">
      <section className="border-r border-slate-200/80 bg-[#f3f6f5] px-5 py-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-[680px] space-y-6">
          <div className="flex items-end justify-between"><div><div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#5b8d87]"><PanelLeft size={13} /> Input workspace</div><h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#112a36]">Shape the requirement.</h1><p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">Move from an ambiguous brief to a controlled, sign-off-ready document through one deliberate analyst loop.</p></div><div className="hidden text-right sm:block"><div className="font-mono text-[10px] uppercase tracking-[0.15em] text-slate-400">Phase</div><div className="mt-1 font-mono text-sm font-bold text-[#112a36]">{status === "Idle" ? "01 / INPUT" : status === "Clarifying" ? "02 / GAP" : status === "Generating" ? "03 / BUILD" : "04 / REVIEW"}</div></div></div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(31,56,65,0.06)]"><div className="mb-3 flex items-center justify-between"><label htmlFor="requirement" className="text-sm font-semibold text-[#112a36]">High-level requirement</label><button onClick={() => setRequirement(sampleRequirement)} className="flex items-center gap-1 text-[11px] font-bold text-[#38867c] hover:text-[#112a36]"><Sparkles size={13} /> Use sample prompt</button></div><Textarea id="requirement" value={requirement} onChange={event => setRequirement(event.target.value)} placeholder="Describe the business problem, target users, systems involved, and desired outcome..." className="min-h-[154px] resize-y border-slate-200 bg-[#fbfcfb] text-sm leading-6 shadow-none placeholder:text-slate-400 focus-visible:ring-[#9ee8dc]" /><div className="mt-3 flex items-center justify-between text-[11px] text-slate-400"><span>{requirement.length} characters</span><span className="flex items-center gap-1"><ShieldCheck size={13} /> Private workspace</span></div></div>

          <Accordion type="multiple" defaultValue={["formatting", "metadata"]} className="space-y-3">
            <AccordionItem value="formatting" className="rounded-2xl border border-slate-200 bg-white px-5 shadow-[0_12px_30px_rgba(31,56,65,0.04)]"><AccordionTrigger className="py-4 text-sm font-semibold text-[#112a36] hover:no-underline"><span className="flex items-center gap-2"><span className="grid size-6 place-items-center rounded-md bg-[#e4f4f0] font-mono text-[10px] text-[#36867a]">02</span> Formatting & alignment rules</span></AccordionTrigger><AccordionContent className="pb-5"><div className="grid gap-2 sm:grid-cols-2">{formattingProfiles.map(item => <button key={item.id} onClick={() => setProfile(item.id)} className={`rounded-xl border p-3 text-left transition-all ${profile === item.id ? "border-[#72cfc0] bg-[#effaf7] shadow-[0_0_0_3px_rgba(114,207,192,0.12)]" : "border-slate-200 bg-white hover:border-slate-300"}`}><div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-800">{item.label}</span>{profile === item.id && <Check size={15} className="text-[#36867a]" />}</div><p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p></button>)}</div>{profile === "custom" && <Textarea value={customGuidelines} onChange={event => setCustomGuidelines(event.target.value)} placeholder="Add custom formatting or governance guidelines..." className="mt-3 min-h-24 text-sm" />}</AccordionContent></AccordionItem>
            <AccordionItem value="metadata" className="rounded-2xl border border-slate-200 bg-white px-5 shadow-[0_12px_30px_rgba(31,56,65,0.04)]"><AccordionTrigger className="py-4 text-sm font-semibold text-[#112a36] hover:no-underline"><span className="flex items-center gap-2"><span className="grid size-6 place-items-center rounded-md bg-[#fff4dd] font-mono text-[10px] text-[#b77a1e]">03</span> Document control metadata</span></AccordionTrigger><AccordionContent className="pb-5"><div className="grid gap-3 sm:grid-cols-2"><Field label="Request / Demand ID" value={metadata.requestId} onChange={value => updateMetadata("requestId", value)} /><Field label="Region" value={metadata.region} onChange={value => updateMetadata("region", value)} /><Field label="System" value={metadata.system} onChange={value => updateMetadata("system", value)} /><Field label="Enhancement title" value={metadata.enhancementTitle} onChange={value => updateMetadata("enhancementTitle", value)} /><Field label="Requestor of Business" value={metadata.requestor} onChange={value => updateMetadata("requestor", value)} /><Field label="Department Head" value={metadata.departmentHead} onChange={value => updateMetadata("departmentHead", value)} /><Field label="IT Department" value={metadata.itDepartment} onChange={value => updateMetadata("itDepartment", value)} /><Field label="Revision version" value={metadata.revisionVersion} onChange={value => updateMetadata("revisionVersion", value)} /><Field label="Revision description" value={metadata.revisionDescription} onChange={value => updateMetadata("revisionDescription", value)} /><Field label="Updated by" value={metadata.updatedBy} onChange={value => updateMetadata("updatedBy", value)} /><Field label="Revision date (DD-MMM-YY)" value={metadata.revisionDate} onChange={value => updateMetadata("revisionDate", value.toUpperCase())} /><Field label="Revision remarks" value={metadata.revisionRemarks} onChange={value => updateMetadata("revisionRemarks", value)} /></div><div className="mt-4 grid gap-3 sm:grid-cols-3">{(["requestor", "departmentHead", "itDepartment"] as const).map(key => <label key={key} className="grid gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500"><span>{key === "departmentHead" ? "Department head role" : `${key} role`}</span><select value={metadata.signOffRoles[key]} onChange={event => updateRole(key, event.target.value as DocumentMetadata["signOffRoles"]["requestor"])} className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm font-normal tracking-normal text-slate-700 outline-none focus:ring-2 focus:ring-[#9ee8dc]"><option>Reviewer</option><option>Approver</option><option>Informer</option></select></label>)}</div></AccordionContent></AccordionItem>
          </Accordion>

          {questions.length > 0 && <div className="rounded-2xl border border-[#e3d5b9] bg-[#fffaf0] p-5 shadow-[0_12px_30px_rgba(149,105,37,0.06)]"><div className="flex items-start justify-between gap-4"><div><div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#b77a1e]"><Wand2 size={13} /> Clarification queue</div><h2 className="text-lg font-semibold tracking-tight text-[#3e3120]">Close the gaps before build.</h2><p className="mt-1 text-xs leading-5 text-[#8e7554]">{gapSummary}</p></div><Badge className="border border-[#e8d5ad] bg-white/70 text-[#9d6c18] shadow-none">{questions.length} questions</Badge></div><div className="mt-5 space-y-3">{questions.map((question, index) => <div key={question.id} className="rounded-xl border border-[#eadfc9] bg-white/80 p-3.5"><div className="flex gap-3"><span className="font-mono text-xs font-bold text-[#b77a1e]">0{index + 1}</span><div className="min-w-0 flex-1"><div className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{question.category}</div><p className="text-sm font-medium leading-5 text-slate-700">{question.question}</p><Input value={answers[question.id] ?? ""} onChange={event => setAnswers(current => ({ ...current, [question.id]: event.target.value }))} placeholder="Add your answer or note an assumption..." className="mt-3 h-9 border-[#eadfc9] bg-white text-sm shadow-none" /></div></div></div>)}</div></div>}

          <div className="flex flex-col gap-2 sm:flex-row"><Button onClick={handleAnalyze} disabled={status === "Clarifying" || status === "Generating"} className="h-11 flex-1 gap-2 rounded-xl bg-[#112a36] text-sm font-semibold text-white shadow-[0_8px_20px_rgba(17,42,54,0.18)] hover:bg-[#193e4d]">{status === "Clarifying" ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}{status === "Clarifying" ? "Analyzing gaps..." : "Analyze & Clarify"}<ArrowUpRight size={15} className="ml-auto opacity-60" /></Button><Button onClick={handleGenerate} disabled={!questions.length || status === "Generating"} variant="outline" className="h-11 flex-1 gap-2 rounded-xl border-[#93d9ce] bg-[#effaf7] text-sm font-semibold text-[#236b62] hover:bg-[#e3f6f1]">{status === "Generating" ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}{status === "Generating" ? "Generating FRD..." : "Submit Answers & Generate FRD"}</Button><Button onClick={handleReset} variant="ghost" className="h-11 rounded-xl px-3 text-slate-500 hover:bg-white hover:text-slate-800"><RotateCcw size={15} /><span className="sr-only">Reset</span></Button></div>
        </div>
      </section>

      <section className="relative min-h-[720px] bg-[#e6eceb] px-4 py-5 sm:px-6 lg:px-8 lg:py-8"><div className="mx-auto flex h-full max-w-[760px] flex-col rounded-[22px] border border-slate-200/90 bg-[#fafbf9] shadow-[0_24px_70px_rgba(31,56,65,0.12)]"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 px-5 py-4 sm:px-7"><div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#5b8d87]"><FileText size={13} /> Document canvas</div><h2 className="mt-1 text-lg font-semibold tracking-tight text-[#112a36]">{title || "Untitled FRD"}</h2></div><div className="flex items-center gap-2"><Badge aria-live="polite" aria-label={`Workflow status: ${status}`} className={`gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold shadow-none ${statusStyles[status]}`}><span className={`size-1.5 rounded-full ${status === "Completed" ? "bg-emerald-500" : status === "Idle" ? "bg-slate-400" : status === "Clarifying" ? "bg-amber-500" : "bg-cyan-500 animate-pulse"}`} />{status}</Badge><div className="hidden items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 sm:flex"><Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 gap-1.5 px-2 text-[11px] text-slate-500"><Clipboard size={13} /> Copy</Button><Button variant="ghost" size="sm" onClick={handleQuickEdit} className="h-7 gap-1.5 px-2 text-[11px] text-slate-500"><Wand2 size={13} /> Edit</Button><Button variant="ghost" size="sm" onClick={handleExport} className="h-7 gap-1.5 px-2 text-[11px] text-slate-500"><Download size={13} /> Word</Button></div></div></div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col"><div className="border-b border-slate-200/80 px-5 pt-3 sm:px-7"><TabsList className="h-9 bg-transparent p-0"><TabsTrigger value="preview" className="h-9 rounded-none border-b-2 border-transparent bg-transparent px-3 text-xs font-semibold text-slate-400 data-[state=active]:border-[#398d83] data-[state=active]:text-[#112a36]">Rendered Preview</TabsTrigger><TabsTrigger value="raw" className="h-9 rounded-none border-b-2 border-transparent bg-transparent px-3 text-xs font-semibold text-slate-400 data-[state=active]:border-[#398d83] data-[state=active]:text-[#112a36]">Raw Markdown</TabsTrigger><TabsTrigger value="audit" className="h-9 rounded-none border-b-2 border-transparent bg-transparent px-3 text-xs font-semibold text-slate-400 data-[state=active]:border-[#398d83] data-[state=active]:text-[#112a36]">Audit & Gap Score</TabsTrigger></TabsList></div><TabsContent value="preview" className="mt-0 flex-1 overflow-auto"><article className="prose prose-slate max-w-none px-6 py-8 prose-headings:font-semibold prose-headings:tracking-tight prose-h1:text-3xl prose-h2:border-b prose-h2:border-slate-200 prose-h2:pb-2 prose-h2:text-xl prose-h3:text-base prose-p:text-sm prose-p:leading-7 prose-li:text-sm prose-table:text-xs sm:px-10">{markdown ? <Streamdown>{markdown}</Streamdown> : <div className="grid min-h-[420px] place-items-center text-center"><div><Loader2 size={24} className="mx-auto mb-3 animate-spin text-[#4ea79b]" /><p className="text-sm text-slate-500">Streaming the controlled document structure...</p></div></div>}</article></TabsContent><TabsContent value="raw" className="mt-0 flex-1 p-5 sm:p-7"><Textarea ref={editorRef} value={markdown} onChange={event => setMarkdown(event.target.value)} onFocus={() => setQuickEdit(true)} className={`h-full min-h-[530px] resize-none rounded-xl border-slate-200 bg-[#f4f7f6] font-mono text-xs leading-6 text-slate-700 shadow-inner ${quickEdit ? "ring-2 ring-[#b4e7df]" : ""}`} /></TabsContent><TabsContent value="audit" className="mt-0 flex-1 overflow-auto p-5 sm:p-7"><div className="rounded-2xl border border-slate-200 bg-[#f4f7f6] p-5"><div className="flex flex-wrap items-end justify-between gap-4"><div><div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5b8d87]">Control coverage</div><h3 className="mt-1 text-2xl font-semibold tracking-tight text-[#112a36]">{audit.score}<span className="text-base text-slate-400"> / 100</span></h3></div><div className="h-2 w-40 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-[#49a99b] transition-all" style={{ width: `${audit.score}%` }} /></div></div><div className="mt-6 space-y-2">{audit.items.map(item => <div key={item.label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5"><div className={`grid size-5 place-items-center rounded-full ${item.passed ? "bg-[#e1f5ef] text-[#2e8d7e]" : "bg-[#fff0dc] text-[#b77a1e]"}`}>{item.passed ? <Check size={12} /> : <span className="text-xs">!</span>}</div><div className="min-w-0"><div className="text-xs font-semibold text-slate-700">{item.label}</div><div className="text-[11px] text-slate-400">{item.detail}</div></div></div>)}</div>{audit.gaps.length > 0 && <div className="mt-5 rounded-xl border border-[#eadfc9] bg-[#fffaf0] p-3 text-xs leading-5 text-[#8e7554]"><strong className="text-[#6f5329]">Suggested next checks:</strong> {audit.gaps.join(" ")}</div>}</div></TabsContent></Tabs><div className="flex items-center justify-between border-t border-slate-200/80 px-5 py-3 text-[10px] text-slate-400 sm:px-7"><span className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-[#4ea79b]" /> Enterprise template v1.0.0</span><span aria-live="polite">{isStreaming ? "Live stream in progress" : status === "Completed" ? "Ready for review and export" : "Awaiting requirement input"}</span></div></div></section>
    </main>
  </div>;
}
