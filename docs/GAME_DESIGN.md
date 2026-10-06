# Game Design

Rules and numbers for JurisCards Arena. All tunables live in `RULES` in [js/engine.js](../js/engine.js). Keep this file in sync when you change them.

## Core loop (PRD §7)

1. **Trial docket opened.** The player sees the incident, the known facts, the threat's HP, and its elements (initially unidentified).
2. **Party inspection.** A party of 5 Hero Cards is drafted from the codex. At least one card always establishes an open element.
3. **Tactical decision.** *Invoke* a Hero Statute or play an *Action Card*. Every play is one turn.
4. **Adjudication.**
   - **Match:** the invoked RA is in an open, unsealed element's `counters`. That element is established, its statutory basis is shown, and the threat takes damage.
   - **Misapplication:** *Objection sustained!* The player loses Juris Power.
5. **Case resolution.** When every element is established and HP hits 0, the case is won. The trial is logged and the rank advances.

## Numbers

| Rule | Value |
|---|---|
| Starting Juris Power (JP) | 100 |
| Party size | 5 (PRD allows 3–5) |
| Strike damage | `round(10 + PWR × 0.25)`, ×1.15 with Digital Protection vs. digital threats |
| Procedural damage (action card resolves an element) | 8 |
| HP floor while elements remain | 1 |
| Prima facie multiplier (all elements proven) | ×2 |
| Misapplication damage | `max(3, attack − min(floor(DEF/4), floor(attack × 0.6)))` |
| Docket clock | every 3rd turn, `ceil(attack / 2)` damage |
| Tier attack | T1 = 10, T2 = 16, T3 = 22 |

Starting action charges per encounter: Element Check ×2, Request Clarification ×1 (+1 with Digital Protection), Exception Shield ×1, Reshuffle Party ×1, Search Precedent ×2.

## Action cards (PRD §6)

| Card | Effect |
|---|---|
| ⚖ Element Check | Establishes a pending *procedural* element (`resolvedBy: "elementCheck"`). Otherwise it reveals the next unidentified element and the class of statute it needs. Not spent if there's nothing to reveal. |
| ❓ Request Clarification | Reveals the next hidden fact, which unseals elements with `requiresFact`, and establishes a pending `resolvedBy: "clarify"` element. Not spent if there's nothing to uncover. |
| 🛡 Exception Shield | Blocks the next incoming damage (misapplication or clock). It doesn't stack. |
| 🔄 Reshuffle Party | Redrafts 5 cards, keeping the playable-card guarantee. |
| 🔎 Search Precedent | Runs `JurisAPI.searchLaws(query)` and drafts the chosen RA. If the party is full, the player picks a card to discard. |

## Synergies (PRD §4.2)

| Synergy | Trigger | Effect |
|---|---|---|
| ⚡ Digital Protection | RA 10175 + RA 11313 in party | +15% strike damage vs. `digital: true` cases. +1 Request Clarification (once per encounter). |
| 🛡 Fiscal Due Process | RA 10963 + RA 11032 in party | Passive shield: the first misapplication penalty each encounter is blocked. |

## Ranks

| Rank | Cases won |
|---|---|
| Law Student | 0 |
| Bar Reviewee | 2 |
| Junior Associate | 4 |
| Senior Associate | 7 |
| Partner | 10 |
| Justice | 13 |

Stored in `localStorage` under `juriscards.profile.v1`: `{ wins, won: {caseId: true}, history: [...] }`, with the last 50 trials kept.

## Case docket

| Tier | Case | HP | Elements (statutes) | Digital |
|---|---|---|---|---|
| 1 | The Bureaucratic Delay | 55 | RA 11032/9485 · clarify | |
| 1 | The Missing Fact | 50 | clarify · RA 9994 | |
| 1 | Wrong Jurisdiction | 60 | RA 10175 · Element Check | ✓ |
| 1 | The Phantom Deduction | 55 | clarify · RA 10963 | |
| 1 | The Open Burner | 55 | RA 9003 · RA 8749 | |
| 1 | The Schoolyard Shadow | 50 | RA 10627 ×2 | |
| 2 | The Digital Intruder | 75 | RA 10175 ×3 (1 sealed) | ✓ |
| 2 | The Street Predator | 80 | RA 11313 ×4 (1 sealed) | |
| 2 | The Data Discloser | 80 | RA 10173 ×4 (1 sealed) | ✓ |
| 2 | The Red-Tape Racketeer | 85 | RA 11032/9485 ×4 (1 sealed) | |
| 2 | The Coercive Partner | 75 | RA 9262 ×3 (1 sealed) | |
| 3 | The Debt-Shaming Syndicate | 115 | RA 10173 ×3 · clarify · RA 10175 | ✓ |
| 3 | The Viral Harasser | 105 | RA 11313 ×3 · RA 10175/11313 (1 sealed) | ✓ |

## Adding a case

1. Add an object to `CASES` in [data/cases.js](../data/cases.js). Required fields: `id, tier, name, sigil, hp, digital, docket, facts[], hiddenFacts[], elements[]`.
2. Each element has **exactly one** of `counters: ["RA …"]` or `resolvedBy: "clarify" | "elementCheck"`. It may add `requiresFact: <index into hiddenFacts>`. It **must** have a `basis` citing the section.
3. **Statutory Accuracy Invariant (PRD §9).**
   - Cite the actual section.
   - List *every* codex RA that genuinely establishes the element. For example, RA 9485 *as amended by* RA 11032 covers the same Sec. 21 violations, so both are accepted.
   - Don't put specific fine amounts in case text. The codex's `penalties` field is the source shown to players.
   - When unsure of a section number, cite the RA generally rather than guess.
4. Keep the tier bands: T1 = 50–60 HP and 2 elements; T2 = 70–85 HP and 3–4 elements; T3 ≥ 100 HP and 4+ elements.
5. Run `node --test "tests/*.test.mjs"`. The integrity and full-playthrough tests cover new cases automatically.
