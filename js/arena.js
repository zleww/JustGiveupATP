/* ==========================================================
   JurisCards Arena — arena.js
   UI controller: docket screen, encounter screen, modals, profile/rank persistence.
   Game rules live in engine.js; this file only renders state and forwards player input.
   ========================================================== */
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const { JurisAPI, JurisCards, JurisEngine, JURIS_CASES, JURIS_TIERS, ArenaSession } = window;
  const { getAuth, api, getJson, errorMessage, guestNotice, RANKS, rankIndex, GUEST_TIERS } = ArenaSession;
  const esc = JurisCards.escapeHtml;
  const $ = (id) => document.getElementById(id);

  // ==========================================================
  // 1. RECORD & RANK
  // Signed-in players: saved in the L-Lawliet database through the API.
  // Guests: kept in sessionStorage, so it is gone when the tab closes.
  // ==========================================================
  const signedIn = !!getAuth();
  const GUEST_KEY = "arena_guest_record";
  const emptyRecord = () => ({ cases_won: [], trials: 0, wins: 0, history: [] });
  let record = emptyRecord();
  let prefs = { confirm_abandon: true, reduce_motion: false, hide_won: false };

  function loadGuestRecord() {
    try { return Object.assign(emptyRecord(), JSON.parse(sessionStorage.getItem(GUEST_KEY))); } catch (e) { return emptyRecord(); }
  }
  function saveGuestRecord() {
    try { sessionStorage.setItem(GUEST_KEY, JSON.stringify(record)); } catch (e) { /* storage blocked */ }
  }
  function wonIds() { return new Set(record.cases_won.map((c) => c.case_id)); }

  // Record a finished trial locally, so the screen updates at once.
  function addToRecord(entry) {
    record.trials += 1;
    record.history.unshift(entry);
    record.history = record.history.slice(0, 20);
    if (!entry.won) return;
    record.wins += 1;
    const known = record.cases_won.find((c) => c.case_id === entry.case_id);
    if (known) known.wins += 1;
    else record.cases_won.push({ case_id: entry.case_id, wins: 1, best_turns: entry.turns, best_jp: entry.jp_left });
  }

  let laws = [];
  let lawRas = new Set();
  let state = null;
  let pendingDraft = null; // law chosen in Search Precedent while the party is full

  // Short code shown on a case tile and in the threat panel, e.g. "BD" for The Bureaucratic Delay.
  function caseCode(c) {
    return c.name.replace(/^The\s+/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
  }

  // Why a case cannot be played right now, or null if it can.
  function lockReason(c) {
    if (!signedIn && !GUEST_TIERS.includes(c.tier)) return "Sign in to play Tier 2 and 3";
    const missing = c.elements.some((el) => el.counters && !el.counters.some((ra) => lawRas.has(ra)));
    if (missing) return signedIn ? "A law it needs is not in the database" : "Needs laws outside the guest preview";
    return null;
  }

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
    const casesWon = wonIds().size;
    const idx = rankIndex(casesWon);
    const rank = RANKS[idx];
    const next = RANKS[idx + 1];
    $("rankPill").textContent = rank.name;
    $("rankName").textContent = rank.name;
    if (next) {
      const span = next.wins - rank.wins;
      $("rankBar").style.width = `${Math.round(((casesWon - rank.wins) / span) * 100)}%`;
      $("rankNext").textContent = `${casesWon} of ${JURIS_CASES.length} cases won. ${next.wins - casesWon} more to ${next.name}.`;
    } else {
      $("rankBar").style.width = "100%";
      $("rankNext").textContent = `All ${JURIS_CASES.length} cases won. Highest rank reached.`;
    }
    $("rankSaved").textContent = signedIn ? "Saved to your account." : "Guest: not saved after you close this tab.";
  }

  // ==========================================================
  // 3. DOCKET SCREEN
  // ==========================================================
  // Docket order per tier after "Reshuffle docket" (case ids); empty = the usual order.
  const docketOrder = {};

  function orderedCases(t) {
    const cases = JURIS_CASES.filter((c) => c.tier === t);
    const order = docketOrder[t];
    if (!order) return cases;
    const byId = Object.fromEntries(cases.map((c) => [c.id, c]));
    return order.map((id) => byId[id]).filter(Boolean);
  }

  // Shuffle the playable cases inside each tier; locked cases keep their places.
  function reshuffleDocket() {
    [1, 2, 3].forEach((t) => {
      const cases = orderedCases(t);
      const open = cases.filter((c) => !lockReason(c));
      for (let i = open.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [open[i], open[j]] = [open[j], open[i]];
      }
      let k = 0;
      docketOrder[t] = cases.map((c) => (lockReason(c) ? c : open[k++]).id);
    });
    renderDocket();
    showToast("Docket reshuffled.");
  }

  function renderDocket() {
    const won = wonIds();
    let hidden = 0;
    $("docketList").innerHTML = [1, 2, 3].map((t) => {
      const cases = orderedCases(t).filter((c) => {
        const skip = prefs.hide_won && won.has(c.id);
        if (skip) hidden += 1;
        return !skip;
      });
      if (!cases.length) return "";
      return `
        <section class="tier-block">
          <div class="tier-head">
            <span class="tier-badge t${t}">Tier ${t}</span>
            <h2>${esc(JURIS_TIERS[t].label.split("·")[1] || JURIS_TIERS[t].name)}</h2>
          </div>
          <div class="case-grid">
            ${cases.map((c) => {
              const lock = lockReason(c);
              return `
              <button class="case-tile${lock ? " locked" : ""}" type="button" data-case="${esc(c.id)}" ${lock ? `aria-disabled="true" title="${esc(lock)}"` : ""}>
                <span class="sigil" aria-hidden="true">${esc(caseCode(c))}</span>
                <h3>${esc(c.name)}</h3>
                <p>${esc(c.docket)}</p>
                <span class="case-meta">
                  <span class="tag">${c.hp} HP</span>
                  <span class="tag">${c.elements.length} elements</span>
                  ${c.digital ? '<span class="tag digital">Digital threat</span>' : ""}
                  ${won.has(c.id) ? '<span class="tag won">Won</span>' : ""}
                  ${lock ? `<span class="tag locked">${esc(lock)}</span>` : ""}
                </span>
              </button>`;
            }).join("")}
          </div>
        </section>`;
    }).join("") + (hidden ? `<p class="muted">${hidden} won case${hidden === 1 ? " is" : "s are"} hidden. You can show them again in Settings.</p>` : "");

    $("synergyRef").innerHTML = JurisCards.SYNERGIES.map((s) => `
      <div><strong>${esc(s.name)}</strong>${esc(s.requires.join(" + "))}: ${esc(s.effect)}</div>`).join("");

    const names = Object.fromEntries(JURIS_CASES.map((c) => [c.id, c.name]));
    $("historyList").innerHTML = record.history.length
      ? record.history.map((h) => `
          <li>${esc(names[h.case_id] || h.case_id)} <strong class="${h.won ? "won-text" : "lost-text"}">${h.won ? "Won" : "Lost"}</strong>
            <span>${esc(ArenaSession.timeAgo(h.played_at))} · ${h.turns} turns · ${h.jp_left} JP left</span></li>`).join("")
      : '<li style="border-color:var(--border-strong)" class="muted">No trials yet.</li>';

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
    const lock = lockReason(caseDef);
    if (lock) {
      showToast(lock + ".");
      return;
    }
    state = JurisEngine.createEncounter({ caseDef, laws });
    pendingDraft = null;
    $("battleLog").innerHTML = "";
    $("docketView").classList.add("hidden");
    $("encounterView").classList.remove("hidden");
    $("threatPanel").style.setProperty("--tier-color", `var(--tier-${caseDef.tier})`);
    appendLog([{ type: "info", text: `Trial docket opened: ${caseDef.name}. You drafted ${state.party.map((c) => c.ra).join(", ")}.` }]);
    if (state.synergies.length) {
      appendLog(state.synergies.map((s) => ({ type: "shield", text: `${s.name} synergy active.` })));
    }
    renderEncounter();
    window.scrollTo({ top: 0 });
  }

  function elementHTML(el, i) {
    const n = `<span class="el-num">E${i + 1}</span>`;
    if (el.established) {
      return `<div class="element established">
        <div class="el-head">${n}<span>Proven: ${esc(el.label)}</span></div>
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

    $("threatSigil").textContent = caseCode(c);
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
      .map((s) => `<span class="synergy-chip" title="${esc(s.effect)}">${esc(s.name)}</span>`).join("");

    $("partyHand").innerHTML = state.party.map(heroCardHTML).join("");
    $("partyHint").textContent = pendingDraft
      ? `Choose a card to discard for ${pendingDraft.ra_number} (Esc to cancel).`
      : "Invoke a statute that establishes an open element.";
    document.querySelectorAll("#partyHand .hero-card").forEach((el) => el.classList.toggle("replace-mode", !!pendingDraft));

    const active = state.status === "active";
    $("actionRow").innerHTML = Object.entries(JurisEngine.ACTION_META).map(([type, meta]) => `
      <button class="action-card" type="button" data-action="${type}" ${!active || !state.actions[type] ? "disabled" : ""}>
        <span class="ac-top"><span class="ac-name">${esc(meta.name)}</span><span class="ac-count">×${state.actions[type]}</span></span>
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
    const before = rankIndex(wonIds().size);
    const entry = { case_id: c.id, tier: c.tier, won, turns: state.turn, jp_left: Math.max(0, state.jp), played_at: new Date().toISOString() };
    addToRecord(entry);
    const after = rankIndex(wonIds().size);
    const rankUp = after > before
      ? `<p style="color:var(--gold-bright);margin-top:10px">Promoted to <strong>${esc(RANKS[after].name)}</strong>.</p>` : "";

    $("verdictBody").innerHTML = `
      <p class="eyebrow">${esc(state.tier.label)}</p>
      <h2 id="verdictTitle">${won ? "Case won" : "Case dismissed"}</h2>
      <p class="muted" style="margin-top:6px">${esc(c.name)} · ${state.turn} turns · ${state.jp} Juris Power left</p>
      ${won
        ? '<p style="margin-top:14px">Every element was proven with the correct statute.</p>'
        : '<p style="margin-top:14px">Misapplied statutes and the docket clock drained your Juris Power. Review the elements and try again.</p>'}
      ${rankUp}
      <p class="muted" id="saveNote" style="margin-top:10px"></p>
      <div class="bonus" id="bonusRound" aria-live="polite"></div>
      <div class="verdict-actions">
        <button class="btn btn-gold" type="button" id="verdictDocket">Back to docket</button>
        <button class="btn btn-ghost" type="button" id="verdictRetry">${won ? "Replay case" : "Retry case"}</button>
      </div>`;
    openModal("verdictModal");
    $("verdictDocket").onclick = () => { closeModal("verdictModal"); showDocket(); };
    $("verdictRetry").onclick = () => { closeModal("verdictModal"); startCase(c.id); };
    $("verdictDocket").focus();
    renderRank();
    startBonusRound();

    const note = $("saveNote");
    if (!signedIn) {
      saveGuestRecord();
      note.innerHTML = 'Guest result: kept until you close this tab. <a href="login.html?next=arena.html">Sign in</a> to save it and appear on the leaderboard.';
      return;
    }
    note.textContent = "Saving to your trial history...";
    const { played_at, ...body } = entry;
    api("/arena/results", { method: "POST", body })
      .then(async (res) => { note.textContent = res.ok ? "Saved to your trial history." : await errorMessage(res); })
      .catch(() => { note.textContent = "Could not save this result."; });
  }

  // ==========================================================
  // 5b. BONUS ROUND: "Name that law", 3 questions drawn at random from the full list
  // (about 1,200 national laws without a guide). Practice only: it does not change the result.
  // ==========================================================
  const BONUS_QUESTIONS = 3;

  function shuffled(list) {
    const arr = [...list];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  async function startBonusRound() {
    const box = $("bonusRound");
    if (!box) return;
    box.innerHTML = '<p class="muted">Drawing laws for the bonus round…</p>';
    let pool;
    try {
      pool = await JurisAPI.drawLaws(BONUS_QUESTIONS * 4);
    } catch (err) {
      box.innerHTML = "";
      return;
    }
    if (pool.length < 4) { box.innerHTML = ""; return; }
    const name = (l) => l.label || l.ra_number;
    const questions = pool.slice(0, BONUS_QUESTIONS).map((answer, q) => {
      const others = pool.filter((l) => l.id !== answer.id);
      const wrong = shuffled(others).slice(0, 3);
      return { answer, options: shuffled([answer, ...wrong]), n: q + 1 };
    });
    let right = 0;

    function show(i) {
      if (i >= questions.length) {
        box.innerHTML = `
          <p class="eyebrow">Bonus round</p>
          <p class="bonus-score">${right} of ${questions.length} correct</p>
          <p class="muted">Practice only, from the full list of Philippine laws. Each round draws new ones.</p>
          <button class="btn btn-ghost" type="button" id="bonusAgain">Another round</button>`;
        $("bonusAgain").onclick = startBonusRound;
        return;
      }
      const q = questions[i];
      box.innerHTML = `
        <p class="eyebrow">Bonus round · Name that law (${q.n} of ${questions.length})</p>
        <p class="bonus-title">"${esc(q.answer.official_title)}"</p>
        <div class="bonus-options" role="group" aria-label="Which law is it?">
          ${q.options.map((o) => `<button class="btn btn-ghost bonus-option" type="button" data-id="${esc(o.id)}">${esc(name(o))}</button>`).join("")}
        </div>
        <p class="bonus-feedback" id="bonusFeedback"></p>`;
      box.querySelectorAll(".bonus-option").forEach((btn) => {
        btn.onclick = () => {
          const ok = String(btn.dataset.id) === String(q.answer.id);
          if (ok) right++;
          box.querySelectorAll(".bonus-option").forEach((b) => {
            b.disabled = true;
            if (String(b.dataset.id) === String(q.answer.id)) b.classList.add("is-right");
            else if (b === btn) b.classList.add("is-wrong");
          });
          const year = q.answer.year ? `, ${esc(q.answer.year)}` : "";
          $("bonusFeedback").innerHTML = `${ok ? "Correct." : `It is ${esc(name(q.answer))}${year}.`}
            <button class="btn btn-gold bonus-next" type="button" id="bonusNext">${i + 1 < questions.length ? "Next" : "See score"}</button>`;
          $("bonusNext").onclick = () => show(i + 1);
          $("bonusNext").focus();
        };
      });
    }
    show(0);
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
      ${safeUrl ? `<h4>Official Source</h4><p><a href="${esc(safeUrl)}" target="_blank" rel="noopener noreferrer">Read the Official Gazette record</a></p>` : ""}`;
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
    let results;
    try {
      results = await JurisAPI.searchLaws(query);
    } catch (err) {
      $("searchResults").innerHTML = `<p class="muted">Search failed: ${esc(err.message)}</p>`;
      return;
    }
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
  $("reshuffleDocket").addEventListener("click", reshuffleDocket);

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
    if (state && state.status === "active" && state.turn > 0 && prefs.confirm_abandon && !confirm("Abandon this trial? Progress in this case will be lost.")) return;
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
  // 9. BOOT: load the laws (and the saved record when signed in), then show the docket
  // ==========================================================
  (async function boot() {
    $("docketList").innerHTML = '<p class="muted">Loading the laws...</p>';
    try {
      const requests = [JurisAPI.getLaws()];
      if (signedIn) requests.push(getJson("/arena/me"));
      const [lawList, saved] = await Promise.all(requests);
      laws = lawList;
      if (saved) {
        record = { cases_won: saved.cases_won, trials: saved.trials, wins: saved.wins, history: saved.history };
        prefs = saved.prefs;
      } else {
        record = loadGuestRecord();
      }
    } catch (err) {
      $("codexDot").className = "dot";
      $("codexLabel").textContent = "Laws unavailable";
      $("docketList").innerHTML = `<p class="muted">Could not load the laws from the L-Lawliet database. ${esc(err.message)} Please try again in a moment.</p>`;
      return;
    }
    lawRas = new Set(laws.map((l) => l.ra_number));
    document.body.classList.toggle("reduce-motion", !!prefs.reduce_motion);
    $("codexDot").className = "dot live";
    $("codexLabel").textContent = signedIn ? `${laws.length} laws` : `Guest: ${laws.length} of ${JurisAPI.total} laws`;
    $("codexPill").title = "Laws loaded from the L-Lawliet database";
    $("guestNote").innerHTML = guestNotice(
      `Playing as a guest: Tier 1 cases with ${laws.length} of ${JurisAPI.total} laws, and results are not saved.`);
    renderDocket();

    // Deep link: arena.html?case=<id>
    const caseParam = new URLSearchParams(location.search).get("case");
    if (caseParam && JURIS_CASES.some((c) => c.id === caseParam)) startCase(caseParam);
  })();
});
