"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
  BackgroundVariant,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { AgentNode, type AgentNodeData } from "./AgentNode";
import { Sidebar } from "./Sidebar";
import { Toolbar } from "./Toolbar";
import { NodeEditor } from "./NodeEditor";
import { OutputPanel, type NodeResult } from "./OutputPanel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { RunNodeRequest, RunNodeResponse } from "@/app/api/run/route";

const NODE_TYPES = { agentNode: AgentNode };
const STORAGE_KEY = "designd-canvas";

const DEFAULT_NODES: Node[] = [
  {
    id: "1",
    type: "agentNode",
    position: { x: 50, y: 200 },
    data: {
      label: "Design Brief",
      model: "google/gemini-2.0-flash-exp:free",
      type: "trigger",
      status: "idle",
      description: "You are receiving a design brief. Restate the brief clearly, identify the core problem being solved, the target audience, and any constraints or goals mentioned. Be concise and structured.",
    } satisfies AgentNodeData,
  },
  {
    id: "2",
    type: "agentNode",
    position: { x: 340, y: 200 },
    data: {
      label: "Discover",
      model: "google/gemini-2.0-flash-exp:free",
      type: "agent",
      status: "idle",
      description: "You are a UX researcher in the Discover phase — your job is to learn about the user. Based on the design brief, produce: (1) a profile of the target user and their context, (2) key insights a researcher would uncover through interviews and observations, (3) a competitor landscape summary — what exists, what's missing, what works, (4) a short customer journey narrative showing where the user struggles today. Be specific and grounded, as if you have done the fieldwork.",
    } satisfies AgentNodeData,
  },
  {
    id: "3",
    type: "agentNode",
    position: { x: 630, y: 200 },
    data: {
      label: "Define",
      model: "google/gemini-2.0-flash-exp:free",
      type: "agent",
      status: "idle",
      description: "You are a UX strategist in the Define phase — your job is to determine features and frame the problem. Based on the research findings, produce: (1) 1–2 user personas with goals and frustrations, (2) a problem statement in How Might We format, (3) 3–5 user stories (As a... I want... So that...), (4) the top jobs-to-be-done, (5) a high-level information architecture outline, (6) a prioritized feature list. Be decisive — write as a designer who has turned research into clear direction.",
    } satisfies AgentNodeData,
  },
  {
    id: "4",
    type: "agentNode",
    position: { x: 920, y: 200 },
    data: {
      label: "Design",
      model: "google/gemini-2.0-flash-exp:free",
      type: "agent",
      status: "idle",
      description: "You are a UX designer in the Design phase — your job is to brainstorm solutions and simulate the user experience. Based on the defined problem and features, produce: (1) a recommended design direction with rationale, (2) key user flows described step by step for the 2–3 most critical paths, (3) wireframe descriptions for the most important screens, (4) interaction patterns and component recommendations, (5) a design system starting point — typography mood, color direction, spacing principles. Write as a designer presenting concepts to a team.",
    } satisfies AgentNodeData,
  },
  {
    id: "5",
    type: "agentNode",
    position: { x: 1210, y: 200 },
    data: {
      label: "Test",
      model: "google/gemini-2.0-flash-exp:free",
      type: "output",
      status: "idle",
      description: "You are a UX validation strategist in the Test phase — your job is to plan how to validate this design with real users. Produce an 8-step test plan: (1) what to measure — whole product, feature, version, or release, (2) which framework to use — recommend HEART (for consumer-facing products) or CASTLE (for enterprise/internal products) or standalone methods, with justification based on scope, (3) baseline measurements to collect first, (4) what to redesign based on expected findings, (5) additional measurement rounds needed, (6) how to interpret findings, (7) how to connect findings to business metrics and ROI/KPIs, (8) a brief template for presenting findings to partners, stakeholders, and leadership.",
    } satisfies AgentNodeData,
  },
];

const DEFAULT_EDGES: Edge[] = [
  { id: "e1-2", source: "1", target: "2", animated: false },
  { id: "e2-3", source: "2", target: "3", animated: false },
  { id: "e3-4", source: "3", target: "4", animated: false },
  { id: "e4-5", source: "4", target: "5", animated: false },
];

let idCounter = 10;
function nextId() { return String(++idCounter); }

