/* ==========================================================
   JurisCards Arena: app.js
   JurisAPI: reads laws from the L-Lawliet API (through ArenaSession, so a signed-in
             player's token is sent and they get every law; guests get the first 10).
   JurisCards: turns a law record into a Hero Card, and the party synergies.
   ========================================================== */
(function (global) {
  "use strict";

  const TIMEOUT_MS = 8000;

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // ==========================================================
  // 1. JurisAPI
  // ==========================================================
  const JurisAPI = {
    _laws: null,
    total: 0,      // laws in the whole database
    access: null,  // "guest" or "full"

    async _get(path) {
      const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      const timer = controller ? setTimeout(() => controller.abort(), TIMEOUT_MS) : null;
      try {
        const res = await global.ArenaSession.api(path, { signal: controller ? controller.signal : undefined });
        if (!res.ok) throw new Error(await global.ArenaSession.errorMessage(res));
        return await res.json();
      } finally {
        if (timer) clearTimeout(timer);
      }
    },

    /** GET /laws. Throws if the API cannot be reached. */
    async getLaws() {
      if (this._laws) return this._laws;
      const result = await this._get("/laws");
      this._laws = result.laws || [];
      this.total = result.total || this._laws.length;
      this.access = result.access || "guest";
      return this._laws;
    },

    /** GET /laws/{id}: the full record for the Inspect window. */
    async getLaw(id) {
      try {
        return await this._get(`/laws/${encodeURIComponent(id)}`);
      } catch (err) {
        return (this._laws || []).find((l) => String(l.id) === String(id)) || null;
      }
    },

    /** GET /laws/draw: a new random set from L-Lawliet's full list (laws without a guide)
        on every call, for the "Name that law" bonus round. Never downloads the whole list. */
    async drawLaws(count = 12) {
      const result = await this._get(`/laws/draw?count=${encodeURIComponent(count)}`);
      return result.laws || [];
    },

    /** GET /laws/search?q= for Search Precedent. Guests only search their 10 laws. */
    async searchLaws(query) {
      const q = String(query || "").trim();
      if (!q) return [];
      const result = await this._get(`/laws/search?q=${encodeURIComponent(q)}`);
      return result.results || [];
    },
  };

  // ==========================================================
  // 2. HERO CARDS
  // ==========================================================
  const CLASSES = {
    "Technology & Crime":       { key: "tech",    icon: "TC", label: "Technology & Crime" },
    "Finance & Taxes":          { key: "finance", icon: "FT", label: "Finance & Taxes" },
    "Governance & Business":    { key: "gov",     icon: "GB", label: "Governance & Business" },
    "Social & Welfare":         { key: "social",  icon: "SW", label: "Social & Welfare" },
    "Environment":              { key: "env",     icon: "EN", label: "Environment" },
    "Education & Civil Rights": { key: "edu",     icon: "EC", label: "Education & Civil Rights" },
  };

  /** Power: Math.round(min_fine_php / 4000) + importance * 6 */
  function computePower(law) {
    return Math.round((Number(law.min_fine_php) || 0) / 4000) + (Number(law.importance_rating) || 0) * 6;
  }

  /** Defense from total_sections and reading_time_minutes (capped at 99). */
  function computeDefense(law) {
    const sections = Number(law.total_sections) || 0;
    const minutes = Number(law.reading_time_minutes) || 0;
    return Math.min(99, Math.round(sections / 4) + minutes * 2);
  }

  function toHeroCard(law) {
    const cls = CLASSES[law.category] || { key: "misc", icon: "RA", label: law.category || "Uncategorised" };
    return {
      id: law.id,
      ra: law.ra_number,
      name: law.plain_title,
      officialTitle: law.official_title,
      cls,
      category: law.category,
      year: law.year,
      status: law.status,
      pwr: computePower(law),
      def: computeDefense(law),
      ability: law.tldr_summary,
      breakdown: law.full_breakdown,
      law, // full record, kept for the Inspect window
    };
  }

  // ==========================================================
  // 3. PARTY SYNERGIES
  // ==========================================================
  const SYNERGIES = [
    {
      id: "digital",
      name: "Digital Protection",
      requires: ["RA 10175", "RA 11313"],
      classes: "Technology & Crime + Social & Welfare",
      effect: "+15% Strike Power against digital threats, +1 Request Clarification per case",
    },
    {
      id: "fiscal",
      name: "Fiscal Due Process",
      requires: ["RA 10963", "RA 11032"],
      classes: "Finance & Taxes + Governance & Business",
      effect: "Passive Exception Shield: the first misapplication penalty each case is blocked",
    },
  ];

  function activeSynergies(party) {
    const ras = new Set(party.map((c) => c.ra));
    return SYNERGIES.filter((s) => s.requires.every((ra) => ras.has(ra)));
  }

  global.JurisAPI = JurisAPI;
  global.JurisCards = { CLASSES, SYNERGIES, computePower, computeDefense, toHeroCard, activeSynergies, escapeHtml };
})(typeof window !== "undefined" ? window : globalThis);
