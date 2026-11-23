# Architecture

JurisCards Arena is a static web app (HTML, CSS and plain JavaScript, no build step). It has
no backend or database of its own: laws, accounts and saved game results all live in the
L-Lawliet database on Neon and are read and written through the L-Lawliet API.

## 1. System overview

```
Browser (just-give-up-atp.vercel.app)
  index.html  arena.html  leaderboard.html  login.html  profile.html  settings.html  admin.html
        |
        |  fetch() with  Authorization: Bearer <token>  when signed in
        v
L-Lawliet API (l-lawliet-three.vercel.app/api/v1)          FastAPI on Vercel
        |
        v
Neon PostgreSQL: laws, users, comments, ... arena_results, arena_prefs
```

The same API and database also serve L-Lawliet and JurisCards, so one account works on all
three sites.

## 2. Modules

| File | Global | What it does |
|---|---|---|
| `js/session.js` | `ArenaSession` | API address, login session (sessionStorage), `api()` fetch helper, account menu, guest notice, ranks. |
| `data/cases.js` | `JURIS_CASES`, `JURIS_TIERS` | The 13 hand-written cases: facts, hidden facts, elements, statutory basis. |
| `js/app.js` | `JurisAPI`, `JurisCards` | Reads laws (`getLaws`, `getLaw`, `searchLaws`). Turns a law into a Hero Card (`toHeroCard`, `computePower`, `computeDefense`) and holds the `SYNERGIES`. |
| `js/engine.js` | `JurisEngine` | Game rules: `createEncounter`, `invokeHero`, `playAction`, `draftLaw`. Plain state object in, list of events out. No DOM, no network. |
| `js/arena.js` | none | Docket and encounter screens, Inspect / Search / Verdict windows, guest locks, saving results. |

Scripts are plain `<script>` tags loaded in order: session, cases, app, engine, arena. Each
attaches to `window` (or `globalThis`), so the Node tests can load the same files.

## 3. API endpoints used

| Endpoint | Who | Used for |
|---|---|---|
| `GET /laws` | everyone | Card pool. Guests get the first 10 laws; signed-in players get all of them. |
| `GET /laws/{id}` | everyone | Inspect window (guests: preview laws only) |
| `GET /laws/search?q=` | everyone | Search Precedent (guests search their 10 laws) |
| `POST /auth/register`, `/auth/login`, `/auth/google` | everyone | Sign up and sign in |
| `GET /arena/me` | signed in | Cases won, totals, last 20 trials, game settings |
| `POST /arena/results` | signed in | Save a finished trial (won or lost) |
| `DELETE /arena/results` | signed in | Start over |
| `GET`, `PATCH /arena/prefs` | signed in | Game settings |
| `GET /arena/leaderboard` | everyone | Leaderboard (names and counts only) |
| `GET`, `PATCH /me`, `POST /me/password`, `DELETE /me`, `POST /auth/logout-all` | signed in | Profile and account settings |
| `GET /admin/arena` | admin | Totals, win rate per case, activity per player |

The tables `arena_results` and `arena_prefs` are created by `scripts/migrate_007_arena.sql`
in the L-Lawliet repo. Row-level security lets a player add or clear only their own results,
and read only their own settings.

## 4. Guests, players and admins

| | Guest | Signed in | Admin |
|---|---|---|---|
| Cases | Tier 1 | All tiers | All tiers |
| Card pool | 10 laws | All laws | All laws |
| Results, rank, history | sessionStorage, gone when the tab closes | Saved in the database | Saved |
| Leaderboard | View | Listed after the first win | Listed |
| Settings, profile | No | Yes | Yes |
| Admin page | No | No | Yes |

The 10-law limit and every save are enforced by the API. A case is locked when one of its
elements needs a law the player cannot read, which also locks two Tier 1 cases for guests.

## 5. Card mapping

| Game attribute | Law fields | Rule |
|---|---|---|
| Identity | `ra_number`, `plain_title` | Card header and name |
| Class | `category` | 6 classes, one per L-Lawliet category |
| PWR | `min_fine_php`, `importance_rating` | `Math.round(min_fine_php / 4000) + importance * 6` |
| DEF | `total_sections`, `reading_time_minutes` | `min(99, round(sections / 4) + minutes * 2)` |
| Ability | `tldr_summary`, `full_breakdown` | Card text; full text in the Inspect window |

## 6. Security notes

- API and case text goes into the page through `escapeHtml` or `textContent`. `source_url` is
  linked only if it starts with `http(s)://`.
- The login token is kept in sessionStorage and sent as a Bearer header; the API checks it on
  every request. Hiding the admin page from non-admins is only for tidiness: the API answers
  403 to them.
- The sign-in page only redirects back to this site's own pages.

## 7. Deployment

Vercel serves the files as a static site (`vercel.json` sets `"framework": null`). There is
no build step. `https://just-give-up-atp.vercel.app` must be listed in L-Lawliet's
`ALLOWED_ORIGINS` for the browser to be allowed to call the API.

Local: run the L-Lawliet API with `python scripts/dev.py` in the L-Lawliet folder, then serve
this folder on port 5600 (`python -m http.server 5600 --bind 127.0.0.1`). On localhost the
pages call the local API.

## 8. Testing

`node --test "tests/*.test.mjs"` (Node 18 or newer, no dependencies) checks every case's data
against `tests/fixtures/laws.js` (made from L-Lawliet's seed data), the power formula, the
synergies, drafting, misapplication, sealed elements, both shields, and a winning
playthrough of every case. The API side is covered by `tests/arena_tests.py` in L-Lawliet.

## 9. Design decisions

| Topic | Decision |
|---|---|
| Juris Power | A single 100-point meter: the player's HP. Misapplication and the docket clock drain it, and 0 means Case Dismissed. |
| Win rule | Threat HP 0 and every element established. HP cannot drop below 1 while elements remain. Once all elements are proven, damage is doubled ("prima facie"). |
| Tier 3 Bosses | Multi-statute cases with 100 to 120 HP. |
| Procedural elements | Some Tier 1 elements are resolved by action cards (Element Check or Request Clarification). |
| Rank | Counts different cases won, so replaying one case does not raise it. |
