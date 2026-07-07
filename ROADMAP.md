# designd — Roadmap

Visual AI agent canvas built around Lianna Lamorena's design thinking process.

---

## What's been built

### Infrastructure
- [x] Next.js 16 app with App Router
- [x] ReactFlow canvas with drag-and-drop nodes
- [x] Left sidebar (node palette) + right panel (editor / output)
- [x] LocalStorage persistence — canvas auto-saves on every change
- [x] Topological sort — nodes always run in the correct dependency order
- [x] Clerk auth setup
- [x] Neon PostgreSQL + Drizzle ORM (schema: users table)

### AI
- [x] OpenRouter integration via `@ai-sdk/openai` with custom base URL
- [x] All nodes default to `google/gemini-2.0-flash-exp:free`
- [x] Each node uses its Description field as its system prompt
- [x] Upstream outputs are passed as context to downstream nodes

### Canvas & Nodes
- [x] 4 pipeline node types: Trigger, Agent, Subagent, Output
- [x] 3 qualitative research nodes: User Interview, Focus Group, Observation
- [x] 3 quantitative research nodes: Survey, Data Analysis, A/B Test
- [x] Each research node drops pre-loaded with a detailed system prompt
- [x] Sidebar grouped into sections: Pipeline / Qualitative / Quantitative
- [x] NodeEditor — click any node to edit its name, model, and system prompt

### Default Pipeline (based on your FigJam)
- [x] Design Brief → Discover → Define → Design → Test
- [x] Each agent's prompt reflects your actual design thinking process
- [x] HEART vs CASTLE framework logic in the Test agent

---

## Up next

### Soon
- [ ] **Named pipelines** — save and reload different pipelines by name, not just one auto-save
- [ ] **Streaming output** — results appear word-by-word instead of all at once
- [ ] **Increase output token limit** — current cap is 512 tokens (~380 words), raise for richer research outputs

### Medium term
- [ ] **Better context passing** — structured handoff between nodes instead of raw text concatenation
- [ ] **Node output preview** — see a node's last output directly on the canvas card
- [ ] **Pipeline templates gallery** — starter pipelines for common design tasks (discovery sprint, usability test plan, design brief, etc.)

### Later
- [ ] **Save pipelines to database** — move beyond localStorage so pipelines persist across devices and browsers
- [ ] **User accounts** — tie saved pipelines to the logged-in Clerk user
- [ ] **Share pipelines** — share a pipeline with another designer via link
- [ ] **More node types** — Define phase methods (personas, HMW, JTBD), Design phase methods (wireframe brief, user flow, prototype spec)

---

## How the app works

1. Open the canvas at `/canvas`
2. Drag nodes from the left sidebar onto the canvas
3. Connect nodes by dragging from a right handle to a left handle
4. Click a node to edit its name, model, and system prompt in the right panel
5. Click **Run Pipeline** — type your design brief in the dialog — hit Run
6. Nodes execute in order, each one receiving the outputs of everything connected above it
7. Watch results appear in the right output panel in real time
8. Click **Reset** in the toolbar to restore the default 5-node pipeline

---

## Models available (OpenRouter free tier)

| Model ID | Notes |
|---|---|
| `google/gemini-2.0-flash-exp:free` | Current default — fast, good quality |
| `meta-llama/llama-3.3-70b-instruct:free` | Strong for structured outputs |
| `mistralai/mistral-7b-instruct:free` | Lightweight and fast |

Switch any node's model in the NodeEditor. Full model list at openrouter.ai/models — filter by "Free".
