// Everything specific to JurisCards Arena lives here. The sections only read this file.
// Facts come from the game itself; no invented players, ratings or testimonials.
import { BookOpenText, Gavel, Layers3, Share2, Swords, Trophy } from "lucide-react";
import type { Shot, SiteContent } from "./types";
import logo from "./assets/logo.svg";
import home from "./assets/shots/ar-home.webp";
import homeSm from "./assets/shots/ar-home-960.webp";
import arena from "./assets/shots/ar-arena.webp";
import arenaSm from "./assets/shots/ar-arena-960.webp";
import trial from "./assets/shots/ar-trial.webp";
import trialSm from "./assets/shots/ar-trial-960.webp";
import party from "./assets/shots/ar-party.webp";
import partySm from "./assets/shots/ar-party-960.webp";

const HOST = "just-give-up-atp.vercel.app";

const shots = {
  home: { src: home, small: homeSm, url: HOST,
    alt: "JurisCards Arena home page: 'Republic Acts are your heroes. Legal problems are the monsters.' with three hero cards." },
  arena: { src: arena, small: arenaSm, url: `${HOST}/arena`,
    alt: "The trial docket: Tier 1 infraction cases such as The Bureaucratic Delay and The Missing Fact, with your standing and party synergies." },
  trial: { src: trial, small: trialSm, url: `${HOST}/arena`,
    alt: "A trial in progress: The Bureaucratic Delay with the threat's HP, the facts, two elements to prove, and a party of five Republic Acts." },
  party: { src: party, small: partySm, url: `${HOST}/arena`,
    alt: "Your party of hero statutes, each with power and defence stats and Invoke and Inspect buttons, above the action cards." },
} satisfies Record<string, Shot>;

