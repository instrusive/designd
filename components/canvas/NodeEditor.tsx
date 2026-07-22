"use client";

import { useState, useRef } from "react";
import { X, Plus, Link, FileText, Trash2, Image, PenTool, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useResizablePanel } from "@/hooks/useResizablePanel";
import type { AgentNodeData, Material } from "./AgentNode";

const MODELS: { value: string; label: string; free: boolean }[] = [
  // Google AI Studio (free tier via your own key)
  { value: "google/gemini-2.0-flash",                label: "Gemini 2.0 Flash",        free: true  },
  { value: "google/gemini-2.5-flash",                label: "Gemini 2.5 Flash",        free: true  },
  { value: "google/gemini-2.5-pro",                  label: "Gemini 2.5 Pro",          free: false },
  // Anthropic
  { value: "anthropic/claude-haiku-4-5",             label: "Claude Haiku 4.5",        free: false },
  { value: "anthropic/claude-sonnet-4-5",            label: "Claude Sonnet 4.5",       free: false },
  // OpenAI
  { value: "openai/gpt-4o-mini",                     label: "GPT-4o Mini",             free: false },
  { value: "openai/gpt-4o",                          label: "GPT-4o",                  free: false },
];

type NodeMethod = { value: string; label: string; description: string; prompt: string };

