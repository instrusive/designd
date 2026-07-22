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
- [x] Compact fixed-width nodes (160px) with wrapping label and 2-line description preview
- [x] New nodes auto-offset on drop to avoid overlapping existing nodes
- [x] Delete a node via button in the editor panel or keyboard Delete/Backspace
- [x] Dark mode fixes: native select, edge colors, MiniMap

### Node Editor
- [x] Edit name, model, and system prompt per node
- [x] Materials — attach reference content to any node:
  - **Text** — paste notes, briefs, or research directly
  - **Link** — any public URL, fetched and extracted at run time
  - **Image** — upload and compress locally, sent as vision input
  - **Figma** — paste a Figma frame URL, exported via Figma API (requires `FIGMA_ACCESS_TOKEN`)

### Default Pipeline (based on your design thinking process)
- [x] Design Brief → Discover → Define → Design → Test
- [x] Each agent's prompt reflects your actual design thinking process
- [x] HEART vs CASTLE framework logic built into the Test agent

### Branding
- [x] Copyright: Lianna Lamorena
- [x] Portfolio link: madebylianna.com in the toolbar

---

## Up next

### Soon
- [ ] **Named pipelines** — save and reload different pipelines by name, not just one auto-save
- [ ] **Streaming output** — results appear word-by-word instead of all at once
- [ ] **Increase output token limit** — current cap is 2048 tokens, raise for richer research outputs

### Medium term
- [ ] **Better context passing** — structured handoff between nodes instead of raw text concatenation
- [ ] **Node output preview** — see a node's last output directly on the canvas card
- [ ] **Pipeline templates gallery** — starter pipelines for common design tasks (discovery sprint, usability test plan, design brief, etc.)

### Later
- [ ] **Save pipelines to database** — move beyond localStorage so pipelines persist across devices
- [ ] **User accounts** — tie saved pipelines to a logged-in user
- [ ] **Share pipelines** — share a pipeline with another designer via link
- [ ] **More node types** — Define phase methods (personas, HMW, JTBD), Design phase methods (wireframe brief, user flow, prototype spec)

---

## How the app works

1. Open the canvas at `/canvas`
2. Drag nodes from the left sidebar onto the canvas
3. Connect nodes by dragging from a right handle to a left handle
4. Click a node to edit its name, model, system prompt, and materials in the right panel
5. Click **Run Pipeline** — type your design brief — hit Run
6. Nodes execute in order, each receiving the outputs of everything connected above it
7. Watch results appear in the right output panel in real time
8. Click **Reset** in the toolbar to restore the default 5-node pipeline

---

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `OPENROUTER_API_KEY` | Yes | Runs all AI models via OpenRouter |
| `FIGMA_ACCESS_TOKEN` | Optional | Fetches Figma frames as images for vision models |
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |

---

## Models available (OpenRouter free tier)

| Model ID | Notes |
|---|---|
| `meta-llama/llama-3.3-70b-instruct:free` | Default — strong for structured outputs |
| `deepseek/deepseek-r1:free` | Strong reasoning model |
| `qwen/qwen3-235b-a22b:free` | Large, capable model |

Full list at openrouter.ai/models — filter by "Free". Vision models (for image/Figma materials) must support multimodal input.
