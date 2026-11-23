# JurisCards Arena

A card game where Philippine Republic Acts are your Hero Cards and legal problems are the
monsters. Read the facts, draft a party of laws, and invoke the right law for each element of
the case before your Juris Power runs out.

Live site: https://just-give-up-atp.vercel.app

Educational game. Not legal advice. Check the Official Gazette for the full text of any law.

## How it connects to L-Lawliet

The Arena has no database of its own. It calls the
[L-Lawliet API](https://l-lawliet-three.vercel.app/api/docs), which keeps everything in
L-Lawliet's Neon PostgreSQL database:

| Data | Table in the L-Lawliet database |
|---|---|
| Laws that become Hero Cards | `laws` |
| Accounts (sign up, sign in, Google) | `users` (shared with L-Lawliet and JurisCards) |
| Finished trials, won or lost | `arena_results` |
| Game settings | `arena_prefs` |

The last two tables come from `scripts/migrate_007_arena.sql` in the L-Lawliet repo. A law
added on L-Lawliet becomes a new Hero Card on the next page load.

## Guests, players and admins

| | Guest | Signed in | Admin |
|---|---|---|---|
| Cases | Tier 1 | All 3 tiers | All 3 tiers |
| Laws in the card pool | 10 | All | All |
| Wins, rank, trial history | Lost when the tab closes | Saved | Saved |
| Leaderboard | View only | Listed | Listed |
| Profile and settings | No | Yes | Yes |
| Admin page | No | No | Yes |

## Features

- **Hero Cards from real laws.** Power comes from the law's minimum fine and impact rating;
  defense from its length.
- **13 cases in 3 tiers.** Each element of a case cites the section of law that establishes it.
- **5 action cards:** Element Check, Request Clarification, Exception Shield, Reshuffle Party
  and Search Precedent (which searches the laws during a turn).
- **Party synergies:** Digital Protection (RA 10175 + RA 11313) and Fiscal Due Process
  (RA 10963 + RA 11032).
- **Ranks** from Law Student to Justice, by the number of different cases won.
- **Leaderboard**, profile with trial history, game settings, and an admin page with the win
  rate of each case.

## Pages

- `index.html` home
- `arena.html` the game: case docket and trials
- `leaderboard.html` top players
- `login.html` sign in, create account, play as a guest
- `profile.html`, `settings.html` account pages
- `admin.html` admin overview
- `js/session.js` shared code: API address, session, account menu

## Running it locally

1. Start the L-Lawliet API: in the L-Lawliet folder run `python scripts/dev.py`
   (http://127.0.0.1:8000). Its `.env` needs `http://127.0.0.1:5600` in `ALLOWED_ORIGINS`.
2. In this folder run `python -m http.server 5600 --bind 127.0.0.1`.
3. Open http://127.0.0.1:5600. On localhost the pages call the local API.

## Tests

```bash
node --test "tests/*.test.mjs"
```

Checks every case's data and the game rules, including a winning playthrough of every case.

## More

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): how the pieces fit
- [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md): rules and numbers