const NODE_METHODS: Partial<Record<AgentNodeData["type"], NodeMethod[]>> = {
  "user-interview": [
    {
      value: "semi-structured",
      label: "Semi-structured",
      description: "Open questions with a loose guide",
      prompt: `You are a UX researcher synthesizing semi-structured user interview findings. Semi-structured interviews follow open-ended themes but allow conversations to flow naturally.

Synthesize findings by identifying key themes and patterns, highlighting notable quotes, surfacing pain points and unmet needs, and noting areas of consensus and divergence. Include unexpected insights that emerged organically.

Output sections: Key Themes, Notable Quotes, Pain Points & Needs, Opportunities, Recommended Next Steps.`,
    },
    {
      value: "structured",
      label: "Structured",
      description: "Same questions for all, comparable outputs",
      prompt: `You are a UX researcher synthesizing structured user interview findings. Structured interviews use identical questions across all participants, enabling direct comparison.

Synthesize findings by comparing responses systematically, identifying frequencies and patterns, quantifying qualitative trends where possible (e.g. "4 of 6 participants mentioned…"), and drawing conclusions from the comparative data.

Output sections: Response Patterns, Cross-Participant Comparison, Key Findings, Frequency of Themes, Conclusions.`,
    },
    {
      value: "contextual",
      label: "Contextual Inquiry",
      description: "Observe and interview in their environment",
      prompt: `You are a UX researcher synthesizing contextual inquiry findings. Contextual inquiry combines observation and interview in the user's natural environment, revealing how context shapes behavior.

Synthesize findings by describing environmental factors that influence behavior, noting tools, artifacts, and workarounds users rely on, highlighting say vs. do gaps, and capturing the social and physical context of the experience.

Output sections: Environmental Context, Observed Behaviors, Artifacts & Workarounds, Say vs. Do Gaps, Contextual Insights, Design Implications.`,
    },
    {
      value: "jtbd",
      label: "Jobs-to-be-Done",
      description: "Focused on motivations and desired outcomes",
      prompt: `You are a UX researcher synthesizing interviews through the Jobs-to-be-Done (JTBD) framework. JTBD focuses on the underlying motivations and desired outcomes driving behavior.

Identify functional jobs (what users are trying to accomplish), emotional jobs (how they want to feel), social jobs (how they want to be perceived), and the forces of progress: push, pull, anxiety, and habit. Write job stories in the format: "When [situation], I want to [motivation], so I can [outcome]."

Output sections: Core Jobs, Job Stories, Forces of Progress, Competing Solutions, Design Opportunities.`,
    },
    {
      value: "retrospective",
      label: "Retrospective",
      description: "Reflecting on a past experience",
      prompt: `You are a UX researcher synthesizing retrospective user interviews. Retrospective interviews ask participants to recall and reflect on a past experience, revealing emotional journeys and decision-making processes.

Reconstruct the user's journey and timeline, map emotional highs and lows, identify key decision points and what influenced them, and capture what users remember most vividly — often what mattered most.

Output sections: Experience Timeline, Emotional Journey Map, Key Decision Points, Memorable Moments, Lessons & Implications.`,
    },
  ],
  "focus-group": [
    {
      value: "traditional",
      label: "Traditional",
      description: "6–10 participants, moderator-led discussion",
      prompt: `You are a UX researcher synthesizing a traditional focus group. Traditional focus groups bring 6–10 participants together for structured, moderator-led discussion.

Capture dominant themes, note where the group converged or disagreed, identify how group dynamics shaped individual opinions, and highlight strong reactions. Separate individual voices from group consensus.

Output sections: Group Consensus, Points of Debate, Dominant Themes, Standout Perspectives, Group Dynamics Observations.`,
    },
    {
      value: "mini",
      label: "Mini Focus Group",
      description: "3–5 participants, more intimate",
      prompt: `You are a UX researcher synthesizing a mini focus group with 3–5 participants. The smaller size enables deeper individual contributions and more nuanced discussion.

Capture each participant's perspective in depth, identify patterns across the group, and surface nuanced opinions that might get lost in larger groups. Focus on the depth of reasoning behind participant views.

Output sections: Individual Perspectives, Shared Themes, Nuanced Insights, Depth Analysis, Key Takeaways.`,
    },
    {
      value: "co-design",
      label: "Co-design Workshop",
      description: "Participants actively help shape solutions",
      prompt: `You are a UX researcher synthesizing a co-design workshop where participants actively generated ideas and shaped solutions as design partners.

Capture the ideas and concepts participants produced, identify patterns in their proposed solutions, translate user-generated ideas into actionable design directions, and note unexpected creative directions that emerged.

Output sections: Generated Ideas & Concepts, User-Identified Needs, Emerging Design Directions, Creative Patterns, Actionable Recommendations.`,
    },
    {
      value: "expert-panel",
      label: "Expert Panel",
      description: "Specialists evaluate and critique",
      prompt: `You are a researcher synthesizing findings from an expert panel review. Expert panels bring together domain specialists to evaluate and critique a topic or design.

Capture expert evaluations and critiques, note where experts agreed and disagreed, highlight domain-specific insights, and translate expert feedback into actionable design guidance. Weigh expert opinions against user-centered considerations.

Output sections: Expert Consensus, Points of Disagreement, Domain-Specific Insights, Critical Feedback, Recommended Actions.`,
    },
  ],
  "observation": [
    {
      value: "contextual",
      label: "Contextual Observation",
      description: "Watching users in their natural environment",
      prompt: `You are a UX researcher synthesizing contextual observation sessions. Contextual observation involves watching users in their natural environment without interference.

Describe observed behaviors and workflows, identify environmental factors that shape how tasks are done, note tools, artifacts, and workarounds, capture friction points, and surface behaviors users may not be consciously aware of.

Output sections: Observed Behaviors, Environmental Factors, Tools & Artifacts, Friction Points, Unconscious Patterns, Design Implications.`,
    },
    {
      value: "think-aloud",
      label: "Think-Aloud",
      description: "User narrates while completing tasks",
      prompt: `You are a UX researcher synthesizing think-aloud protocol sessions. Users verbalize their thoughts while completing tasks, revealing mental models and decision-making processes.

Capture what users expected vs. what they encountered, identify moments of confusion, hesitation, and error, map users' mental models, note vocabulary they use to describe tasks, and highlight where the interface matched or violated expectations.

Output sections: Mental Models, Expectation vs. Reality Gaps, Confusion & Error Points, User Language & Vocabulary, Task Success Analysis, Design Recommendations.`,
    },
    {
      value: "shadowing",
      label: "Shadowing",
      description: "Following a user through their workflow",
      prompt: `You are a UX researcher synthesizing shadowing sessions. Shadowing follows users through their full workday or workflow to reveal how a product fits into their broader context.

Map the full workflow and how the product fits within it, identify competing tools, tasks, and interruptions, note time and effort spent on different activities, and highlight integration points and handoffs between tools and people.

Output sections: Workflow Map, Product Integration Points, Competing Priorities & Interruptions, Time & Effort Distribution, Contextual Factors, Opportunity Areas.`,
    },
    {
      value: "diary-study",
      label: "Diary Study",
      description: "Synthesizing self-reported entries over time",
      prompt: `You are a UX researcher synthesizing diary study findings. Diary studies capture self-reported user experiences over time, revealing longitudinal patterns and experiences difficult to observe in a single session.

Identify patterns and trends that emerge over time, note how behaviors and attitudes evolve across the study period, capture emotional highs and lows, identify triggers and contexts that drive specific behaviors, and highlight the gap between initial and later experiences.

Output sections: Longitudinal Patterns, Behavioral Evolution, Emotional Journey Over Time, Trigger & Context Map, First vs. Later Experience Comparison, Key Insights.`,
    },
  ],
  "survey": [
    {
      value: "sus",
      label: "SUS — System Usability Scale",
      description: "10-question scale, scores 0–100",
      prompt: `You are a UX researcher analyzing System Usability Scale (SUS) results. SUS is a 10-item scale with alternating positive/negative statements producing a score from 0–100.

Interpret the overall SUS score using standard benchmarks: >80 = Excellent (A), 68–80 = Good (B/C), 51–68 = OK (D), <51 = Poor (F). Analyze individual items to identify specific usability strengths and weaknesses, and translate findings into concrete design improvements.

Output sections: Overall SUS Score & Grade, Score Interpretation, Item-Level Analysis, Strongest & Weakest Usability Areas, Recommended Improvements.`,
    },
    {
      value: "nps",
      label: "NPS — Net Promoter Score",
      description: "Likelihood to recommend, -100 to +100",
      prompt: `You are a UX researcher analyzing Net Promoter Score (NPS) results. NPS categorizes users as Detractors (0–6), Passives (7–8), or Promoters (9–10) based on likelihood to recommend.

Calculate the NPS (% Promoters − % Detractors) and benchmark: >70 = Excellent, 50–70 = Great, 30–50 = Good, 0–30 = Needs improvement, <0 = Poor. Analyze qualitative feedback from each segment and identify the primary drivers of promotion and detraction.

Output sections: NPS Score & Benchmark, Segment Breakdown, Key Drivers of Promotion, Key Drivers of Detraction, Qualitative Themes, Action Plan.`,
    },
    {
      value: "csat",
      label: "CSAT — Customer Satisfaction Score",
      description: "Satisfaction rating at a specific touchpoint",
      prompt: `You are a UX researcher analyzing Customer Satisfaction Score (CSAT) results. CSAT measures satisfaction at a specific touchpoint, expressed as the percentage of satisfied respondents.

Interpret the CSAT score and benchmark against industry standards (>80% is generally good). Identify touchpoints with highest and lowest satisfaction, analyze qualitative feedback to understand drivers, and distinguish quick wins from longer-term improvements.

Output sections: CSAT Score & Benchmark, Touchpoint Performance, Top Drivers of Satisfaction, Top Drivers of Dissatisfaction, Quick Wins, Strategic Improvements.`,
    },
    {
      value: "ces",
      label: "CES — Customer Effort Score",
      description: "How much effort the experience required",
      prompt: `You are a UX researcher analyzing Customer Effort Score (CES) results. CES measures how much effort users had to exert to complete a task — lower effort correlates to higher loyalty.

Interpret the CES score, identify the highest-effort touchpoints, analyze sources of effort (complexity vs. poor design vs. unclear communication), and prioritize effort-reduction opportunities by impact.

Output sections: CES Score & Interpretation, High-Effort Touchpoints, Sources of Friction, Effort by Category, Prioritized Effort-Reduction Opportunities.`,
    },
    {
      value: "supr-q",
      label: "SUPR-Q — Website Quality",
      description: "Perceived quality across 4 dimensions",
      prompt: `You are a UX researcher analyzing SUPR-Q results. SUPR-Q measures website experience quality across 4 subscales: Usability, Credibility, Loyalty, and Appearance.

Interpret the overall SUPR-Q score and percentile rank. Analyze each subscale, identify the strongest and weakest dimensions, and translate findings into prioritized design improvements.

Output sections: Overall SUPR-Q Score & Percentile, Subscale Breakdown, Strengths & Weaknesses by Dimension, Competitive Context (if applicable), Design Recommendations by Priority.`,
    },
    {
      value: "ueq",
      label: "UEQ — User Experience Questionnaire",
      description: "Comprehensive UX across 6 dimensions",
      prompt: `You are a UX researcher analyzing User Experience Questionnaire (UEQ) results. UEQ measures experience across 6 scales: Attractiveness, Perspicuity, Efficiency, Dependability, Stimulation, and Novelty.

Interpret scores for each scale (-3 to +3), benchmark against the UEQ dataset (Excellent = top 10%, Good = top 25%), distinguish pragmatic quality (Perspicuity, Efficiency, Dependability) from hedonic quality (Stimulation, Novelty), and recommend targeted improvements for the lowest-scoring dimensions.

Output sections: Scale-by-Scale Results, Pragmatic vs. Hedonic Quality, Benchmark Comparison, Critical Gaps, Prioritized Recommendations.`,
    },
  ],
  "data-analysis": [
    {
      value: "affinity",
      label: "Affinity Mapping",
      description: "Group qualitative data into themes",
      prompt: `You are a UX researcher performing affinity mapping on qualitative data. Affinity mapping is a bottom-up clustering technique that organizes observations and data points into meaningful themes.

Identify discrete data points and observations, cluster related items by natural affinity, name each cluster with a concise theme label, and build a hierarchy from granular observations to high-level insights. Surface the most critical themes by frequency and significance.

Output sections: Data Points Identified, Affinity Clusters (by theme), High-Level Insight Themes, Frequency & Significance, Key Takeaways.`,
    },
    {
      value: "descriptive",
      label: "Descriptive Statistics",
      description: "Summarize and describe quantitative data",
      prompt: `You are a data analyst synthesizing descriptive statistics from quantitative research. Descriptive statistics summarize key characteristics of a dataset without making inferences beyond the data.

Summarize central tendency (mean, median, mode), describe variability and distribution, identify outliers and notable data points, present frequencies and ratios, and highlight the most significant patterns.

Output sections: Key Metrics Summary, Distribution & Variability, Outliers & Anomalies, Frequency Analysis, Notable Patterns, Data-Driven Conclusions.`,
    },
    {
      value: "trend",
      label: "Trend Analysis",
      description: "Patterns and changes over time",
      prompt: `You are a data analyst performing trend analysis on time-series data. Trend analysis identifies patterns, changes, and trajectories over time to inform predictions and strategic decisions.

Identify upward, downward, and cyclical trends in key metrics, note the rate and direction of change, identify inflection points and what caused them, distinguish short-term fluctuations from long-term trends, and project where trends are likely to lead.

Output sections: Key Trends Identified, Rate & Direction of Change, Inflection Points & Causes, Short-term vs. Long-term Patterns, Projections, Strategic Implications.`,
    },
    {
      value: "cohort",
      label: "Cohort Analysis",
      description: "Behavior of specific user segments",
      prompt: `You are a data analyst performing cohort analysis. Cohort analysis groups users by shared characteristics or acquisition date and tracks their behavior over time.

Define the cohorts, compare behavior and outcomes across cohorts over time, identify which cohorts perform best and why, highlight retention curves and drop-off points, and surface actionable differences between high and low-performing cohorts.

Output sections: Cohort Definitions, Behavioral Comparison, Retention Analysis, High vs. Low Performer Patterns, Lifecycle Observations, Recommendations.`,
    },
    {
      value: "funnel",
      label: "Funnel Analysis",
      description: "Where users drop off across a flow",
      prompt: `You are a data analyst performing funnel analysis on user flow data. Funnel analysis tracks user progression through a defined sequence of steps, identifying where and why users drop off.

Map the funnel stages and conversion rates at each step, identify steps with the highest drop-off, analyze likely causes at each stage, compare performance across user segments or time periods, and prioritize optimization opportunities by impact.

Output sections: Funnel Stage Breakdown, Conversion Rates by Step, Critical Drop-off Points, Root Cause Analysis, Segment Comparison, Optimization Priorities.`,
    },
    {
      value: "sentiment",
      label: "Sentiment Analysis",
      description: "Score feedback as positive, neutral, or negative",
      prompt: `You are a data analyst performing sentiment analysis on qualitative feedback. Sentiment analysis classifies text as positive, negative, or neutral and identifies the topics associated with each sentiment.

Classify the overall sentiment distribution, identify topics most associated with positive and negative sentiment, highlight the most emotionally intense feedback, and track how sentiment varies across user segments or touchpoints.

Output sections: Overall Sentiment Distribution, Positive Sentiment Drivers, Negative Sentiment Drivers, Neutral Themes, Intensity Analysis, Segment Variation, Actionable Insights.`,
    },
  ],
  "ab-test": [
    {
      value: "conversion",
      label: "Conversion Rate Test",
      description: "Which variant converts better",
      prompt: `You are a UX researcher synthesizing A/B test results focused on conversion rate. This test measures which variant drives more users to complete a target action.

Compare conversion rates between control and variant(s), assess statistical significance, identify which elements of the winning variant drove improvement, note segment differences, and recommend whether to ship, iterate, or retest.

Output sections: Test Summary, Conversion Rate Comparison, Statistical Significance, Winning Variant Analysis, Segment Breakdown, Ship / Iterate / Retest Recommendation.`,
    },
    {
      value: "preference",
      label: "Preference Test",
      description: "Which design users prefer and why",
      prompt: `You are a UX researcher synthesizing preference test results. Preference tests show users two or more design options and ask which they prefer, with qualitative reasoning.

Summarize preference percentages, analyze qualitative reasons behind preferences, identify which design attributes drove preference, note segment variation, and reconcile stated preference with any other performance metrics.

Output sections: Preference Distribution, Top Reasons for Each Option, Design Attributes That Drive Preference, Segment Variation, Qualitative Themes, Design Recommendation with Rationale.`,
    },
    {
      value: "task-completion",
      label: "Task Completion Test",
      description: "Which variant users complete tasks on",
      prompt: `You are a UX researcher synthesizing A/B test results focused on task completion rate. This test measures which variant allows more users to successfully complete a defined task.

Compare task completion rates, analyze error rates and types in each variant, identify where users struggled or abandoned, assess statistical significance, and recommend the variant that best supports task success.

Output sections: Task Completion Rate Comparison, Error Rate Analysis, Abandonment Points, Statistical Significance, Qualitative Observations, Recommendation.`,
    },
    {
      value: "time-on-task",
      label: "Time on Task",
      description: "Which variant is faster to use",
      prompt: `You are a UX researcher synthesizing A/B test results focused on time on task. This test measures which variant allows users to complete tasks more efficiently.

Compare average completion times between variants, analyze time distribution (not just averages — note outliers), identify which steps contributed most to time differences, and assess whether time savings come with tradeoffs in accuracy or satisfaction.

Output sections: Time Comparison (mean, median, range), Step-by-Step Time Breakdown, Outlier Analysis, Speed vs. Accuracy Tradeoffs, Statistical Significance, Recommendation.`,
    },
    {
      value: "multivariate",
      label: "Multivariate Test",
      description: "Multiple variables tested simultaneously",
      prompt: `You are a UX researcher synthesizing multivariate test (MVT) results. MVT evaluates multiple variables simultaneously to understand both individual and combined effects on user behavior.

Summarize the variables tested, identify which combinations performed best, analyze each variable's individual contribution, note interaction effects between variables, and recommend the optimal configuration.

Output sections: Variables & Combinations Tested, Winning Combination, Individual Variable Impact, Interaction Effects, Statistical Confidence, Optimal Configuration Recommendation.`,
    },
  ],
};

