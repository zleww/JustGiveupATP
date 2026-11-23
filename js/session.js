/* Shared code for every JurisCards Arena page: where the API is, the login session,
   the account menu in the top bar, and the guest limits.

   The game has no database of its own. Laws, accounts and saved game results all live in
   the L-Lawliet database and go through the L-Lawliet API, so one account works on
   L-Lawliet, JurisCards and the Arena. */
(function (global) {
  "use strict";

  const PRODUCTION_API = "https://l-lawliet-three.vercel.app/api/v1";
  const LOCAL_API = "http://127.0.0.1:8000/api/v1"; // scripts/dev.py in the L-Lawliet folder
  const isLocal = ["localhost", "127.0.0.1"].includes(global.location.hostname);
  const API = isLocal ? LOCAL_API : PRODUCTION_API;

  // Guests play Tier 1 only. The API also limits guests to 10 laws, so a few Tier 1 cases
  // that need other laws are locked for them too.
  const GUEST_TIERS = [1];

  // ---------------------------------------------------------------
  // Session. sessionStorage, so closing the tab signs you out.
  // The API checks the token on every request; nothing here is trusted.
  // ---------------------------------------------------------------
  const KEY = "arena_auth";

  function getAuth() {
    try { return JSON.parse(sessionStorage.getItem(KEY)) || null; } catch (e) { return null; }
  }
  function saveSession(data) {
    const u = data.user || {};
    try {
      sessionStorage.setItem(KEY, JSON.stringify({
        token: data.token,
        id: u.id,
        username: u.username || data.username,
        role: u.role || data.role,
        display_name: u.display_name || null,
        has_password: u.has_password !== false,
      }));
    } catch (e) { /* storage blocked: the user stays a guest */ }
  }
  function updateUser(profile) {
    const auth = getAuth();
    if (!auth) return;
    try { sessionStorage.setItem(KEY, JSON.stringify({ ...auth, display_name: profile.display_name })); } catch (e) { /* ignore */ }
  }
  function signOut() { try { sessionStorage.removeItem(KEY); } catch (e) { /* ignore */ } }
  function isAdmin() { const a = getAuth(); return !!a && a.role === "admin"; }
  function displayName() { const a = getAuth(); return a ? (a.display_name || a.username) : null; }

  function currentPage() {
    return (global.location.pathname.split("/").pop() || "index.html") + global.location.search;
  }

  // fetch() against the API with the token attached. A 401 while signed in means the token
  // expired or was revoked, so the player goes back to the sign-in page.
  async function api(path, options = {}) {
    const auth = getAuth();
    const headers = { ...(options.headers || {}) };
    if (auth && auth.token) headers.Authorization = `Bearer ${auth.token}`;
    let body = options.body;
    if (body && typeof body !== "string") body = JSON.stringify(body);
    if (body) headers["Content-Type"] = "application/json";
    const res = await fetch(API + path, { ...options, headers, body });
    if (res.status === 401 && auth) {
      signOut();
      global.location.href = "login.html?expired=1&next=" + encodeURIComponent(currentPage());
      throw new Error("Login expired");
    }
    return res;
  }

  async function errorMessage(res) {
    try {
      const body = await res.json();
      if (typeof body.detail === "string") return body.detail;
      if (Array.isArray(body.detail)) return body.detail.map((e) => String(e.msg || "").replace(/^Value error, /, "")).join(" ");
    } catch (e) { /* fall through */ }
    return `Request failed (HTTP ${res.status}).`;
  }

  async function getJson(path) {
    const res = await api(path);
    if (!res.ok) throw new Error(await errorMessage(res));
    return res.json();
  }

  function requireLogin() {
    if (getAuth()) return true;
    global.location.href = "login.html?next=" + encodeURIComponent(currentPage());
    return false;
  }

  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function timeAgo(iso) {
    if (!iso) return "";
    const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return "just now";
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} min ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} hr ago`;
    const d = Math.floor(h / 24);
    if (d === 1) return "yesterday";
    if (d < 30) return `${d} days ago`;
    return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  }

  // Ranks go by the number of different cases won.
  const RANKS = [
    { name: "Law Student", wins: 0 },
    { name: "Bar Reviewee", wins: 2 },
    { name: "Junior Associate", wins: 4 },
    { name: "Senior Associate", wins: 7 },
    { name: "Partner", wins: 10 },
    { name: "Justice", wins: 13 },
  ];
  function rankIndex(casesWon) {
    let idx = 0;
    RANKS.forEach((r, i) => { if (casesWon >= r.wins) idx = i; });
    return idx;
  }

  function guestNotice(message) {
    if (getAuth()) return "";
    const next = encodeURIComponent(currentPage());
    return `
      <div class="guest-note" role="note">
        <span>${esc(message)}</span>
        <span class="guest-actions">
          <a href="login.html?next=${next}">Sign in</a>
          <a href="login.html?signup=1&next=${next}">Create a free account</a>
        </span>
      </div>`;
  }

  // ---------------------------------------------------------------
  // Top bar: Sign in for guests, account menu when signed in.
  // Pages put <div class="account" data-account></div> in the top bar.
  // ---------------------------------------------------------------
  function renderAccount() {
    const slot = document.querySelector("[data-account]");
    if (!slot) return;
    const auth = getAuth();
    if (!auth) {
      slot.innerHTML = `<a class="btn btn-gold btn-sm" href="login.html?next=${encodeURIComponent(currentPage())}">Sign in</a>`;
      return;
    }
    const name = displayName();
    slot.innerHTML = `
      <button type="button" class="menu-btn" aria-haspopup="true" aria-expanded="false">
        <span class="avatar">${esc(name.charAt(0).toUpperCase())}</span>
        <span class="menu-name">${esc(name)}</span>
      </button>
      <div class="menu" role="menu" hidden>
        <div class="menu-head"><strong>${esc(name)}</strong><span>@${esc(auth.username)}${auth.role === "admin" ? " · admin" : ""}</span></div>
        <a role="menuitem" href="profile.html">Profile</a>
        <a role="menuitem" href="settings.html">Settings</a>
        ${auth.role === "admin" ? '<a role="menuitem" href="admin.html">Admin</a>' : ""}
        <button type="button" role="menuitem" class="signout">Sign out</button>
      </div>`;
    const btn = slot.querySelector(".menu-btn");
    const menu = slot.querySelector(".menu");
    const close = () => { menu.hidden = true; btn.setAttribute("aria-expanded", "false"); };
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.hidden = !menu.hidden;
      btn.setAttribute("aria-expanded", String(!menu.hidden));
    });
    document.addEventListener("click", (e) => { if (!slot.contains(e.target)) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    slot.querySelector(".signout").addEventListener("click", () => { signOut(); global.location.href = "index.html"; });
  }

  // ---------------------------------------------------------------
  // Phone menu: Play / Leaderboard move into a panel behind a menu button.
  // ---------------------------------------------------------------
  function renderMobileNav() {
    const bar = document.querySelector(".topbar");
    const nav = bar && bar.querySelector(".topnav");
    if (!nav || bar.querySelector(".burger")) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "burger";
    btn.setAttribute("aria-label", "Open menu");
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = "<span></span><span></span><span></span>";

    const panel = document.createElement("nav");
    panel.className = "mobile-nav";
    panel.setAttribute("aria-label", "Pages");
    panel.hidden = true;
    const here = global.location.pathname.split("/").pop() || "index.html";
    const links = [["index.html", "Home"], ...[...nav.querySelectorAll("a")].map((a) => [a.getAttribute("href"), a.textContent.trim()])];
    panel.innerHTML = links.map(([href, label]) =>
      `<a href="${esc(href)}"${href === here ? ' aria-current="page"' : ""}>${esc(label)}</a>`).join("");

    bar.querySelector(".topbar-meta").appendChild(btn);
    bar.appendChild(panel);

    const set = (open) => {
      panel.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      btn.classList.toggle("open", open);
    };
    btn.addEventListener("click", (e) => { e.stopPropagation(); set(panel.hidden); });
    document.addEventListener("click", (e) => { if (!bar.contains(e.target)) set(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") set(false); });
    global.addEventListener("resize", () => { if (global.innerWidth > 620) set(false); });
  }

  global.ArenaSession = {
    API, GUEST_TIERS, RANKS,
    getAuth, saveSession, updateUser, signOut, isAdmin, displayName, requireLogin,
    api, getJson, errorMessage, guestNotice, esc, timeAgo, rankIndex,
  };

  const start = () => { renderAccount(); renderMobileNav(); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})(window);
