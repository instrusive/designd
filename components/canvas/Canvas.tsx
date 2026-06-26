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
import type { RunNodeRequest, RunNodeResponse } from "@/app/api/run/route";

const NODE_TYPES = { agentNode: AgentNode };
const STORAGE_KEY = "designd-canvas";

const DEFAULT_NODES: Node[] = [
  {
    id: "1",
    type: "agentNode",
    position: { x: 80, y: 180 },
    data: { label: "User Input", model: "google/gemini-2.0-flash", type: "trigger", status: "idle", description: "Receives the user's design brief" } satisfies AgentNodeData,
  },
  {
    id: "2",
    type: "agentNode",
    position: { x: 340, y: 120 },
    data: { label: "Research Agent", model: "google/gemini-2.0-flash", type: "agent", status: "idle", description: "Gathers context and inspiration for the design brief" } satisfies AgentNodeData,
  },
  {
    id: "3",
    type: "agentNode",
    position: { x: 340, y: 260 },
    data: { label: "Copy Agent", model: "google/gemini-2.0-flash", type: "subagent", status: "idle", description: "Writes UI copy and microcopy based on the design brief" } satisfies AgentNodeData,
  },
  {
    id: "4",
    type: "agentNode",
    position: { x: 600, y: 180 },
    data: { label: "Output", model: "google/gemini-2.0-flash", type: "output", status: "idle", description: "Compiles the research and copy into a final design brief summary" } satisfies AgentNodeData,
  },
];

const DEFAULT_EDGES: Edge[] = [
  { id: "e1-2", source: "1", target: "2", animated: false },
  { id: "e1-3", source: "1", target: "3", animated: false },
  { id: "e2-4", source: "2", target: "4", animated: false },
  { id: "e3-4", source: "3", target: "4", animated: false },
];

let idCounter = 10;
function nextId() { return String(++idCounter); }

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
    setNodes((nds) => [...nds, {
      id: nextId(),
      type: "agentNode",
      position,
      data: { label: type.charAt(0).toUpperCase() + type.slice(1), model: "google/gemini-2.0-flash", type, status: "idle", description: "" } satisfies AgentNodeData,
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

  async function handleRun() {
    if (running) return;
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

      const inputText = upstreamOutputs || "Begin the pipeline. Generate an example design brief for a mobile app.";

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
      <Toolbar onClear={handleClear} onRun={handleRun} onReset={handleReset} nodeCount={nodes.length} running={running} />
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
            fitView
            defaultEdgeOptions={{ style: { stroke: "#52525b", strokeWidth: 1.5 } }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--color-border)" />
            <Controls className="[&>button]:bg-card [&>button]:border-border [&>button]:text-foreground" />
            <MiniMap className="!bg-card !border-border" nodeColor="#3f3f46" maskColor="rgba(0,0,0,0.4)" />
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
            onClose={() => setSelectedNodeId(null)}
          />
        )}

        {showOutput && (
          <OutputPanel results={results} onClose={() => setShowOutput(false)} />
        )}
      </div>
    </div>
  );
}