const RESEARCH_TYPES = new Set<AgentNodeData["type"]>([
  "user-interview", "focus-group", "observation", "survey", "data-analysis", "ab-test",
]);

type MaterialType = Material["type"];

const TYPE_META: Record<MaterialType, { icon: React.ElementType; label: string }> = {
  link:  { icon: Link,     label: "Link"  },
  text:  { icon: FileText, label: "Text"  },
  image: { icon: Image,    label: "Image" },
  figma: { icon: PenTool,  label: "Figma" },
};

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const maxDim = 1024;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

type Props = {
  nodeId: string;
  data: AgentNodeData;
  onChange: (id: string, data: Partial<AgentNodeData>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
};

export function NodeEditor({ nodeId, data, onChange, onDelete, onClose }: Props) {
  const { width, onMouseDown } = useResizablePanel({ defaultWidth: 256, min: 200, max: 600, side: "right" });
  const [adding, setAdding] = useState(false);
  const [newType, setNewType] = useState<MaterialType>("link");
  const [newLabel, setNewLabel] = useState("");
  const [newContent, setNewContent] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workflowInputRef = useRef<HTMLInputElement>(null);

  const materials = data.materials ?? [];
  const methods = RESEARCH_TYPES.has(data.type) ? (NODE_METHODS[data.type] ?? []) : [];

  function handleMethodChange(value: string) {
    const method = methods.find((m) => m.value === value);
    if (!method) return;
    onChange(nodeId, { method: value, description: method.prompt });
  }

  async function handleWorkflowFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    onChange(nodeId, { workflowMd: text, workflowMdName: file.name });
    e.target.value = "";
  }

  async function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setNewContent(compressed);
    if (!newLabel) setNewLabel(file.name.replace(/\.[^.]+$/, ""));
  }

  function saveMaterial() {
    if (!newContent.trim()) return;
    const material: Material = {
      id: crypto.randomUUID(),
      type: newType,
      label: newLabel.trim() || newContent.trim().slice(0, 50),
      content: newContent.trim(),
    };
    onChange(nodeId, { materials: [...materials, material] });
    setAdding(false);
    setNewLabel("");
    setNewContent("");
    setNewType("link");
  }

  function removeMaterial(id: string) {
    onChange(nodeId, { materials: materials.filter((m) => m.id !== id) });
  }

  function cancelAdding() {
    setAdding(false);
    setNewLabel("");
    setNewContent("");
    setNewType("link");
  }

  return (
    <aside className="shrink-0 border-l border-border bg-card flex flex-col relative" style={{ width }}>
      {/* drag handle */}
      <div
        onMouseDown={onMouseDown}
        className="absolute left-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/30 transition-colors z-10"
      />

      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-sm font-semibold">Edit Node</p>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Separator />

      <div className="flex flex-col gap-4 p-4 flex-1 overflow-y-auto">

        {/* Method selector — research nodes only */}
        {methods.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Method</Label>
            <select
              value={data.method ?? ""}
              onChange={(e) => handleMethodChange(e.target.value)}
              className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground"
            >
              <option value="" disabled>Select a method…</option>
              {methods.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            {data.method && (
              <p className="text-[11px] text-muted-foreground">
                {methods.find((m) => m.value === data.method)?.description}
              </p>
            )}
          </div>
        )}

        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Name</Label>
          <Input
            value={data.label}
            onChange={(e) => onChange(nodeId, { label: e.target.value })}
            className="h-8 text-sm"
            placeholder="e.g. Research Agent"
          />
        </div>

        {/* Model */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Model</Label>
          <select
            value={data.model}
            onChange={(e) => onChange(nodeId, { model: e.target.value })}
            className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground"
          >
            <optgroup label="Free">
              {MODELS.filter((m) => m.free).map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </optgroup>
            <optgroup label="Paid">
              {MODELS.filter((m) => !m.free).map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </optgroup>
          </select>
          {MODELS.find((m) => m.value === data.model)?.free && (
            <Badge variant="outline" className="w-fit text-[10px] border-emerald-500/30 text-emerald-500 bg-emerald-500/5">
              Free tier available
            </Badge>
          )}
        </div>

        {/* Prompt */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Description / Prompt</Label>
          <Textarea
            value={data.description ?? ""}
            onChange={(e) => onChange(nodeId, { description: e.target.value })}
            className="text-sm resize-none min-h-[100px]"
            placeholder="What does this agent do?"
          />
          {data.method && (
            <p className="text-[10px] text-muted-foreground">Auto-filled from method — edit freely.</p>
          )}
        </div>

        <Separator />

        {/* Personal Workflow */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Personal Workflow</Label>
          </div>

          <input
            ref={workflowInputRef}
            type="file"
            accept=".md,text/markdown"
            className="hidden"
            onChange={handleWorkflowFile}
          />

          {data.workflowMd ? (
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2.5 py-2">
              <FileCode className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="text-[11px] text-foreground flex-1 truncate" title={data.workflowMdName}>
                {data.workflowMdName ?? "workflow.md"}
              </span>
              <button
                onClick={() => onChange(nodeId, { workflowMd: undefined, workflowMdName: undefined })}
                className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => workflowInputRef.current?.click()}
              className="flex items-center justify-center gap-1.5 rounded border border-dashed border-border py-3 text-[11px] text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              <FileCode className="h-3.5 w-3.5" />
              Upload .md workflow file
            </button>
          )}
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Upload a Markdown file describing your personal process for this node. The agent will use it to align with your workflow.
          </p>
        </div>

        <Separator />

        {/* Materials */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Materials</Label>
            {!adding && (
              <button
                onClick={() => setAdding(true)}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="h-3 w-3" /> Add
              </button>
            )}
          </div>

          {materials.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {materials.map((m) => {
                const Icon = TYPE_META[m.type].icon;
                return (
                  <div
                    key={m.id}
                    className="flex items-start gap-2 rounded-md border border-border bg-muted/30 px-2.5 py-2"
                  >
                    {m.type === "image" ? (
                      <img
                        src={m.content}
                        alt={m.label}
                        className="h-8 w-8 rounded object-cover shrink-0 border border-border"
                      />
                    ) : (
                      <Icon className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
                    )}
                    <span className="text-[11px] text-foreground leading-tight flex-1 truncate" title={m.label}>
                      {m.label}
                    </span>
                    <button
                      onClick={() => removeMaterial(m.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {adding && (
            <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/20 p-2.5">
              <div className="grid grid-cols-4 gap-1">
                {(Object.entries(TYPE_META) as [MaterialType, typeof TYPE_META[MaterialType]][]).map(([t, meta]) => {
                  const Icon = meta.icon;
                  return (
                    <button
                      key={t}
                      onClick={() => { setNewType(t); setNewContent(""); }}
                      className={`flex flex-col items-center gap-0.5 rounded px-1 py-1.5 text-[10px] border transition-colors ${
                        newType === t
                          ? "border-primary text-foreground bg-primary/10"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-3 w-3" />
                      {meta.label}
                    </button>
                  );
                })}
              </div>

              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="h-7 text-xs"
                placeholder="Label (optional)"
              />

              {newType === "link" && (
                <Input
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="h-7 text-xs"
                  placeholder="https://..."
                />
              )}

              {newType === "text" && (
                <Textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="text-xs resize-none min-h-[80px]"
                  placeholder="Paste your text, notes, or brief here…"
                />
              )}

              {newType === "image" && (
                <div className="flex flex-col gap-1.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageFile}
                  />
                  {newContent ? (
                    <div className="relative">
                      <img src={newContent} alt="preview" className="w-full rounded border border-border object-cover max-h-32" />
                      <button
                        onClick={() => setNewContent("")}
                        className="absolute top-1 right-1 bg-black/60 rounded p-0.5 text-white hover:bg-black/80"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center gap-1.5 rounded border border-dashed border-border py-4 text-[11px] text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                    >
                      <Image className="h-3.5 w-3.5" />
                      Click to upload image
                    </button>
                  )}
                </div>
              )}

              {newType === "figma" && (
                <div className="flex flex-col gap-1.5">
                  <Input
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="h-7 text-xs"
                    placeholder="https://www.figma.com/design/..."
                  />
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Requires <span className="text-foreground font-mono">FIGMA_ACCESS_TOKEN</span> in your environment.
                  </p>
                </div>
              )}

              <div className="flex gap-1.5 justify-end">
                <button
                  onClick={cancelAdding}
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveMaterial}
                  disabled={!newContent.trim()}
                  className="text-[11px] font-medium bg-primary text-primary-foreground rounded px-2 py-1 disabled:opacity-40 hover:opacity-90 transition-opacity"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {materials.length === 0 && !adding && (
            <p className="text-[11px] text-muted-foreground">
              Attach docs, images, links, or Figma frames for this agent to reference.
            </p>
          )}
        </div>
      </div>

      <Separator />

      <div className="px-4 py-3">
        <button
          onClick={() => onDelete(nodeId)}
          className="flex items-center justify-center gap-1.5 w-full rounded-md border border-destructive/40 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="h-3 w-3" />
          Delete node
        </button>
      </div>
    </aside>
  );
}
