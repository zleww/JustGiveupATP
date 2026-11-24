import type { LucideIcon } from "lucide-react";

export interface Shot {
  src: string;
  small: string; // 960px-wide version for phones
  alt: string;
  url: string; // shown in the browser frame's address bar
}

export type DemoKind =
  | "search" | "breakdown" | "chips" | "notes" | "rating" | "account"
  | "flip" | "quiz" | "progress" | "write" | "hp" | "tiers" | "rank";

export interface Feature {
  icon: LucideIcon;
  title: string;
  text: string;
  demo: DemoKind;
  span: 2 | 3 | 4 | 6; // columns out of 6 on desktop
}

export interface Step {
  title: string;
  text: string;
  shot: Shot;
}

export interface Stat {
  to: number;
  label: string;
  suffix?: string;
  /** Replace `to` with a live number from the API when it answers. */
  live?: "laws" | "categories";
}

export interface SiteContent {
  name: string;
  logo: string;
  logoAlt: string;
  homeHref: string;
  nav: { label: string; id: string }[];
  login: { label: string; href: string };
  signup: { label: string; href: string };
  guest: { label: string; href: string };
  hero: {
    eyebrow: string;
    headline: { before: string; accent: string; after: string };
    sub: string;
    shot: Shot;
  };
  problem: {
    eyebrow: string;
    title: string;
    oldLabel: string;
    oldCopy: string;
    newLabel: string;
    points: { title: string; text: string }[];
  };
  features: { eyebrow: string; title: string; sub: string; items: Feature[] };
  steps: { eyebrow: string; title: string; items: Step[] };
  stats: { title: string; items: Stat[] };
  showcase: { eyebrow: string; title: string; sub: string; tabs: { label: string; caption: string; shot: Shot }[] };
  faq: { q: string; a: string }[];
  finalCta: { title: string; sub: string };
  footer: {
    description: string;
    links: { label: string; href: string }[];
    sisters: { label: string; href: string; note: string }[];
    github: string;
    disclaimer: string;
    year: number;
  };
  /** Where the live law count comes from. */
  statsApi: string;
}
