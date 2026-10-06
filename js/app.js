/* ==========================================================
   JurisCards Arena — app.js
   JurisAPI: singleton client adapter for the L-Lawliet Legal Codex (PRD §3, §8.1)
   JurisCards: maps statute records -> Hero Cards (PRD §4.1) + party synergies (PRD §4.2)
   ========================================================== */
(function (global) {
  "use strict";

  // ==========================================================
  // 1. CONFIGURATION
  // Points directly to the primary L-Lawliet backend
  // ==========================================================
const API_URL = (global.JURIS_CONFIG && global.JURIS_CONFIG.apiBase) 
  || "https://l-lawliet-three.vercel.app/api/v1"; 
const API_KEY = (global.JURIS_CONFIG && global.JURIS_CONFIG.apiKey) 
  || "student-api-key-123";
const TIMEOUT_MS = (global.JURIS_CONFIG && global.JURIS_CONFIG.timeoutMs) 
  || 6000;

  // Escape API/user text before putting it into innerHTML (prevents XSS)
  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // ==========================================================
  // 2. JurisAPI — live codex with seamless offline fallback
  // ==========================================================
  const JurisAPI = {
    source: "pending", // "live" | "cache"
    _laws: null,

    _cachedLaws() {
      const cache = global.JURIS_CODEX_CACHE;
      return cache && Array.isArray(cache.laws) ? cache.laws : [];
    },

async _get(path) {
      if (global.location && global.location.protocol === "file:" && API_URL.startsWith("/")) {
        throw new Error("No API available from file://");
      }
      const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      const timer = controller ? setTimeout(() => controller.abort(), TIMEOUT_MS) : null;
      try {
        const res = await fetch(API_URL + path, {
          headers: { 
            "x-api-key": API_KEY,
            "Content-Type": "application/json"
          },
          signal: controller ? controller.signal : undefined,
        });
        if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);
        return await res.json();
      } finally {
        if (timer) clearTimeout(timer);
      }
    },

    /** GET /api/v1/laws — full statutory dataset */
    async getLaws() {
      if (this._laws) return this._laws;
      try {
        const result = await this._get("/laws");
        // Handles both { count, laws: [...] } and a direct array
        const laws = Array.isArray(result) ? result : result.laws || [];
        if (!laws.length) throw new Error("Empty codex payload");
        this.source = "live";
        this._laws = laws;
      } catch (err) {
        console.warn("[JurisAPI] Live codex unreachable, using cached dataset:", err.message);
        this.source = "cache";
        this._laws = this._cachedLaws();
      }
      return this._laws;
    },

    /** GET /api/v1/laws/{id} — full record for statute inspection */
    async getLaw(id) {
      try {
        const law = await this._get(`/laws/${encodeURIComponent(id)}`);
        if (law && law.id != null) return law;
        throw new Error("Malformed law payload");
      } catch (err) {
        const laws = this._laws || this._cachedLaws();
        return laws.find((l) => String(l.id) === String(id)) || null;
      }
    },

    /** GET /api/v1/laws/search?q= — powers search functionality */
    async searchLaws(query) {
      const q = String(query || "").trim();
      if (!q) return [];
      try {
        const result = await this._get(`/laws/search?q=${encodeURIComponent(q)}`);
        return Array.isArray(result) ? result : result.results || [];
      } catch (err) {
        // Fallback search across local dataset
        const needle = q.toLowerCase();
        const laws = this._laws || this._cachedLaws();
        return laws.filter((law) =>
          [
            law.ra_number, law.official_title, law.plain_title, law.category, law.year,
            law.status, law.enacting_president, law.target_audience, law.tldr_summary,
            law.full_breakdown, law.why_it_matters, law.example_scenario, law.penalties,
          ].join(" ").toLowerCase().includes(needle)
        );
      }
    },
  };

  // Expose JurisAPI globally
  global.JurisAPI = JurisAPI;
  global.escapeHtml = escapeHtml;


  // ==========================================================
  // 3. HERO CARD MAPPING (PRD §4.1)
  // ==========================================================
  const CLASSES = {
    "Technology & Crime":       { key: "tech",    icon: "⌁", label: "Technology & Crime" },
    "Finance & Taxes":          { key: "finance", icon: "₱", label: "Finance & Taxes" },
    "Governance & Business":    { key: "gov",     icon: "⚖", label: "Governance & Business" },
    "Social & Welfare":         { key: "social",  icon: "❦", label: "Social & Welfare" },
    "Environment":              { key: "env",     icon: "❧", label: "Environment" },
    "Education & Civil Rights": { key: "edu",     icon: "✎", label: "Education & Civil Rights" },
  };

  /** PRD formula: Math.round(min_fine_php / 4000) + (importance * 6) */
  function computePower(law) {
    return Math.round((Number(law.min_fine_php) || 0) / 4000) + (Number(law.importance_rating) || 0) * 6;
  }

  /** Defense / Complexity from total_sections & reading_time_minutes (capped at 99). */
  function computeDefense(law) {
    const sections = Number(law.total_sections) || 0;
    const minutes = Number(law.reading_time_minutes) || 0;
    return Math.min(99, Math.round(sections / 4) + minutes * 2);
  }

  function toHeroCard(law) {
    const cls = CLASSES[law.category] || { key: "misc", icon: "§", label: law.category || "Uncategorised" };
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
      law, // full record, kept for the inspection modal
    };
  }

  // ==========================================================
  // 4. PARTY SYNERGIES (PRD §4.2)
  // ==========================================================
  const SYNERGIES = [
    {
      id: "digital",
      name: "Digital Protection",
      icon: "⚡",
      requires: ["RA 10175", "RA 11313"],
      classes: "Technology & Crime + Social & Welfare",
      effect: "+15% Strike Power against digital threats · +1 Request Clarification per encounter",
    },
    {
      id: "fiscal",
      name: "Fiscal Due Process",
      icon: "🛡",
      requires: ["RA 10963", "RA 11032"],
      classes: "Finance & Taxes + Governance & Business",
      effect: "Passive Exception Shield: the first misapplication penalty each encounter is blocked",
    },
  ];

  function activeSynergies(party) {
    const ras = new Set(party.map((c) => c.ra));
    return SYNERGIES.filter((s) => s.requires.every((ra) => ras.has(ra)));
  }

  global.JurisAPI = JurisAPI;
  global.JurisCards = { CLASSES, SYNERGIES, computePower, computeDefense, toHeroCard, activeSynergies, escapeHtml };
})(typeof window !== "undefined" ? window : globalThis);
