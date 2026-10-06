// Run with: node --test tests/
// Loads the browser scripts into a sandbox (they attach to globalThis) — no build step needed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const sandbox = { console, Math, setTimeout, clearTimeout };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
for (const file of ["data/codex-cache.js", "data/cases.js", "js/app.js", "js/engine.js"]) {
  // codex-cache.js assigns window.JURIS_CODEX_CACHE
  const src = readFileSync(new URL(file, root), "utf8").replace(/^window\./m, "globalThis.");
  vm.runInContext(src, sandbox, { filename: file });
}
const { JURIS_CASES, JURIS_CODEX_CACHE, JurisCards, JurisEngine } = sandbox;
const laws = JURIS_CODEX_CACHE.laws;
const byRa = (ra) => laws.find((l) => l.ra_number === ra);

// Deterministic RNG (mulberry32)
function rng(seed = 1) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function encounter(id, seed) {
  const caseDef = JURIS_CASES.find((c) => c.id === id);
  return JurisEngine.createEncounter({ caseDef, laws, rng: rng(seed) });
}

function forceParty(state, ras) {
  state.party = ras.map((ra) => JurisCards.toHeroCard(byRa(ra)));
  state.synergies = JurisCards.activeSynergies(state.party);
}

// ---------------------------------------------------------------- data integrity
test("every case's counters exist in the codex and elements are well-formed", () => {
  const ids = new Set();
  for (const c of JURIS_CASES) {
    assert.ok(!ids.has(c.id), `duplicate case id ${c.id}`);
    ids.add(c.id);
    assert.ok([1, 2, 3].includes(c.tier), `${c.id}: bad tier`);
    for (const el of c.elements) {
      assert.ok(el.basis, `${c.id}: element "${el.label}" lacks a statutory basis`);
      assert.ok(!!el.counters !== !!el.resolvedBy, `${c.id}: element needs exactly one of counters/resolvedBy`);
      for (const ra of el.counters || []) assert.ok(byRa(ra), `${c.id}: ${ra} is not in the codex`);
      if (el.requiresFact != null) assert.ok(el.requiresFact < c.hiddenFacts.length, `${c.id}: requiresFact out of range`);
    }
  }
});

test("PRD tier HP bands and element counts hold", () => {
  for (const c of JURIS_CASES) {
    const n = c.elements.length;
    if (c.tier === 1) assert.ok(c.hp >= 50 && c.hp <= 60 && n === 2, c.id);
    if (c.tier === 2) assert.ok(c.hp >= 70 && c.hp <= 85 && n >= 3 && n <= 4, c.id);
    if (c.tier === 3) assert.ok(c.hp >= 100 && n >= 4, c.id);
  }
});

// ---------------------------------------------------------------- card mapping
test("power follows the PRD formula", () => {
  const ra10175 = byRa("RA 10175"); // min fine 200,000, importance 5
  assert.equal(JurisCards.computePower(ra10175), Math.round(200000 / 4000) + 5 * 6);
});

test("synergies activate only with both trigger statutes", () => {
  const cards = (ras) => ras.map((ra) => JurisCards.toHeroCard(byRa(ra)));
  const ids = (ras) => JurisCards.activeSynergies(cards(ras)).map((s) => s.id).join(","); // cross-realm arrays
  assert.equal(ids(["RA 10175"]), "");
  assert.equal(ids(["RA 10175", "RA 11313"]), "digital");
  assert.equal(ids(["RA 10963", "RA 11032"]), "fiscal");
});

// ---------------------------------------------------------------- engine
test("every draft contains at least one statute that can establish an open element", () => {
  for (const c of JURIS_CASES) {
    for (let seed = 1; seed <= 20; seed++) {
      const s = encounter(c.id, seed);
      const needed = new Set(c.elements.flatMap((e) => e.counters || []));
      assert.equal(s.party.length, JurisEngine.RULES.partySize);
      assert.ok(s.party.some((card) => needed.has(card.ra)), `${c.id} seed ${seed}`);
    }
  }
});