export const site: SiteContent = {
  name: "JurisCards Arena",
  logo,
  logoAlt: "JurisCards Arena",
  homeHref: "landing.html",
  nav: [
    { label: "Features", id: "features" },
    { label: "How it plays", id: "how-it-works" },
    { label: "Demo", id: "showcase" },
    { label: "FAQ", id: "faq" },
  ],
  login: { label: "Sign in", href: "login.html" },
  signup: { label: "Play free", href: "login.html?signup=1" },
  guest: { label: "Play Tier 1 as a guest", href: "index.html?guest=1" },

  hero: {
    eyebrow: "A card game for law students",
    headline: { before: "Win the case with the right", accent: "law", after: "." },
    sub: "Republic Acts are your hero cards. Cybercrime, harassment, red tape and data leaks are the monsters. Read the facts, prove every element with the correct statute, and keep your Juris Power above zero.",
    shot: shots.trial,
  },

  problem: {
    eyebrow: "Why a card game",
    title: "Make the Republic Acts stick by using them.",
    oldLabel: "The old way",
    oldCopy: "You memorize RA numbers and titles for the exam. Then a fact pattern asks which law applies and what has to be proven, and the list in your head does not help.",
    newLabel: "In the Arena",
    points: [
      { title: "Read the facts", text: "Each case is a short fact pattern with a threat to defeat." },
      { title: "Prove every element", text: "Play a law that does not fit and the court sustains the objection." },
      { title: "Cite the right section", text: "Every element cites the section of law that establishes it." },
      { title: "Keep your record", text: "Wins, rank and trial history are saved to your account." },
    ],
  },

  features: {
    eyebrow: "Features",
    title: "Every move is a legal argument.",
    sub: "Each case lists the elements a lawyer would have to prove.",
    items: [
      { icon: Gavel, title: "Win the case", text: "Prove every element and bring the threat to 0 HP before your Juris Power runs out.", demo: "hp", span: 4 },
      { icon: Layers3, title: "13 cases, 3 tiers", text: "From a late barangay permit to a debt-shaming syndicate.", demo: "tiers", span: 2 },
      { icon: BookOpenText, title: "Real statutes, real stats", text: "Every hero card is a law from the L-Lawliet database, with stats from its minimum fine and impact.", demo: "breakdown", span: 2 },
      { icon: Swords, title: "Party synergies", text: "Pair laws across categories to unlock passive advantages.", demo: "chips", span: 2 },
      { icon: Trophy, title: "Ranks and leaderboard", text: "From Law Student to Justice, by the number of different cases won.", demo: "rank", span: 2 },
      { icon: Share2, title: "One account, three sites", text: "Read the law on L-Lawliet, drill it on JurisCards, use it here. The same login works on all three.", demo: "account", span: 6 },
    ],
  },

  steps: {
    eyebrow: "How it plays",
    title: "Docket, party, verdict.",
    items: [
      { title: "Pick a case", text: "Thirteen cases in three tiers. Guests start with Tier 1 infractions.", shot: shots.arena },
      { title: "Read the docket", text: "A short fact pattern, the threat's HP and the elements you have to prove.", shot: shots.trial },
      { title: "Invoke the right law", text: "Play a statute from your party of five, or an action card like Element Check or Search Precedent.", shot: shots.party },
    ],
  },

  stats: {
    title: "The game today",
    items: [
      { to: 13, label: "Cases" },
      { to: 3, label: "Tiers" },
      { to: 10, label: "Laws in the guest card pool" },
      { to: 3, label: "Sites, one account" },
    ],
  },

  showcase: {
    eyebrow: "Demo",
    title: "See the real thing.",
    sub: "Screenshots of the live game, as a guest sees it.",
    tabs: [
      { label: "Home", caption: "The pitch: laws are heroes, legal problems are monsters.", shot: shots.home },
      { label: "Docket", caption: "Choose a case. Tiers 2 and 3 unlock with a free account.", shot: shots.arena },
      { label: "Trial", caption: "Facts, threat HP and the elements left to prove.", shot: shots.trial },
      { label: "Your party", caption: "Five hero statutes plus the procedural action cards.", shot: shots.party },
    ],
  },

  faq: [
    { q: "Is the Arena free?", a: "Yes. It is free for students and runs in the browser on a phone or a laptop." },
    { q: "What can I play without an account?", a: "Guests play Tier 1 cases with a pool of 10 laws and can view the leaderboard; nothing is saved. A free account unlocks all 13 cases in 3 tiers, every law in your card pool, saved wins, rank and trial history, a spot on the leaderboard, and game settings." },
    { q: "Is this legal advice?", a: "No. The cases are a study game. The laws come from the L-Lawliet database, where each one links to its full text in the Official Gazette." },
    { q: "Does my account work on L-Lawliet and JurisCards?", a: "Yes. The three sites share one database, so the same username and password, or Google sign-in, works on each of them." },
    { q: "I forgot my password. What now?", a: "Use \"Forgot password?\" on the sign-in page. If you confirmed an email in Settings, we send a reset link that works once, for 30 minutes. If you did not, ask an admin to help you back in." },
  ],

  finalCta: {
    title: "Make the Republic Acts stick by using them.",
    sub: "Free for students. Runs in the browser on phone or laptop.",
  },

  footer: {
    description: "A card game about Philippine law: win cases by playing the right Republic Act.",
    links: [
      { label: "Play", href: "arena.html" },
      { label: "Leaderboard", href: "leaderboard.html" },
    ],
    sisters: [
      { label: "L-Lawliet", href: "https://l-lawliet-three.vercel.app/", note: "The laws in plain English" },
      { label: "JurisCards", href: "https://juris-card.vercel.app/", note: "Flashcards and quizzes" },
    ],
    github: "https://github.com/zleww/JustGiveupATP",
    disclaimer: "Laws from the L-Lawliet database. A study aid, not legal advice.",
    year: 2026,
  },

  statsApi: "https://l-lawliet-three.vercel.app/api/v1/stats",
};
