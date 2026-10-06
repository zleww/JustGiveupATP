**Live Site:** [https://just-give-up-atp.vercel.app](https://just-give-up-atp.vercel.app)  
*Place this content inside `JustGiveupATP/README.md`:*

```markdown
# ⚔️ JustGiveupATP (JurisCards Arena) — The Legal Codex Card Battler

> **Live Deployment:** [https://just-give-up-atp.vercel.app](https://just-give-up-atp.vercel.app)

JurisCards Arena turns Philippine Republic Acts into a tabletop strategy battle game! Real legal problems become monsters, and Republic Acts become hero cards used to prove statutory elements and win trials.

---

## 🌟 What This Project Does

- **Statutes as Heroes:** Hero power and defense stats dynamically scale using actual fines, sections, and ratings.
- **Trial Encounters:** Solve real-life fact patterns by matching the exact elements of the violation.
- **Shared Live Codex:** Dynamically loads hero cards from the **L-Lawliet** API.
- **Offline Safeguard:** Includes a local fallback codex if the internet connection is disrupted during gameplay.

---

## 🔗 Connected Backend

- **Source API:** `https://l-lawliet-three.vercel.app/api/v1/laws`
- **Adapter Client:** `js/app.js` (`JurisAPI`)
- **Key Header:** `x-api-key: student-api-key-123`

---

## 🛠️ How to Push Changes (Git Bash)

To push engine updates or interface improvements to GitHub:

```bash
# 1. Stage all files
git add .

# 2. Commit your work
git commit -m "feat: enhance battle logic and ui animations"

# 3. Push to GitHub & Vercel
git push origin main



# JurisCards Arena ⚖️

**The Legal Codex Card Battler.** Philippine Republic Acts are your Hero Cards; legal offenses, procedural flaws and multi-issue litigation are the Monsters and Bosses. Read the fact pattern, draft a party of statutes, and invoke the right law for every essential element before your Juris Power runs out.

Built for law students, bar reviewees, paralegals, criminology / legal-management undergraduates and civic-tech enthusiasts. It runs on the **L-Lawliet Legal Codex** API (`/api/v1/laws`), so the game keeps no law database of its own.

> Educational game. Not legal advice. Always verify against the Official Gazette.

---

## Features

- **Hero Cards built from real statutes.** Every law in the codex becomes a card. Power uses the PRD formula `Math.round(min_fine_php / 4000) + importance × 6`.
- **13 cases in 3 tiers.** Tier 1 Infractions, Tier 2 Violations and Tier 3 Boss Litigation. Every element cites the statutory section that establishes it.
- **5 procedural Action Cards:** Element Check, Request Clarification, Exception Shield, Reshuffle Party and Search Precedent. Search Precedent queries the codex live during a turn.
- **Party synergies.** *Digital Protection* (RA 10175 + RA 11313) and *Fiscal Due Process* (RA 10963 + RA 11032).
- **Deep inspection.** "Inspect" opens the full Gazette record of any statute.
- **Offline resilience.** If the API is unreachable, the game switches to a bundled copy of the codex without interrupting play.
- **Rank and trial history** are saved in the browser, from Law Student up to Justice.
- **Responsive** down to 360px. Plain HTML, CSS and JS with no build step.

## Quick start

```bash
pip install -r requirements.txt
python scripts/dev_server.py
```

Then open <http://localhost:8077>. The dev server runs the real FastAPI codex (`api/index.py`) and serves the static site from the same origin, which is the same layout as on Vercel.

You can also open `arena.html` directly from disk (`file://`). It falls back to the bundled offline codex automatically.

### Run the tests

```bash
node --test "tests/*.test.mjs"
```

The tests check the statutory-data integrity of every case and the engine rules: drafting, adjudication, synergies, shields, and a full winnable playthrough of every case.

## How to play

1. **Trial docket opened.** Pick a case and read the incident and its known facts.
2. **Party inspection.** You start with 5 drafted Republic Acts. At least one of them always applies to the case.
3. **Tactical decision.** Either *Invoke* a Hero Statute or play an *Action Card*. Each play takes one turn.
4. **Adjudication.**
   - **Match:** the element is established, its legal basis is shown, and the threat takes damage.
   - **Misapplication:** *Objection sustained!* You lose Juris Power, reduced by the card's DEF.
   - Every 3 turns the **docket clock** strikes.
5. **Case resolution.** Prove every element and bring the threat to 0 HP to win. The trial is logged and your rank advances.

Some elements are **sealed** until you uncover a hidden fact with *Request Clarification*. Others are **procedural** and are established by an action card, not a statute. Full rules are in [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md).

## Project structure

```
index.html            Landing page
arena.html            Game container (docket + encounter screens, modals)
css/arena.css         All styling (CSS custom properties, Grid/Flexbox, responsive)
js/app.js             JurisAPI client adapter + Hero Card mapping + synergies
js/engine.js          Turn manager & state engine (pure logic, no DOM)
js/arena.js           UI controller (rendering, input, modals, profile/rank)
data/cases.js         Case docket: monsters, bosses, elements, statutory bases
data/codex-cache.js   AUTO-GENERATED offline codex (do not edit)
api/index.py          AUTO-SYNCED FastAPI backend from L-Lawliet (do not edit here)
scripts/sync_codex.py Syncs api/index.py + codex cache from ../L-Lawliet
scripts/dev_server.py Local server: API + static site on one origin
tests/                Node built-in test runner
docs/                 Architecture and game-design documentation
vercel.json           Routes /api/* to the Python function
```

## Keeping the codex in sync

L-Lawliet is the single source of truth for statute data. After changing laws there, run:

```bash
python scripts/sync_codex.py
```

This copies `L-Lawliet/api/index.py` to `api/index.py` and regenerates `data/codex-cache.js`. If L-Lawliet isn't in the sibling folder, pass its path as an argument. Then run the tests: they fail if a case cites an RA that no longer exists in the codex.

## Deployment (Vercel)

1. Import the GitHub repo into Vercel. No framework preset and no build command are needed.
2. Vercel serves the static files and runs `api/index.py` as a Python function. `vercel.json` rewrites `/api/*` to it, and `requirements.txt` lists `fastapi`, `uvicorn` and `pydantic`.
3. To point the game at a different codex host, define `window.JURIS_CONFIG = { apiBase: "https://…/api/v1" }` before `js/app.js` loads. The L-Lawliet API allows all CORS origins.



## Credits

- Statute data: [L-Lawliet](https://github.com/zleww/L-Lawliet) Legal Codex API
- Typography: Cinzel, Playfair Display and DM Sans (Google Fonts)
- Gameplay inspired by the hero-party mechanics of *Here to Slay*