const DEFAULT_PROMPTS: Partial<Record<AgentNodeData["type"], string>> = {
  "user-interview": `You are a UX researcher synthesizing user interview findings. Based on the design brief and any prior context, produce: (1) a recruitment screener — who to interview and why, (2) a discussion guide with 8 open-ended questions grouped by theme, (3) a synthesis of 4–5 themes a researcher would surface from these interviews, (4) representative quotes that illustrate each theme. Write as a practitioner who has done the fieldwork.`,
  "focus-group": `You are a UX researcher planning and synthesizing a focus group. Based on the design brief and context, produce: (1) a participant mix — how many people, what profiles, why this composition, (2) a facilitator guide with a warm-up exercise and 3–4 discussion topics, (3) a synthesis of key tensions or agreements that typically emerge, (4) a list of group dynamics to watch for that could skew results. Write as a facilitator preparing for a real session.`,
  "observation": `You are a UX researcher conducting contextual inquiry and field observation. Based on the design brief and context, produce: (1) an observation protocol — what environment to visit, what activities to watch, duration, (2) a field notes template with categories: environment, tools used, workarounds, emotional cues, (3) 4–6 behavioral insights that observation surfaces versus what interviews would miss, (4) affinity cluster suggestions for organizing raw notes. Write as a researcher who has done the fieldwork.`,
  "survey": `You are a UX researcher designing and interpreting a quantitative survey. Based on the design brief and context, produce: (1) the survey objective in one sentence, (2) a 10-question survey using Likert scales, multiple choice, and one open-ended question, (3) a sampling note — who to send it to and target sample size, (4) a mock results summary showing what the data might reveal and how to interpret it. Write as a researcher presenting survey findings to a design team.`,
  "data-analysis": `You are a data analyst supporting a UX research team. Based on the design brief and context, produce: (1) what data sources to examine — analytics, CRM, support tickets, usage logs, (2) the 5–7 most important metrics for this problem space, (3) a simulated data narrative — what the numbers might show, trends, and anomalies to investigate, (4) a "so what" connecting the data to design decisions, (5) what a dashboard for this project should track going forward. Write as an analyst presenting to designers.`,
  "ab-test": `You are a UX researcher designing and interpreting an A/B test. Based on the design brief and context, produce: (1) the hypothesis — what you are testing and expected outcome, (2) control vs. variant description, (3) primary metric and secondary metrics, (4) minimum sample size rationale and test duration, (5) a simulated results summary — what a statistically significant outcome looks like and what to conclude, (6) a rollout recommendation. Write as a researcher presenting test findings to a product team.`,
};

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { nodes: Node[]; edges: Edge[] };
  } catch { return null; }
}

function saveToStorage(nodes: Node[], edges: Edge[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }));
}

// Topological sort — returns node ids in execution order
function topoSort(nodes: Node[], edges: Edge[]): string[] {
  const inDegree: Record<string, number> = {};
  const adj: Record<string, string[]> = {};

  for (const n of nodes) { inDegree[n.id] = 0; adj[n.id] = []; }
  for (const e of edges) {
    adj[e.source].push(e.target);
    inDegree[e.target] = (inDegree[e.target] ?? 0) + 1;
  }

  const queue = nodes.filter((n) => inDegree[n.id] === 0).map((n) => n.id);
  const order: string[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    order.push(id);
    for (const next of adj[id] ?? []) {
      inDegree[next]--;
      if (inDegree[next] === 0) queue.push(next);
    }
  }
  return order;
}

