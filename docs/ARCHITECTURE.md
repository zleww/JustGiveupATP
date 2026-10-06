# Architecture

JurisCards Arena is a static, build-free web app (HTML5 + vanilla CSS3 + modular JS) with an optional Python serverless backend: the L-Lawliet FastAPI codex. This document describes how the pieces fit, implementing PRD §3 and §8.

## 1. System overview

```
┌────────────────────────────────────────────┐
│ FastAPI Legal Backend  (api/index.py)      │  synced verbatim from ../L-Lawliet
│ GET /api/v1/laws                           │
│ GET /api/v1/laws/{id}                      │
│ GET /api/v1/laws/search?q=                 │
└───────────────────┬────────────────────────┘
                    │ JSON, header x-api-key
                    ▼
┌────────────────────────────────────────────┐   API unreachable / file://
│ JurisAPI client adapter   (js/app.js)      │ ─────────────────────────────┐
│ single source of truth for the game        │                              ▼
└───────────────────┬────────────────────────┘     data/codex-cache.js (window.JURIS_CODEX_CACHE)
                    │ law records
                    ▼
┌────────────────────────────────────────────┐
│ JurisCards  (js/app.js)                    │  law → Hero Card, synergies
└───────────────────┬────────────────────────┘
                    ▼
┌────────────────────────────────────────────┐      ┌────────────────────────────┐
│ JurisEngine  (js/engine.js)                │ ◀──  │ Case docket (data/cases.js) │
│ pure state machine, returns events         │      └────────────────────────────┘
└───────────────────┬────────────────────────┘
                    ▼
┌────────────────────────────────────────────┐
│ Arena UI  (js/arena.js + arena.html + css) │  render state, forward input,
│                                            │  localStorage profile/rank
└────────────────────────────────────────────┘
```

## 2. Modules

| File | Global | Responsibility |
|---|---|---|
| `data/codex-cache.js` | `JURIS_CODEX_CACHE` | Auto-generated snapshot of `LAWS_DATABASE` (offline fallback). |
| `data/cases.js` | `JURIS_CASES`, `JURIS_TIERS` | Hand-authored legal problems: facts, hidden facts, elements, statutory bases. |
| `js/app.js` | `JurisAPI`, `JurisCards` | API adapter (`getLaws`, `getLaw`, `searchLaws`, timeout, fallback). Card mapping (`toHeroCard`, `computePower`, `computeDefense`), `SYNERGIES`, `escapeHtml`. |
| `js/engine.js` | `JurisEngine` | `createEncounter`, `invokeHero`, `playAction`, `draftLaw`. Mutates a plain `state` object and returns an array of `{type, text, basis?, noop?}` events. No DOM and no network. |
| `js/arena.js` | — | Docket screen, encounter screen, Inspect / Search / Verdict modals, profile and rank persistence, codex-source indicator. |

Scripts are plain `<script>` tags (no bundler), loaded in dependency order: cache → cases → app → engine → arena. Each module is an IIFE that attaches to `window`, or to `globalThis` so the Node tests can load the same files in a `vm` sandbox.

## 3. API contract (as implemented by L-Lawliet)

All `/api/v1/laws*` routes require the header `x-api-key: student-api-key-123`. This is a public demo key from L-Lawliet: it is visible in client code and is **not** a secret.

| Endpoint | Response | Used by |
|---|---|---|
| `GET /api/v1/laws` | `{ count, laws: Law[] }` | `JurisAPI.getLaws()`: draft pool, card stats |
| `GET /api/v1/laws/{id}` | `Law` | `JurisAPI.getLaw()`: Inspect Statute modal |
| `GET /api/v1/laws/search?q=` | `{ query, count, results: Law[] }` | `JurisAPI.searchLaws()`: Search Precedent |
| `GET /health` | `{ status, service, version, timestamp }` | ops / dev server check |

> The PRD diagram lists `/api/v1/laws/search`. The real endpoint takes the query in `?q=`, as shown above.

`Law` fields used by the game: `id, ra_number, plain_title, official_title, category, year, status, importance_rating, min_fine_php, total_sections, reading_time_minutes, tldr_summary, full_breakdown, why_it_matters, example_scenario, penalties, enacting_president, target_audience, source_url`.

## 4. Card mapping (PRD §4.1)