test("misapplication costs Juris Power; a correct statute establishes an element", () => {
  const s = encounter("open-burner", 3);
  forceParty(s, ["RA 9003", "RA 8749", "RA 9994"]);
  const wrong = s.party.find((c) => c.ra === "RA 9994");
  JurisEngine.invokeHero(s, wrong.id);
  assert.ok(s.jp < 100);
  JurisEngine.invokeHero(s, s.party.find((c) => c.ra === "RA 9003").id);
  assert.equal(s.elements[0].established, true);
  assert.ok(s.hp >= 1 && s.status === "active", "can't win before every element is proven");
});

test("a case is won once every element is proven and HP reaches 0", () => {
  const s = encounter("bureaucratic-delay", 5);
  forceParty(s, ["RA 11032", "RA 9994", "RA 9003"]);
  JurisEngine.invokeHero(s, s.party[0].id);
  JurisEngine.playAction(s, "clarify");
  assert.equal(s.status, "won");
  assert.equal(s.hp, 0);
});

test("sealed elements require the hidden fact first", () => {
  const s = encounter("digital-intruder", 2);
  forceParty(s, ["RA 10175"]);
  const id = s.party[0].id;
  JurisEngine.invokeHero(s, id); // access
  JurisEngine.invokeHero(s, id); // data interference (without-right element is sealed)
  const jpBefore = s.jp;
  const ev = JurisEngine.invokeHero(s, id); // nothing unsealed left -> objection
  assert.ok(ev.some((e) => e.type === "miss" && /Request clarification/.test(e.text)));
  assert.ok(s.jp < jpBefore || ev.some((e) => e.type === "shield"));
  JurisEngine.playAction(s, "clarify");
  JurisEngine.invokeHero(s, id);
  assert.ok(s.elements.every((e) => e.established));
});

test("exception shield blocks the next hit and fiscal synergy blocks one misapplication", () => {
  const s = encounter("open-burner", 4);
  forceParty(s, ["RA 10963", "RA 11032", "RA 9003"]);
  JurisEngine.playAction(s, "shield");
  JurisEngine.invokeHero(s, s.party[0].id); // misapplication -> manual shield
  JurisEngine.invokeHero(s, s.party[0].id); // misapplication -> fiscal passive (also turn 3 clock hits)
  assert.equal(s.jp, 100 - Math.ceil(s.tier.attack / 2));
});

test("digital synergy grants +1 clarification and boosts strikes vs digital threats", () => {
  const s = encounter("viral-harasser", 1);
  const base = s.actions.clarify - (s.digitalBonusGranted ? 1 : 0);
  s.party = [];
  s.synergies = [];
  s.digitalBonusGranted = false;
  s.actions.clarify = base;
  JurisEngine.draftLaw(s, byRa("RA 10175"));
  JurisEngine.draftLaw(s, byRa("RA 11313"));
  assert.equal(s.actions.clarify, base + 1);
  const card = s.party.find((c) => c.ra === "RA 11313");
  assert.equal(JurisEngine.strikeDamage(s, card), Math.round(Math.round(10 + card.pwr * 0.25) * 1.15));
});

test("full playthrough of every case is winnable with the right statutes", () => {
  for (const c of JURIS_CASES) {
    const s = encounter(c.id, 9);
    const ras = [...new Set(c.elements.flatMap((e) => e.counters || []))];
    forceParty(s, ras);
    s.actions.clarify = 5;
    s.actions.elementCheck = 5;
    s.jp = 1e6; // isolate puzzle-solvability from damage balance
    for (let i = 0; i < 40 && s.status === "active"; i++) {
      const open = s.elements.find((e) => !e.established && !JurisEngine.isSealed(s, e));
      if (open && open.resolvedBy) JurisEngine.playAction(s, open.resolvedBy);
      else if (open) JurisEngine.invokeHero(s, s.party.find((p) => open.counters.includes(p.ra)).id);
      else if (s.elements.some((e) => !e.established)) JurisEngine.playAction(s, "clarify");
      else JurisEngine.invokeHero(s, s.party[0].id);
    }
    assert.equal(s.status, "won", c.id);
  }
});
