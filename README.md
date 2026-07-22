# AI Agent Monitor

A real-time dashboard for watching [Claude Code](https://claude.com/claude-code) and [OpenAI Codex CLI](https://github.com/openai/codex) sessions and their agents work.

> Formerly known as *Claude Agent Monitor* / *claude-ui* — the repo was renamed to **ai-agent-monitor** when Codex support was added.

Claude Code writes every session, subagent, and teammate transcript to `~/.claude/projects/` (Codex writes rollouts to `~/.codex/sessions/`). This app watches those files and turns them into live views. The sidebar has a **Claude** and a **Codex** section, each offering the same two views:

- **Session Log** — all sessions grouped by project, with their agents nested under them. Active sessions/agents pulse green; every session is expandable to show its full conversation trace (user messages, assistant replies, tool calls) streaming in real time.

  ![Session Log](docs/session-log.png)

- **Office View** — pick a session and see it as a small office: the main agent at the front desk, every teammate and subagent at their own desk with a live running clock. Animated, labeled arrows show communication flowing between them (messages, spawns, tool activity) as it happens.

  ![Office View](docs/office-view.png)

Everything is read-only: the app never talks to Claude or Codex and never modifies any files — it only tails transcripts.


## Requirements

- **Node.js 18.18+** (Node 20+ recommended) and **npm**
- **Claude Code** installed and used at least once (the app reads `~/.claude/projects/`; without it there is simply nothing to show)
- optionally **Codex CLI** — if `~/.codex/sessions/` exists, the Codex section of the sidebar lights up with the same two views
- macOS or Linux (any platform where `~/.claude/projects` exists)

Runtime dependencies are just Next.js and React (installed via npm):

| Package | Version |
|---|---|
| next | ^15.3 |
| react / react-dom | ^19 |
| typescript (dev) | ^5 |

## Getting started

```bash
git clone https://github.com/alexbt/ai-agent-monitor
cd ai-agent-monitor
make install        # npm install
make dev            # launch at http://localhost:3000
```

Then open **http://localhost:3000**. Start a Claude Code or Codex session (or spawn agents/teammates) in any terminal and watch it appear within a couple of seconds.

### Makefile targets

| Target | What it does |
|---|---|
| `make install` | install dependencies |
| `make dev` | run in development mode with hot reload (port 3000) |
| `make build` | production build |
| `make start` | serve the production build (`make build` first) |
| `make clean` | remove build artifacts (`.next`, TS build cache) |

Without make: `npm install`, then `npm run dev`.


## How it works

```
~/.claude/projects/<project>/<session-id>.jsonl          ← Claude session transcripts
~/.claude/projects/<project>/<session-id>/subagents/     ← Claude subagent transcripts
        agent-<id>.jsonl + agent-<id>.meta.json
~/.codex/sessions/YYYY/MM/DD/rollout-<ts>-<uuid>.jsonl   ← Codex session rollouts
```

- `lib/scanner.ts` scans the Claude tree and builds a snapshot: projects → sessions (first prompt, git branch, teammate name/team) → agents (type, description, activity). "Active" means the transcript was written in the last 60 seconds. Recent transcript tails are parsed for communication events (teammate messages, `SendMessage`/`Agent` tool calls, current tool usage).
- `lib/codex.ts` does the same for Codex rollouts, mapping them into the identical snapshot shape (sessions grouped by working directory, titles from Codex's `session_index.jsonl`), so the whole UI is provider-agnostic.
- `app/api/stream/route.ts` polls the selected provider's scanner every 2s and pushes snapshots to the browser over Server-Sent Events (only when something changed; one shared scan across all clients).
- `app/api/trace/route.ts` streams a session's full conversation, then tails the file by byte offset for live updates; it parses whichever transcript format the provider uses into the same trace items.
- Named Claude teammate agents run as sibling sessions; they are linked back to their spawning session via the `teamName` field in the transcript, which is how the office view seats them together.
- The two views live in `app/components/SessionLogView.tsx` and `app/components/OfficeView.tsx`, rendered by thin pages at `/` and `/visual` (Claude) and `/codex` and `/codex/visual` (Codex).


## Notes & limitations

- Activity is inferred from file writes: a session idle at the prompt (waiting for user input) shows as **inactive** after ~60 seconds even though its process is alive.
- Communication arrows and labels come from transcript tails within a ~90-second window — they visualize recent flow, not the full message history (the trace panel has that).
- The office view shows up to 12 desks per session; extras are counted below the scene.
- Codex sessions are single-agent (no subagent transcripts), so their Office View shows the main agent working alone; traces and activity work the same as for Claude.
