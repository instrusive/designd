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
- [x] Custom ThemeProvider — React 19 compatible, no script injection warning

### AI
- [x] Direct Anthropic API integration (`@ai-sdk/anthropic`)
- [x] Direct Google AI Studio integration (`@ai-sdk/google`)
- [x] OpenRouter as fallback for other models
- [x] BYOK (Bring Your Own Key) — visitors supply their own API key, stored in localStorage, never on the server
- [x] Each node uses its Description field as its system prompt
- [x] Upstream outputs are passed as context to downstream nodes

### Canvas & Nodes
- [x] 4 pipeline node types: Trigger, Agent, Subagent, Output
- [x] 3 qualitative research nodes: User Interview, Focus Group, Observation
- [x] 3 quantitative research nodes: Survey, Data Analysis, A/B Test
- [x] Each research node drops pre-loaded with a detailed system prompt
- [x] Sidebar grouped into sections: Pipeline / Qualitative / Quantitative
- [x] Compact fixed-width nodes with wrapping label and 2-line description preview
- [x] New nodes auto-offset on drop to avoid overlapping existing nodes
- [x] Delete a node via button in the editor panel or keyboard Delete/Backspace
- [x] Dark mode fixes: native select, edge colors, MiniMap, ReactFlow controls
- [x] All 3 panels (sidebar, node editor, output) are drag-to-resize

### Node Editor
- [x] Edit name, model, and system prompt per node
- [x] **Method selector** — research nodes have per-type method options that auto-fill the system prompt:
  - User Interview: Semi-structured, Structured, Contextual Inquiry, JTBD, Retrospective
  - Focus Group: Traditional, Mini, Co-design Workshop, Expert Panel
  - Observation: Contextual, Think-Aloud, Shadowing, Diary Study
  - Survey: SUS, NPS, CSAT, CES, SUPR-Q, UEQ
  - Data Analysis: Affinity Mapping, Descriptive Stats, Trend, Cohort, Funnel, Sentiment
  - A/B Test: Conversion Rate, Preference, Task Completion, Time on Task, Multivariate
- [x] **Personal Workflow** — upload a `.md` file per node to personalize how the agent works; injected into the system prompt at run time
- [x] Materials — attach reference content to any node:
  - **Text** — paste notes, briefs, or research directly
  - **Link** — any public URL, fetched and extracted at run time
  - **Image** — upload and compress locally, sent as vision input
  - **Figma** — paste a Figma frame URL, exported via Figma API (requires `FIGMA_ACCESS_TOKEN`)

### Output Panel
- [x] View Output / Hide Output button toggles the panel
- [x] Scrollable output with proper text wrapping
- [x] Drag-to-resize

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
- [ ] **Streaming output** — results appear word-by-word instead of all at once
- [ ] **Increase output token limit** — current cap is 2048 tokens, raise for richer research outputs
- [ ] **Named pipelines** — save and reload different pipelines by name, not just one auto-save

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
2. On first visit, add your API key (Google AI Studio recommended — free tier available)
3. Drag nodes from the left sidebar onto the canvas
4. Connect nodes by dragging from a right handle to a left handle
5. Click a node to edit its name, model, method, system prompt, workflow file, and materials
6. Click **Run Pipeline** — type your design brief — hit Run
7. Nodes execute in order, each receiving the outputs of everything connected above it
8. Results appear in the right output panel
9. Click **Reset** in the toolbar to restore the default 5-node pipeline

---

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | Optional | Server-side fallback for Anthropic models (visitors use their own key via BYOK) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Optional | Server-side fallback for Google models (visitors use their own key via BYOK) |
| `FIGMA_ACCESS_TOKEN` | Optional | Fetches Figma frames as images for vision models |
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |

---

## Models available

| Model | Provider | Cost |
|---|---|---|
| `google/gemini-2.0-flash` | Google AI Studio | Free tier available |
| `google/gemini-2.5-flash` | Google AI Studio | Free tier available |
| `google/gemini-2.5-pro` | Google AI Studio | Paid |
| `anthropic/claude-haiku-4-5` | Anthropic | Paid (cheap) — default |
| `anthropic/claude-sonnet-4-5` | Anthropic | Paid |
| `openai/gpt-4o-mini` | OpenAI via OpenRouter | Paid |
| `openai/gpt-4o` | OpenAI via OpenRouter | Paid |
