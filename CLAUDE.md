# JurisCards Arena: project context

Working context for continuing development in a new Claude Code session. Read this first, then `graphify-out/GRAPH_REPORT.md` if it exists (see the graphify section below).

## What this is

**JurisCards Arena**, "The Legal Codex Card Battler" (working title *Here to Slay × PH Law*). A responsive web card battler where Philippine Republic Acts are Hero Cards and legal problems are Monsters and Bosses. Being built by Nini (`zleww` on GitHub) to help a friend.

- **Repo:** https://github.com/zleww/JustGiveupATP (branch `main`)
- **Local path:** `C:\Users\Claire Llyzes\Pictures\Nini\Projects\JustGiveupATP`
- **Sibling project it depends on:** `..\L-Lawliet` (https://github.com/zleww/L-Lawliet). This is the FastAPI "Legal Codex" with 21 PH laws. It is the **single source of truth** for statute data.
- **PRD:** `JurisCards-Arena-PRD.pdf` (the user has it in Downloads; it is not committed). Key points are summarised below.

## PRD summary (what we're building toward)

- Static web front-end (`arena.html`, vanilla CSS3, modular JS: `app.js` API adapter + `arena.js` turn manager). Fonts: Cinzel (headers), Playfair Display (card titles), DM Sans (body). Responsive to 360px.
- Backend: the L-Lawliet REST API `/api/v1/laws`, `/laws/{id}`, `/laws/search`. Header `x-api-key`. Deploy on Vercel with `@vercel/python` for `api/index.py`.
- Hero Card mapping: PWR = `Math.round(min_fine_php/4000) + importance*6`. DEF comes from sections and reading time. Ability is `tldr_summary`. "Inspect Statute" opens a modal.
- Synergies: Digital Protection (RA 10175 + RA 11313), Fiscal Due Process (RA 10963 + RA 11032).
- Monsters: Tier 1 Infractions (50–60 HP, 2 elements), Tier 2 Violations (70–85 HP, 3–4 elements), plus Bosses.
- Action cards: Element Check, Request Clarification, Exception Shield, Reshuffle Party, Search Precedent.
- NFRs: <200ms card generation after fetch; offline fallback to a cached dataset; **Statutory Accuracy Invariant** (everything must match real PH law).
- Roadmap: Phase 2 1v1 multiplayer, Phase 3 case editor, Phase 4 Supabase profiles and decks.

## Current status (2026-10-06)

**MVP complete and verified.**
- Landing page plus a full game loop: docket → encounter → verdict.
- 13 cases across 3 tiers.
- All 5 action cards and both synergies.
- Inspect and Search modals, rank/history in localStorage, live/offline codex indicator.
- 11 Node tests pass. Tested in a browser against the live local API: full win flow, search + replace, inspect, offline fallback (about 18ms), no horizontal scroll at 360px, no console errors.

Not yet done / ideas for next steps:
- [ ] Deploy to Vercel. Not done yet: this needs the user or friend's Vercel account; no L-Lawliet deployment was found on the connected account.
- [ ] Have someone with legal training review `data/cases.js` citations, especially RA 9994 / RA 10627 subsections and RA 11313 Sec. 11 sub-letters.
- [ ] More cases, especially Environment (RA 9275 water, RA 8749 smoke-belching), RA 8293 IP, RA 7394 consumer, RA 9165 drugs.
- [ ] Sound/animation polish, card-flip on draft, onboarding tutorial for first-time players.
- [ ] PRD Phases 2–4.

## Commands

```bash
python scripts/dev_server.py          # http://localhost:8077 (API + site). Port 8000 is used by the user's AegisNEO API: don't use it.
node --test "tests/*.test.mjs"        # all tests (Node 18+, no deps)
python scripts/sync_codex.py          # re-sync api/index.py + data/codex-cache.js from ../L-Lawliet
```

`.claude/launch.json` defines the `arena` preview server (port 8077).

## Architecture in one breath

Script load order: `data/codex-cache.js` → `data/cases.js` → `js/app.js` (`JurisAPI`, `JurisCards`) → `js/engine.js` (`JurisEngine`, pure state machine returning event arrays) → `js/arena.js` (UI only). No bundler. Modules attach to `window`/`globalThis` so tests load them in a Node `vm` sandbox. Details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Rules and numbers: [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md).

## Rules for working in this repo

- **Never hand-edit `api/index.py` or `data/codex-cache.js`.** They are generated from L-Lawliet by `scripts/sync_codex.py`. Change law data in L-Lawliet, then re-sync.
- **Don't modify the L-Lawliet project** from this repo's work unless the user explicitly asks; it's a separate repo.
- **Statutory accuracy:** every case element needs a `basis` citation and must accept every codex RA that genuinely applies. Don't invent section numbers or fine amounts. Cite the RA generally if unsure. Run the tests after any `cases.js` change.
- **Keep game logic in `engine.js`** (no DOM there) and rendering in `arena.js`. Engine tunables live in `RULES`; update `docs/GAME_DESIGN.md` when you change them.
- Escape all API/case text with `JurisCards.escapeHtml`, or use `textContent`.
- Style: vanilla JS (ES2018+, no frameworks), 2-space indent, section banners like `// ===== N. TITLE =====` (matches L-Lawliet's style). CSS colors via custom properties in `:root`.
- Git identity is `Nini`. End commit messages with the attribution lines given by the session.

## Environment gotchas

- Windows 11 + Git Bash / PowerShell. Python 3.12 and Node 24 are installed. `fastapi`, `uvicorn` and `graphify` are installed globally.
- The Claude desktop "scratch workspace" path is too long for `git clone` (Filename too long). Always work in this project folder.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
