/* ==========================================================
   JurisCards Arena — engine.js
   Turn manager & state engine (PRD §7). Pure logic: no DOM, no fetch.
   The UI (arena.js) calls these functions and renders `state` + returned events.
   Depends on: JurisCards (js/app.js), JURIS_TIERS (data/cases.js)
   ========================================================== */
(function (global) {
  "use strict";

  // ----------------------------------------------------------
  // Tunables — documented in docs/GAME_DESIGN.md. Change there too.
  // ----------------------------------------------------------
  const RULES = {
    startingJp: 100,
    partySize: 5,
    minParty: 3,
    clockEvery: 3, // the threat strikes on every Nth turn
    proceduralDamage: 8, // damage when an action card resolves a procedural element
    primaFacieMultiplier: 2, // damage multiplier once every element is established
    digitalBonus: 1.15, // Digital Protection synergy vs digital threats
    startingActions: { elementCheck: 2, clarify: 1, shield: 1, reshuffle: 1, search: 2 },
  };

  const ACTION_META = {
    elementCheck: { name: "Element Check", icon: "⚖", desc: "Expose the next essential element and the class of law that establishes it." },
    clarify: { name: "Request Clarification", icon: "❓", desc: "Uncover a hidden fact from the case docket." },
    shield: { name: "Exception Shield", icon: "🛡", desc: "Raise a defense that blocks the next incoming damage." },
    reshuffle: { name: "Reshuffle Party", icon: "🔄", desc: "Discard your party and draft a fresh one from the codex." },
    search: { name: "Search Precedent", icon: "🔎", desc: "Query the codex and draft a specific Republic Act into your party." },
  };

  function defaultRng() {
    return Math.random();
  }

  function shuffle(list, rng) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ----------------------------------------------------------
  // Queries
  // ----------------------------------------------------------
  function openElements(state) {
    return state.elements.filter((e) => !e.established);
  }

  function isSealed(state, el) {
    return el.requiresFact != null && state.revealedFacts <= el.requiresFact;
  }

  /** Every RA number that legally applies somewhere in this case. */
  function applicableRas(state) {
    const ras = new Set();
    state.elements.forEach((e) => (e.counters || []).forEach((ra) => ras.add(ra)));
    return ras;
  }

  /** RAs that would establish a still-open element (used to guarantee a playable draft). */
  function neededRas(state) {
    const ras = new Set();
    openElements(state).forEach((e) => (e.counters || []).forEach((ra) => ras.add(ra)));
    return ras.size ? ras : applicableRas(state);
  }

  function classOfRa(state, ra) {
    const card = state.pool.find((c) => c.ra === ra);
    return card ? card.category : "Unknown";
  }

  function strikeDamage(state, card) {
    let dmg = Math.round(10 + card.pwr * 0.25);
    if (state.caseDef.digital && state.synergies.some((s) => s.id === "digital")) {
      dmg = Math.round(dmg * RULES.digitalBonus);
    }
    return dmg;
  }

  // ----------------------------------------------------------
  // Setup
  // ----------------------------------------------------------
  /**
   * @param {object} opts
   * @param {object} opts.caseDef  one entry of JURIS_CASES
   * @param {Array}  opts.laws     codex law records (from JurisAPI.getLaws)
   * @param {Function} [opts.rng]  random source in [0,1) — inject for deterministic tests
   */
  function createEncounter({ caseDef, laws, rng = defaultRng }) {
    const tiers = global.JURIS_TIERS;
    const state = {
      caseDef,
      tier: tiers[caseDef.tier],
      maxHp: caseDef.hp,
      hp: caseDef.hp,
      elements: caseDef.elements.map((def, idx) => ({ ...def, idx, revealed: false, established: false, by: null })),
      revealedFacts: 0,
      jp: RULES.startingJp,
      maxJp: RULES.startingJp,
      turn: 0,
      pool: laws.map(global.JurisCards.toHeroCard),
      party: [],
      actions: { ...RULES.startingActions },
      shieldActive: false,
      fiscalShieldUsed: false,
      synergies: [],
      status: "active",
      rng,
    };
    draftParty(state);
    return state;
  }

  /** Draft a fresh party: at least one card that can establish an open element, rest random. */
  function draftParty(state) {
    const needed = neededRas(state);
    const shuffled = shuffle(state.pool, state.rng);
    const relevant = shuffled.find((c) => needed.has(c.ra));
    const party = relevant ? [relevant] : [];
    for (const card of shuffled) {
      if (party.length >= RULES.partySize) break;
      if (!party.includes(card)) party.push(card);
    }
    state.party = shuffle(party, state.rng);
    refreshSynergies(state);
  }

  function refreshSynergies(state) {
    const before = state.synergies.some((s) => s.id === "digital");
    state.synergies = global.JurisCards.activeSynergies(state.party);
    const after = state.synergies.some((s) => s.id === "digital");
    // Digital Protection grants +1 Request Clarification, once per encounter
    if (!before && after && !state.digitalBonusGranted) {
      state.actions.clarify += 1;
      state.digitalBonusGranted = true;
    }
  }

  // ----------------------------------------------------------
  // Damage to the player (misapplication / docket clock)
  // ----------------------------------------------------------
  function hurtPlayer(state, amount, cause, events, { misapplication = false } = {}) {
    if (state.shieldActive) {
      state.shieldActive = false;
      events.push({ type: "shield", text: `🛡 Exception Shield absorbs ${amount} damage from ${cause}.` });
      return;
    }
    if (misapplication && !state.fiscalShieldUsed && state.synergies.some((s) => s.id === "fiscal")) {
      state.fiscalShieldUsed = true;
      events.push({ type: "shield", text: `🛡 Fiscal Due Process shield blocks the penalty from ${cause}.` });
      return;
    }
    state.jp = Math.max(0, state.jp - amount);
    events.push({ type: "hurt", text: `You lose ${amount} Juris Power (${cause}).` });
    if (state.jp === 0) {
      state.status = "lost";
      events.push({ type: "lose", text: "Your Juris Power is exhausted. Case dismissed." });
    }
  }

  function damageThreat(state, amount, events) {
    const allProven = openElements(state).length === 0;
    const dmg = allProven ? amount * RULES.primaFacieMultiplier : amount;
    // Until every element is proven, the threat can't be finished off.
    const floor = allProven ? 0 : 1;
    const before = state.hp;
    state.hp = Math.max(floor, state.hp - dmg);
    events.push({ type: "damage", text: `${state.caseDef.name} takes ${before - state.hp} damage${allProven ? " (prima facie ×2)" : ""}.` });
    if (state.hp === 0) {
      state.status = "won";
      events.push({ type: "win", text: "Every element proven. Case won!" });
    }
  }

  function endTurn(state, events) {
    if (state.status !== "active") return events;
    state.turn += 1;
    if (state.turn % RULES.clockEvery === 0) {
      const dmg = Math.ceil(state.tier.attack / 2);
      events.push({ type: "strike", text: `⏳ The docket clock runs — ${state.caseDef.name} presses its advantage.` });
      hurtPlayer(state, dmg, "the docket clock", events);
    }
    return events;
  }

  function establish(state, el, by, events) {
    el.revealed = true;
    el.established = true;
    el.by = by;
    events.push({ type: "match", text: `Element established: ${el.label}.`, basis: el.basis });
  }

  // ----------------------------------------------------------
  // Player moves — each returns an array of events for the log
  // ----------------------------------------------------------
  /** Tactical decision A: invoke a Hero Statute from the party (PRD §7 step 3–4). */
  function invokeHero(state, cardId) {
    const events = [];
    if (state.status !== "active") return events;
    const card = state.party.find((c) => String(c.id) === String(cardId));
    if (!card) return events;

    events.push({ type: "info", text: `You invoke ${card.ra} — ${card.name}.` });

    // Prefer revealed elements, then docket order
    const candidates = openElements(state)
      .filter((e) => !isSealed(state, e) && (e.counters || []).includes(card.ra))
      .sort((a, b) => Number(b.revealed) - Number(a.revealed) || a.idx - b.idx);

    if (candidates.length) {
      establish(state, candidates[0], card.ra, events);
      damageThreat(state, strikeDamage(state, card), events);
    } else if (openElements(state).length === 0 && applicableRas(state).has(card.ra)) {
      events.push({ type: "match", text: `${card.ra} presses the proven case.` });
      damageThreat(state, strikeDamage(state, card), events);
    } else {
      const sealedMatch = openElements(state).some((e) => isSealed(state, e) && (e.counters || []).includes(card.ra));
      events.push({
        type: "miss",
        text: sealedMatch
          ? `Objection sustained! ${card.ra} applies, but the facts on record don't support it yet. Request clarification first.`
          : `Objection sustained! ${card.ra} does not establish any open element of this case.`,
      });
      const reduction = Math.min(Math.floor(card.def / 4), Math.floor(state.tier.attack * 0.6));
      hurtPlayer(state, Math.max(3, state.tier.attack - reduction), "misapplication", events, { misapplication: true });
    }
    return endTurn(state, events);
  }

  /** Tactical decision B: play a procedural Action Card (PRD §6). Search uses draftLaw(). */
  function playAction(state, type) {
    const events = [];
    if (state.status !== "active" || !state.actions[type]) return events;
    const meta = ACTION_META[type];

    if (type === "elementCheck") {
      const procedural = openElements(state).find((e) => e.resolvedBy === "elementCheck");
      const target = procedural || openElements(state).find((e) => !e.revealed);
      if (!target) {
        events.push({ type: "info", noop: true, text: "Every element is already exposed — Element Check not spent." });
        return events;
      }
      state.actions[type] -= 1;
      events.push({ type: "info", text: `${meta.icon} ${meta.name}` });
      if (procedural) {
        establish(state, procedural, meta.name, events);
        damageThreat(state, RULES.proceduralDamage, events);
      } else {
        target.revealed = true;
        const classes = [...new Set((target.counters || []).map((ra) => classOfRa(state, ra)))];
        events.push({
          type: "reveal",
          text: target.resolvedBy === "clarify"
            ? `Exposed: "${target.label}" — established by uncovering a fact (Request Clarification).`
            : `Exposed: "${target.label}" — needs a ${classes.join(" / ")} statute.`,
        });
      }
    } else if (type === "clarify") {
      const hasFact = state.revealedFacts < state.caseDef.hiddenFacts.length;
      const procedural = openElements(state).find((e) => e.resolvedBy === "clarify");
      if (!hasFact && !procedural) {
        events.push({ type: "info", noop: true, text: "No further facts on the docket — Request Clarification not spent." });
        return events;
      }
      state.actions[type] -= 1;
      events.push({ type: "info", text: `${meta.icon} ${meta.name}` });
      if (hasFact) {
        const fact = state.caseDef.hiddenFacts[state.revealedFacts];
        state.revealedFacts += 1;
        events.push({ type: "reveal", text: `New fact: ${fact}` });
      }
      if (procedural) {
        establish(state, procedural, meta.name, events);
        damageThreat(state, RULES.proceduralDamage, events);
      }
    } else if (type === "shield") {
      if (state.shieldActive) {
        events.push({ type: "info", noop: true, text: "An Exception Shield is already raised." });
        return events;
      }
      state.actions[type] -= 1;
      state.shieldActive = true;
      events.push({ type: "shield", text: "🛡 Exception Shield raised — the next incoming damage is blocked." });
    } else if (type === "reshuffle") {
      state.actions[type] -= 1;
      draftParty(state);
      events.push({ type: "info", text: `${meta.icon} You redraft your party: ${state.party.map((c) => c.ra).join(", ")}.` });
    } else {
      return events;
    }
    return endTurn(state, events);
  }

  /**
   * Search Precedent: draft a specific law into the party.
   * If the party is full, `replaceCardId` names the card to discard.
   */
  function draftLaw(state, law, replaceCardId) {
    const events = [];
    if (state.status !== "active" || !state.actions.search) return events;
    if (state.party.some((c) => String(c.id) === String(law.id))) {
      events.push({ type: "info", noop: true, text: `${law.ra_number} is already in your party.` });
      return events;
    }
    const card = global.JurisCards.toHeroCard(law);
    if (state.party.length >= RULES.partySize) {
      const idx = state.party.findIndex((c) => String(c.id) === String(replaceCardId));
      if (idx === -1) return events; // UI must ask which card to discard
      const [out] = state.party.splice(idx, 1, card);
      events.push({ type: "info", text: `🔎 You draft ${card.ra} in place of ${out.ra}.` });
    } else {
      state.party.push(card);
      events.push({ type: "info", text: `🔎 You draft ${card.ra} into your party.` });
    }
    state.actions.search -= 1;
    refreshSynergies(state);
    return endTurn(state, events);
  }

  global.JurisEngine = {
    RULES,
    ACTION_META,
    createEncounter,
    invokeHero,
    playAction,
    draftLaw,
    isSealed,
    classOfRa,
    strikeDamage,
  };
})(typeof window !== "undefined" ? window : globalThis);
