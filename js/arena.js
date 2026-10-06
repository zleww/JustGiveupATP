/* ==========================================================
   JurisCards Arena — arena.js
   UI controller: docket screen, encounter screen, modals, profile/rank persistence.
   Game rules live in engine.js; this file only renders state and forwards player input.
   ========================================================== */
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const { JurisAPI, JurisCards, JurisEngine, JURIS_CASES, JURIS_TIERS } = window;
  const esc = JurisCards.escapeHtml;
  const $ = (id) => document.getElementById(id);

  // ==========================================================
  // 1. PROFILE & RANK (localStorage; game still works if storage is blocked)
  // ==========================================================
  const PROFILE_KEY = "juriscards.profile.v1";
  const RANKS = [
    { name: "Law Student", wins: 0 },
    { name: "Bar Reviewee", wins: 2 },
    { name: "Junior Associate", wins: 4 },
    { name: "Senior Associate", wins: 7 },
    { name: "Partner", wins: 10 },
    { name: "Justice", wins: 13 },
  ];

  function loadProfile() {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) return Object.assign({ wins: 0, won: {}, history: [] }, JSON.parse(raw));
    } catch (e) { /* storage unavailable */ }
    return { wins: 0, won: {}, history: [] };
  }
  function saveProfile() {
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch (e) { /* ignore */ }
  }
  function rankFor(wins) {
    let idx = 0;
    RANKS.forEach((r, i) => { if (wins >= r.wins) idx = i; });
    return idx;
  }

  let profile = loadProfile();
  let laws = [];
  let state = null;
  let pendingDraft = null; // law chosen in Search Precedent while the party is full

  // ==========================================================
  // 2. SHARED RENDER HELPERS
  // ==========================================================
  function heroCardHTML(card) {
    return `
      <article class="hero-card cls-${card.cls.key}" data-card="${esc(card.id)}">
        <div class="card-top">
          <span class="ra">${esc(card.ra)}</span>
          <span class="cls-icon" title="${esc(card.cls.label)}" aria-hidden="true">${card.cls.icon}</span>
        </div>
        <h4 class="name">${esc(card.name)}</h4>
        <span class="cls-label">${esc(card.cls.label)}</span>
        <div class="stats">
          <div class="stat" title="Power: min fine / 4000 + importance × 6"><b>${card.pwr}</b><small>PWR</small></div>
          <div class="stat" title="Defense: reduces misapplication damage"><b>${card.def}</b><small>DEF</small></div>
        </div>
        <p class="ability">${esc(card.ability)}</p>
        <div class="card-actions">
          <button class="btn btn-gold" type="button" data-invoke="${esc(card.id)}">Invoke</button>
          <button class="btn btn-ghost" type="button" data-inspect="${esc(card.id)}" aria-label="Inspect ${esc(card.ra)}">Inspect</button>
        </div>
      </article>`;
  }

  function showToast(text, ms = 2600) {
    const t = $("toast");
    t.textContent = text;
    t.classList.remove("hidden");
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => t.classList.add("hidden"), ms);
  }

  function openModal(id) { $(id).classList.remove("hidden"); }
  function closeModal(id) { $(id).classList.add("hidden"); }

  function renderRank() {
    const idx = rankFor(profile.wins);
    const rank = RANKS[idx];
    const next = RANKS[idx + 1];
    $("rankPill").textContent = rank.name;
    $("rankName").textContent = rank.name;
    if (next) {
      const span = next.wins - rank.wins;
      $("rankBar").style.width = `${Math.round(((profile.wins - rank.wins) / span) * 100)}%`;
      $("rankNext").textContent = `${profile.wins} case${profile.wins === 1 ? "" : "s"} won · ${next.wins - profile.wins} more to ${next.name}`;
    } else {
      $("rankBar").style.width = "100%";
      $("rankNext").textContent = `${profile.wins} cases won · Highest rank reached`;
    }
  }

  // ==========================================================
  // 3. DOCKET SCREEN
  // ==========================================================
  function renderDocket() {
    const tiers = [1, 2, 3];
    $("docketList").innerHTML = tiers.map((t) => {
      const cases = JURIS_CASES.filter((c) => c.tier === t);
      return `
        <section class="tier-block">
          <div class="tier-head">
            <span class="tier-badge t${t}">Tier ${t}</span>
            <h2>${esc(JURIS_TIERS[t].label.split("·")[1] || JURIS_TIERS[t].name)}</h2>
          </div>
          <div class="case-grid">
            ${cases.map((c) => `
              <button class="case-tile" type="button" data-case="${esc(c.id)}">
                <span class="sigil" aria-hidden="true">${c.sigil}</span>
                <h3>${esc(c.name)}</h3>
                <p>${esc(c.docket)}</p>
                <span class="case-meta">
                  <span class="tag">${c.hp} HP</span>
                  <span class="tag">${c.elements.length} elements</span>
                  ${c.digital ? '<span class="tag digital">Digital threat</span>' : ""}
                  ${profile.won[c.id] ? '<span class="tag won">✓ Won</span>' : ""}
                </span>
              </button>`).join("")}
          </div>
        </section>`;
    }).join("");

    $("synergyRef").innerHTML = JurisCards.SYNERGIES.map((s) => `
      <div><strong>${s.icon} ${esc(s.name)}</strong>${esc(s.requires.join(" + "))}: ${esc(s.effect)}</div>`).join("");

    $("historyList").innerHTML = profile.history.length
      ? profile.history.slice().reverse().map((h) => `
          <li>${esc(h.name)}<span>${esc(new Date(h.date).toLocaleDateString())} · ${h.turns} turns · ${h.jp} JP left</span></li>`).join("")
      : '<li style="border-color:var(--border-strong)" class="muted">No trials logged yet.</li>';

    renderRank();
  }

  function showDocket() {
    state = null;
    pendingDraft = null;
    $("encounterView").classList.add("hidden");
    $("docketView").classList.remove("hidden");
    renderDocket();
    window.scrollTo({ top: 0 });
  }

  // ==========================================================
  // 4. ENCOUNTER SCREEN
  // ==========================================================
  function startCase(caseId) {
    const caseDef = JURIS_CASES.find((c) => c.id === caseId);
    if (!caseDef || !laws.length) return;
    state = JurisEngine.createEncounter({ caseDef, laws });
    pendingDraft = null;
    $("battleLog").innerHTML = "";
    $("docketView").classList.add("hidden");
    $("encounterView").classList.remove("hidden");
    $("threatPanel").style.setProperty("--tier-color", `var(--tier-${caseDef.tier})`);
    appendLog([{ type: "info", text: `Trial docket opened: ${caseDef.name}. You drafted ${state.party.map((c) => c.ra).join(", ")}.` }]);
    if (state.synergies.length) {
      appendLog(state.synergies.map((s) => ({ type: "shield", text: `${s.icon} ${s.name} synergy active.` })));
    }
    renderEncounter();
    window.scrollTo({ top: 0 });
  }

  function elementHTML(el, i) {
    const n = `<span class="el-num">E${i + 1}</span>`;
    if (el.established) {
      return `<div class="element established">
        <div class="el-head">${n}<span>✓ ${esc(el.label)}</span></div>
        <div class="basis">${esc(el.basis)} <em>(${esc(el.by)})</em></div>
      </div>`;
    }
    if (JurisEngine.isSealed(state, el)) {
      return `<div class="element sealed"><div class="el-head">${n}<span>Sealed: the record lacks the facts for this element. Request clarification.</span></div></div>`;
    }
    if (el.revealed) {
      const hint = el.resolvedBy === "clarify"
        ? "Established by uncovering a fact (Request Clarification)."
        : el.resolvedBy === "elementCheck"
          ? "Procedural: established by Element Check."
          : `Needs: ${[...new Set(el.counters.map((ra) => JurisEngine.classOfRa(state, ra)))].join(" / ")} statute`;
      return `<div class="element revealed"><div class="el-head">${n}<span>${esc(el.label)}</span></div><div class="hint">${esc(hint)}</div></div>`;
    }
    return `<div class="element"><div class="el-head">${n}<span class="muted">Unidentified element. Read the facts, or use Element Check.</span></div></div>`;
  }

  function renderEncounter(newFact = false) {
    if (!state) return;
    const c = state.caseDef;
    const every = JurisEngine.RULES.clockEvery;

    $("threatSigil").textContent = c.sigil;
    $("threatTier").textContent = `${state.tier.label}${c.digital ? " · Digital threat" : ""}`;
    $("threatName").textContent = c.name;
    $("hpText").textContent = `${state.hp} / ${state.maxHp}`;
    $("hpBar").style.width = `${(state.hp / state.maxHp) * 100}%`;
    $("hpBarWrap").setAttribute("aria-valuenow", state.hp);
    $("docketText").textContent = c.docket;

    const revealed = c.hiddenFacts.slice(0, state.revealedFacts);
    $("factsList").innerHTML =
      c.facts.map((f) => `<li>${esc(f)}</li>`).join("") +
      revealed.map((f, i) => `<li class="${newFact && i === revealed.length - 1 ? "new" : ""}">${esc(f)}</li>`).join("");

    $("elementsList").innerHTML = state.elements.map(elementHTML).join("");

    $("jpText").textContent = `${state.jp} / ${state.maxJp}`;
    $("jpBar").style.width = `${(state.jp / state.maxJp) * 100}%`;
    $("jpBarWrap").setAttribute("aria-valuenow", state.jp);
    $("turnText").textContent = state.turn;
    $("clockText").textContent = `${every - (state.turn % every)} turn${every - (state.turn % every) === 1 ? "" : "s"}`;
    $("shieldPill").classList.toggle("hidden", !state.shieldActive);
    $("synergyChips").innerHTML = state.synergies
      .map((s) => `<span class="synergy-chip" title="${esc(s.effect)}">${s.icon} ${esc(s.name)}</span>`).join("");

    $("partyHand").innerHTML = state.party.map(heroCardHTML).join("");
    $("partyHint").textContent = pendingDraft
      ? `Choose a card to discard for ${pendingDraft.ra_number} (Esc to cancel).`
      : "Invoke a statute that establishes an open element.";
    document.querySelectorAll("#partyHand .hero-card").forEach((el) => el.classList.toggle("replace-mode", !!pendingDraft));

    const active = state.status === "active";
    $("actionRow").innerHTML = Object.entries(JurisEngine.ACTION_META).map(([type, meta]) => `
      <button class="action-card" type="button" data-action="${type}" ${!active || !state.actions[type] ? "disabled" : ""}>
        <span class="ac-top"><span class="ac-name">${meta.icon} ${esc(meta.name)}</span><span class="ac-count">×${state.actions[type]}</span></span>
        <span class="ac-desc">${esc(meta.desc)}</span>
      </button>`).join("");
    document.querySelectorAll("#partyHand [data-invoke]").forEach((b) => { b.disabled = !active || !!pendingDraft; });
  }

  function appendLog(events) {
    const log = $("battleLog");
    events.forEach((ev) => {
      const li = document.createElement("li");
      li.className = ev.type;
      li.textContent = ev.text;
      if (ev.basis) {
        const b = document.createElement("span");
        b.className = "basis";
        b.textContent = ev.basis;
        li.appendChild(b);
      }
      log.appendChild(li);
    });
    log.scrollTop = log.scrollHeight;
  }

  function afterMove(events) {
    if (!events.length) return;
    appendLog(events);
    if (events.some((e) => e.type === "damage")) {
      const s = $("threatSigil");
      s.classList.remove("hit");
      void s.offsetWidth; // restart animation
      s.classList.add("hit");
    }
    renderEncounter(events.some((e) => e.type === "reveal" && e.text.startsWith("New fact")));
    if (state.status !== "active") setTimeout(showVerdict, 500);
  }

  // ==========================================================
  // 5. VERDICT (case resolution, PRD §7 step 5)
  // ==========================================================
  function showVerdict() {
    const won = state.status === "won";
    const c = state.caseDef;
    let rankUp = "";
    if (won) {
      const before = rankFor(profile.wins);
      profile.wins += 1;
      profile.won[c.id] = true;
      profile.history.push({ caseId: c.id, name: c.name, turns: state.turn, jp: state.jp, date: new Date().toISOString() });
      profile.history = profile.history.slice(-50);
      saveProfile();
      const after = rankFor(profile.wins);
      if (after > before) rankUp = `<p style="color:var(--gold-bright);margin-top:10px">Promoted to <strong>${esc(RANKS[after].name)}</strong>!</p>`;
      renderRank();
    }
    $("verdictBody").innerHTML = `
      <div class="big" aria-hidden="true">${won ? "⚖️" : "📜"}</div>
      <h2 id="verdictTitle">${won ? "Case Won" : "Case Dismissed"}</h2>
      <p class="muted" style="margin-top:6px">${esc(c.name)} · ${state.turn} turns · ${state.jp} Juris Power left</p>
      ${won
        ? "<p style=\"margin-top:14px\">Every element was proven with the correct statute. Trial logged to your history.</p>"
        : "<p style=\"margin-top:14px\">Misapplied statutes and the docket clock drained your Juris Power. Review the elements and try again.</p>"}
      ${rankUp}
      <div class="verdict-actions">
        <button class="btn btn-gold" type="button" id="verdictDocket">Back to Docket</button>
        <button class="btn btn-ghost" type="button" id="verdictRetry">${won ? "Replay case" : "Retry case"}</button>
      </div>`;
    openModal("verdictModal");
    $("verdictDocket").onclick = () => { closeModal("verdictModal"); showDocket(); };
    $("verdictRetry").onclick = () => { closeModal("verdictModal"); startCase(c.id); };
    $("verdictDocket").focus();
  }

  // ==========================================================
  // 6. INSPECT STATUTE MODAL (PRD §4.1 Deep Inspection)
  // ==========================================================
  async function inspect(lawId) {
    $("inspectBody").innerHTML = '<p class="muted">Retrieving Gazette record…</p>';
    openModal("inspectModal");
    const law = await JurisAPI.getLaw(lawId);
    if (!law) {
      $("inspectBody").innerHTML = '<p class="muted">This statute could not be loaded.</p>';
      return;
    }
    const card = JurisCards.toHeroCard(law);
    const fine = law.min_fine_php ? `₱${Number(law.min_fine_php).toLocaleString()}` : "None / Discretionary";
    // Only link to http(s) sources
    const safeUrl = /^https?:\/\//i.test(law.source_url || "") ? law.source_url : null;
    $("inspectBody").innerHTML = `
      <p class="eyebrow">${esc(law.category)} · ${esc(law.year)} · ${esc(law.status)}</p>
      <h2 id="inspectTitle">${esc(law.ra_number)}: ${esc(law.plain_title)}</h2>
      <p class="muted" style="font-style:italic">"${esc(law.official_title)}"</p>
      <div class="meta-grid">
        <div><span>Power (PWR)</span><strong>${card.pwr}</strong></div>
        <div><span>Defense (DEF)</span><strong>${card.def}</strong></div>
        <div><span>Base minimum fine</span><strong>${esc(fine)}</strong></div>
        <div><span>Sections · Reading time</span><strong>${esc(law.total_sections)} · ${esc(law.reading_time_minutes)} min</strong></div>
        <div><span>Enacting President</span><strong>${esc(law.enacting_president)}</strong></div>
        <div><span>Importance</span><strong>${esc(law.importance_rating)}/5</strong></div>
      </div>
      <h4>Statutory Ability (TL;DR)</h4><p>${esc(law.tldr_summary)}</p>
      <h4>Full Breakdown</h4><p>${esc(law.full_breakdown)}</p>
      <h4>Why It Matters</h4><p>${esc(law.why_it_matters)}</p>
      <h4>Example Scenario</h4><p>${esc(law.example_scenario)}</p>
      <h4>Penalties</h4><p>${esc(law.penalties)}</p>
      <h4>Target Audience</h4><p>${esc(law.target_audience)}</p>
      ${safeUrl ? `<h4>Official Source</h4><p><a href="${esc(safeUrl)}" target="_blank" rel="noopener noreferrer">Read the Official Gazette record →</a></p>` : ""}`;
  }

  // ==========================================================
  // 7. SEARCH PRECEDENT MODAL (calls JurisAPI.searchLaws, PRD §6)
  // ==========================================================
  function openSearch() {
    $("searchResults").innerHTML = "";
    $("searchInput").value = "";
    $("replaceHint").classList.toggle("hidden", state.party.length < JurisEngine.RULES.partySize);
    openModal("searchModal");
    $("searchInput").focus();
  }

  async function runSearch(query) {
    $("searchResults").innerHTML = '<p class="muted">Searching the codex…</p>';
    const results = await JurisAPI.searchLaws(query);
    if (!results.length) {
      $("searchResults").innerHTML = '<p class="muted">No statutes matched. Try a broader keyword.</p>';
      return;
    }
    const inParty = new Set(state.party.map((c) => String(c.id)));
    $("searchResults").innerHTML = results.map((law) => `
      <button class="search-result" type="button" data-draft="${esc(law.id)}" ${inParty.has(String(law.id)) ? "disabled" : ""}>
        <strong>${esc(law.ra_number)}</strong> · ${esc(law.plain_title)}
        <span>${esc(law.category)}${inParty.has(String(law.id)) ? " · already in party" : ""}</span>
      </button>`).join("");
    $("searchResults").querySelectorAll("[data-draft]").forEach((btn) => {
      btn.addEventListener("click", () => chooseDraft(results.find((l) => String(l.id) === btn.dataset.draft)));
    });
  }

  function chooseDraft(law) {
    if (!law) return;
    closeModal("searchModal");
    if (state.party.length >= JurisEngine.RULES.partySize) {
      pendingDraft = law;
      renderEncounter();
      showToast(`Choose a party card to discard for ${law.ra_number}.`);
      return;
    }
    afterMove(JurisEngine.draftLaw(state, law));
  }

  // ==========================================================
  // 8. EVENT WIRING
  // ==========================================================
  $("docketList").addEventListener("click", (e) => {
    const tile = e.target.closest("[data-case]");
    if (tile) startCase(tile.dataset.case);
  });

  $("partyHand").addEventListener("click", (e) => {
    if (!state) return;
    const inspectBtn = e.target.closest("[data-inspect]");
    if (inspectBtn) return void inspect(inspectBtn.dataset.inspect);
    if (pendingDraft) {
      const cardEl = e.target.closest("[data-card]");
      if (cardEl) {
        const law = pendingDraft;
        pendingDraft = null;
        afterMove(JurisEngine.draftLaw(state, law, cardEl.dataset.card));
      }
      return;
    }
    const invokeBtn = e.target.closest("[data-invoke]");
    if (invokeBtn) afterMove(JurisEngine.invokeHero(state, invokeBtn.dataset.invoke));
  });

  $("actionRow").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn || !state) return;
    if (btn.dataset.action === "search") return void openSearch();
    const events = JurisEngine.playAction(state, btn.dataset.action);
    // The card wasn't spent (nothing to do) — say so without a log entry
    if (events.length && events[0].noop) return void showToast(events[0].text);
    afterMove(events);
  });

  $("searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const q = $("searchInput").value.trim();
    if (q) runSearch(q);
  });

  $("backToDocket").addEventListener("click", () => {
    if (state && state.status === "active" && state.turn > 0 && !confirm("Abandon this trial? Progress in this case will be lost.")) return;
    showDocket();
  });

  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (modal.id === "verdictModal") return; // verdict needs an explicit choice
      if (e.target === modal || e.target.closest("[data-close]")) modal.classList.add("hidden");
    });
  });

  window.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    ["inspectModal", "searchModal"].forEach(closeModal);
    if (pendingDraft) {
      pendingDraft = null;
      renderEncounter();
    }
  });

  // ==========================================================
  // 9. BOOT — fetch the codex (live or cached), then show the docket
  // ==========================================================
  (async function boot() {
    $("docketList").innerHTML = '<p class="muted">Opening the Legal Codex…</p>';
    const started = performance.now();
    laws = await JurisAPI.getLaws();
    const live = JurisAPI.source === "live";
    $("codexDot").className = `dot ${live ? "live" : "cache"}`;
    $("codexLabel").textContent = live ? `Live codex · ${laws.length} laws` : `Offline codex · ${laws.length} laws`;
    $("codexPill").title = live
      ? "Statutes loaded from the L-Lawliet API (/api/v1/laws)"
      : "API unreachable — using the cached codex bundled with the game";
    if (!laws.length) {
      $("docketList").innerHTML = '<p class="muted">The Legal Codex is unavailable. Please try again later.</p>';
      return;
    }
    renderDocket();
    console.info(`[Arena] Codex ready (${JurisAPI.source}) in ${Math.round(performance.now() - started)}ms`);

    // Deep link: arena.html?case=<id>
    const caseParam = new URLSearchParams(location.search).get("case");
    if (caseParam && JURIS_CASES.some((c) => c.id === caseParam)) startCase(caseParam);
  })();
});