| Game attribute | Source fields | Implementation |
|---|---|---|
| Identity | `ra_number`, `plain_title` | Card header and name |
| Class | `category` | 6 classes (the 5 in the PRD + *Education & Civil Rights*, which L-Lawliet also has) |
| PWR | `min_fine_php`, `importance_rating` | `Math.round(min_fine_php / 4000) + importance * 6` (exact PRD formula) |
| DEF | `total_sections`, `reading_time_minutes` | `min(99, round(sections / 4) + minutes * 2)`. **Not specified by the PRD; chosen here.** |
| Ability | `tldr_summary`, `full_breakdown` | Card text; full breakdown in the modal |
| Deep inspection | `official_title`, `penalties`, `source_url` | Inspect modal (fetched live by id, cache fallback) |

## 5. Offline resilience & latency (PRD §9)

- `JurisAPI._get` uses a 4s `AbortController` timeout. On any failure (network error, non-2xx, empty payload, or a `file://` page) it serves `JURIS_CODEX_CACHE` and sets `JurisAPI.source = "cache"`. The top bar shows **Live codex** or **Offline codex**.
- `getLaws()` is memoised per page load. Card generation and drafting are synchronous over that array, well under the 200ms budget: the measured cache path takes about 18ms end to end, including search and lookup.

## 6. Data sync: "zero duplicate database"

The PRD requires the game to share L-Lawliet's codex, not maintain a second one. This repo is a separate Vercel project, so it carries a **synced copy** of L-Lawliet's `api/index.py` plus the generated offline cache:

- `python scripts/sync_codex.py [path]` copies `L-Lawliet/api/index.py` and reads `LAWS_DATABASE` with `ast.literal_eval`, so it never imports FastAPI. It then writes `data/codex-cache.js`.
- **Never edit `api/index.py` or `data/codex-cache.js` in this repo.** Change L-Lawliet, then re-sync.
- Alternative: deploy only the static files and set `window.JURIS_CONFIG.apiBase` to the deployed L-Lawliet URL (CORS is `*`).

## 7. Security notes

- All API and case text is inserted through `JurisCards.escapeHtml`, or with `textContent` in the log. `source_url` is linked only if it starts with `http(s)://`, and it opens with `rel="noopener noreferrer"`.
- `localStorage` access is wrapped in try/catch. The game runs normally when storage is blocked.
- The API key is a shared demo key (see §3). Don't put real secrets in client code.

## 8. Deployment

Vercel serves the static files from the repo root and builds `api/index.py` as a Python function (`@vercel/python`, inferred from `api/` + `requirements.txt`). `vercel.json` rewrites `/api/(.*)` → `/api/index.py`, the same configuration as L-Lawliet.

Local: `python scripts/dev_server.py` mounts the static site onto the FastAPI app at <http://localhost:8077>. Port 8000 is avoided because it's commonly taken by other local APIs.

## 9. Testing

`node --test "tests/*.test.mjs"` (Node ≥ 18, no dependencies). It covers:
- data integrity: every `counters` RA exists in the codex, every element has a `basis`, and tier HP/element bands match the PRD
- the PRD power formula and synergy triggers
- every draft containing at least one playable statute
- misapplication, sealed elements, both shields, the digital synergy bonus
- a scripted winning playthrough of every case

## 10. Decisions & deviations from the PRD

| Topic | Decision |
|---|---|
| "Juris Power" | A single 100-point meter: the player's HP. Misapplication and the docket clock drain it, and 0 means *Case Dismissed*. |
| Win rule | HP 0 **and** every element established. HP can't drop below 1 while elements remain. Once all elements are proven, damage is ×2 ("prima facie"). This keeps PWR meaningful while enforcing element-by-element legal reasoning. |
| Tier 3 Bosses | The PRD page 2 lists Tiers 1–2. Tier 3 Bosses (multi-statute, 100–120 HP) follow the PRD §1 "Bosses" concept. |
| Procedural elements | Some Tier 1 elements are resolved by action cards (Element Check / Request Clarification), matching "identify 2 explicit procedural elements". |
| Search endpoint | `/laws/search?q=` (the actual L-Lawliet route). |
| Rank persistence | `localStorage` for now. Supabase profiles are PRD Phase 4. |