export function Canvas() {
  const saved = typeof window !== "undefined" ? loadFromStorage() : null;
  const [nodes, setNodes, onNodesChange] = useNodesState(saved?.nodes ?? DEFAULT_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(saved?.edges ?? DEFAULT_EDGES);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [results, setResults] = useState<NodeResult[]>([]);
  const [showOutput, setShowOutput] = useState(false);
  const [running, setRunning] = useState(false);
  const [showRunDialog, setShowRunDialog] = useState(false);
  const [userPrompt, setUserPrompt] = useState("");
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [rfInstance, setRfInstance] = useState<any>(null);

  useEffect(() => { saveToStorage(nodes, edges); }, [nodes, edges]);

  const setNodeStatus = useCallback((id: string, status: AgentNodeData["status"]) => {
    setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, status } } : n));
  }, [setNodes]);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge({ ...connection, animated: false }, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("application/reactflow") as AgentNodeData["type"];
    if (!type || !rfInstance) return;
    const bounds = reactFlowWrapper.current?.getBoundingClientRect();
    if (!bounds) return;
    const position = rfInstance.screenToFlowPosition({ x: e.clientX - bounds.left, y: e.clientY - bounds.top });
    const label = type.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    setNodes((nds) => [...nds, {
      id: nextId(),
      type: "agentNode",
      position,
      data: { label, model: "google/gemini-2.0-flash-exp:free", type, status: "idle", description: DEFAULT_PROMPTS[type as AgentNodeData["type"]] ?? "" } satisfies AgentNodeData,
    }]);
  }, [rfInstance, setNodes]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    setShowOutput(false);
  }, []);

  const onPaneClick = useCallback(() => setSelectedNodeId(null), []);

  const onNodeDataChange = useCallback((id: string, patch: Partial<AgentNodeData>) => {
    setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, ...patch } } : n));
  }, [setNodes]);

  const onNodeDelete = useCallback((id: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    setSelectedNodeId(null);
  }, [setNodes, setEdges]);

  async function handleRun(userInput: string) {
    if (running) return;
    setShowRunDialog(false);
    setRunning(true);
    setSelectedNodeId(null);
    setShowOutput(true);

    const order = topoSort(nodes, edges);
    const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));
    const outputMap: Record<string, string> = {};

    // Initialize all as idle
    setResults(order.map((id) => ({
      nodeId: id,
      label: (nodeMap[id]?.data as AgentNodeData)?.label ?? id,
      status: "running" as const,
      output: undefined,
    })));
    setEdges((eds) => eds.map((e) => ({ ...e, animated: true })));

    for (const id of order) {
      const node = nodeMap[id];
      if (!node) continue;
      const data = node.data as AgentNodeData;

      setNodeStatus(id, "running");
      setResults((prev) => prev.map((r) => r.nodeId === id ? { ...r, status: "running" } : r));

      // Gather outputs from upstream nodes as context
      const upstreamOutputs = edges
        .filter((e) => e.target === id)
        .map((e) => outputMap[e.source])
        .filter(Boolean)
        .join("\n\n---\n\n");

      const inputText = upstreamOutputs || userInput || "Begin.";

      try {
        const res = await fetch("/api/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nodeId: id,
            label: data.label,
            description: data.description ?? "",
            model: data.model,
            inputText,
            materials: data.materials ?? [],
          } satisfies RunNodeRequest),
        });

        const json = (await res.json()) as RunNodeResponse;

        if (json.error) {
          setNodeStatus(id, "error");
          setResults((prev) => prev.map((r) => r.nodeId === id ? { ...r, status: "error", error: json.error } : r));
        } else {
          outputMap[id] = json.output;
          setNodeStatus(id, "done");
          setResults((prev) => prev.map((r) => r.nodeId === id ? { ...r, status: "done", output: json.output } : r));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Network error";
        setNodeStatus(id, "error");
        setResults((prev) => prev.map((r) => r.nodeId === id ? { ...r, status: "error", error: msg } : r));
      }

      // Small delay between nodes to stay within free tier rate limits
      await new Promise((r) => setTimeout(r, 1500));
    }

    setEdges((eds) => eds.map((e) => ({ ...e, animated: false })));
    setRunning(false);
  }

  function handleClear() {
    setNodes([]); setEdges([]); setSelectedNodeId(null); setResults([]); setShowOutput(false);
  }

  function handleReset() {
    setNodes(DEFAULT_NODES); setEdges(DEFAULT_EDGES); setSelectedNodeId(null); setResults([]); setShowOutput(false);
  }

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="flex flex-col h-screen bg-background">
      <Toolbar onClear={handleClear} onRun={() => setShowRunDialog(true)} onReset={handleReset} nodeCount={nodes.length} running={running} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div ref={reactFlowWrapper} className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setRfInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={NODE_TYPES}
            deleteKeyCode={["Backspace", "Delete"]}
            fitView
            defaultEdgeOptions={{ style: { stroke: "#71717a", strokeWidth: 1.5 } }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--color-border)" />
            <Controls className="[&>button]:bg-card [&>button]:border-border [&>button]:text-foreground [&>button]:hover:bg-muted" />
            <MiniMap className="!bg-card !border-border" nodeColor="#71717a" maskColor="rgba(128,128,128,0.15)" />
            <Panel position="bottom-center">
              <p className="text-[11px] text-muted-foreground bg-card border border-border rounded-full px-3 py-1">
                Drag from sidebar · Connect handles · Click node to edit
              </p>
            </Panel>
          </ReactFlow>
        </div>

        {selectedNode && !showOutput && (
          <NodeEditor
            nodeId={selectedNode.id}
            data={selectedNode.data as AgentNodeData}
            onChange={onNodeDataChange}
            onDelete={onNodeDelete}
            onClose={() => setSelectedNodeId(null)}
          />
        )}

        {showOutput && (
          <OutputPanel results={results} onClose={() => setShowOutput(false)} />
        )}
      </div>

      <Dialog open={showRunDialog} onOpenChange={setShowRunDialog}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>What's your design brief?</DialogTitle>
            <DialogDescription>
              This becomes the starting input for your pipeline's trigger node.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Your prompt</Label>
            <Textarea
              autoFocus
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleRun(userPrompt);
                }
              }}
              placeholder="e.g. Design a mobile app for tracking water intake for busy professionals."
              className="resize-none min-h-[120px] text-sm"
            />
            <p className="text-[11px] text-muted-foreground">⌘ Enter to run</p>
          </div>

          <DialogFooter>
            <button
              onClick={() => setShowRunDialog(false)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleRun(userPrompt)}
              disabled={!userPrompt.trim()}
              className="text-sm font-medium bg-primary text-primary-foreground rounded-md px-3 py-1.5 disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              Run Pipeline
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
