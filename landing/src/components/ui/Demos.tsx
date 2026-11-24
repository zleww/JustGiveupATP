// Small looping illustrations for the feature cards. Each one is a GSAP timeline that
// plays only while the card is on screen, and stays still for reduced motion.
// They are decoration: the card's title and text carry the meaning, so all are aria-hidden.
import { useRef, type ReactNode } from "react";
import { gsap, MQ, playWhileVisible, useGSAP } from "../../lib/gsap";
import type { DemoKind } from "../../types";

function useLoop(build: (tl: gsap.core.Timeline) => void) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MQ.motion, () => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.6, defaults: { ease: "power3.out" } });
      build(tl);
      const st = playWhileVisible(ref.current!, tl);
      return () => st.kill();
    });
    return () => mm.revert();
  }, { scope: ref });
  return ref;
}

function Shell({ children, refEl, className = "" }: { children: ReactNode; refEl: React.Ref<HTMLDivElement>; className?: string }) {
  return (
    <div ref={refEl} aria-hidden="true" className={`relative h-36 select-none overflow-hidden rounded-xl border border-line bg-bg/60 p-4 ${className}`}>
      {children}
    </div>
  );
}

/** A coloured layer behind an element's content; the timelines fade it in and out (opacity only). */
const Hl = ({ className }: { className: string }) => (
  <span className={`pointer-events-none absolute inset-0 -z-10 rounded-[inherit] opacity-0 ${className}`} />
);

/** Text revealed left to right by a cover that shrinks (scaleX only), like typing. */
const Typed = ({ cls, children }: { cls: string; children: ReactNode }) => (
  <span className="relative inline-block">
    {children}
    <span className={`${cls} absolute inset-y-0 -right-px left-0 origin-right bg-[#15151d]`} />
  </span>
);

const Bar = ({ w, className = "" }: { w: string; className?: string }) => (
  <span className={`block h-2 rounded-full bg-white/10 ${className}`} style={{ width: w }} />
);

function SearchDemo() {
  const ref = useLoop((tl) => {
    tl.fromTo(".d-cover", { scaleX: 1 }, { scaleX: 0, duration: 1.1, ease: "steps(12)" })
      .from(".d-row", { y: 14, opacity: 0, stagger: 0.12, duration: 0.5 }, "+=0.15")
      .to(".d-row", { opacity: 0, duration: 0.4, delay: 1.6 })
      .to(".d-cover", { scaleX: 1, duration: 0.3, ease: "power2.in" }, "<");
  });
  return (
    <Shell refEl={ref}>
      <div className="flex items-center gap-2 rounded-lg border border-line-strong bg-[#15151d] px-3 py-2 text-xs">
        <span className="text-faint">⌕</span>
        <Typed cls="d-cover"><span className="text-ink">RA 10173 data privacy</span></Typed>
        <span className="h-3.5 w-px animate-pulse bg-crimson-ink" />
      </div>
      <div className="mt-3 space-y-2">
        {["RA 10173 · Data Privacy Act", "RA 10175 · Cybercrime Law"].map((t) => (
          <div key={t} className="d-row flex items-center gap-2 rounded-md bg-white/[0.04] px-3 py-2 text-[11px] text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-crimson" />{t}
          </div>
        ))}
      </div>
    </Shell>
  );
}

function BreakdownDemo() {
  const labels = ["What it requires", "Who it covers", "Example", "Penalties"];
  const ref = useLoop((tl) => {
    labels.forEach((_, i) => {
      tl.to(`.d-hl-${i}`, { opacity: 1, duration: 0.35 })
        .from(`.d-fill-${i}`, { scaleX: 0, transformOrigin: "0 50%", duration: 0.6 }, "<")
        .to(`.d-hl-${i}`, { opacity: 0, duration: 0.35 }, "+=0.5");
    });
  });
  return (
    <Shell refEl={ref} className="!h-auto">
      <div className="grid gap-2 sm:grid-cols-2">
        {labels.map((l, i) => (
          <div key={l} className="relative isolate rounded-lg border border-line bg-white/[0.03] p-3">
            <Hl className={`d-hl-${i} -inset-px border border-crimson-ink/50 bg-crimson/15`} />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-crimson-ink">{l}</span>
            <span className={`d-fill-${i} mt-2 block space-y-1.5`}>
              <Bar w="92%" /><Bar w="68%" />
            </span>
          </div>
        ))}
      </div>
    </Shell>
  );
}

function ChipsDemo() {
  const chips = ["Technology & Crime", "Finance & Taxes", "Governance & Business", "Social & Welfare", "Environment", "Education & Civil Rights"];
  const ref = useLoop((tl) => {
    chips.forEach((_, i) => {
      tl.to(`.d-chip-${i}`, { opacity: 1, duration: 0.25 })
        .to(`.d-chip-${i}`, { opacity: 0, duration: 0.25 }, "+=0.45");
    });
  });
  return (
    <Shell refEl={ref}>
      <div className="flex flex-wrap gap-1.5">
        {chips.map((c, i) => (
          <span key={c} className="relative isolate rounded-full border border-line-strong bg-white/[0.03] px-2.5 py-1 text-[11px] text-ink">
            <Hl className={`d-chip-${i} -inset-px bg-crimson`} />{c}
          </span>
        ))}
      </div>
    </Shell>
  );
}

function NotesDemo() {
  const ref = useLoop((tl) => {
    tl.from(".d-note", { y: 18, opacity: 0, stagger: 0.5, duration: 0.6 })
      .fromTo(".d-count", { textContent: 3 }, { textContent: 4, snap: { textContent: 1 }, duration: 0.2 }, "+=0.2")
      .fromTo(".d-heart", { scale: 1 }, { scale: 1.35, yoyo: true, repeat: 1, duration: 0.18 }, "<")
      .to(".d-note", { opacity: 0, duration: 0.4, delay: 1.4 });
  });
  return (
    <Shell refEl={ref}>
      <div className="space-y-2">
        <div className="d-note max-w-[85%] rounded-xl rounded-tl-sm bg-white/[0.05] px-3 py-2 text-[11px] text-muted">Mnemonic: <span className="text-ink">"No consent, no collection."</span></div>
        <div className="d-note ml-auto flex max-w-[80%] items-center justify-between gap-3 rounded-xl rounded-tr-sm bg-crimson/15 px-3 py-2 text-[11px] text-ink">
          Saved me in recit!
          <span className="flex items-center gap-1 text-crimson-ink"><span className="d-heart inline-block">♥</span><span className="d-count">3</span></span>
        </div>
      </div>
    </Shell>
  );
}

function RatingDemo() {
  const ref = useLoop((tl) => {
    tl.from(".d-star", { scale: 0.4, opacity: 0.2, stagger: 0.14, duration: 0.35, ease: "back.out(3)" })
      .from(".d-saved", { y: 10, opacity: 0, duration: 0.4 }, "+=0.1")
      .to([".d-star", ".d-saved"], { opacity: 0.2, duration: 0.4, delay: 1.4 });
  });
  return (
    <Shell refEl={ref} className="flex flex-col items-start justify-center gap-4">
      <div className="flex gap-1.5 text-2xl text-crimson-ink">
        {[0, 1, 2, 3, 4].map((i) => <span key={i} className={`d-star inline-block ${i === 4 ? "text-white/20" : ""}`}>★</span>)}
      </div>
      <span className="d-saved inline-flex items-center gap-2 rounded-full border border-line-strong px-3 py-1 text-[11px] text-ink">
        <span className="h-1.5 w-1.5 rounded-full bg-crimson" /> Saved for later
      </span>
    </Shell>
  );
}

function AccountDemo({ sites }: { sites: string[] }) {
  const ref = useLoop((tl) => {
    tl.fromTo(".d-pulse", { x: 0, opacity: 0 }, { x: () => (document.querySelector(".d-track") as HTMLElement | null)?.offsetWidth ?? 0, opacity: 1, duration: 1.6, ease: "power1.inOut" })
      .to(".d-pulse", { opacity: 0, duration: 0.2 })
      .to(".d-ring", { opacity: 1, stagger: 0.45, duration: 0.3 }, 0.1)
      .to(".d-ring", { opacity: 0, duration: 0.5 }, "+=0.6");
  });
  return (
    <Shell refEl={ref} className="flex items-center !h-28 md:!h-32">
      <div className="absolute inset-x-[10%] top-1/2 h-px bg-gradient-to-r from-navy-ink/30 via-crimson-ink/50 to-navy-ink/30" />
      <span className="d-track absolute inset-x-[10%] top-1/2">
        <span className="d-pulse absolute left-0 top-0 h-2 w-2 -translate-y-1/2 rounded-full bg-crimson-ink shadow-[0_0_16px_4px_rgb(242_107_132/0.6)]" />
      </span>
      <div className="relative flex w-full justify-between gap-2">
        {sites.map((s) => (
          <span key={s} className="relative isolate rounded-full border border-line-strong bg-bg px-3 py-1.5 text-[11px] font-medium text-ink md:px-4 md:text-xs">
            <Hl className="d-ring -inset-px border border-crimson-ink/70 bg-crimson/10" />{s}
          </span>
        ))}
      </div>
    </Shell>
  );
}

function FlipDemo() {
  const ref = useLoop((tl) => {
    tl.to(".d-card", { rotateY: 180, duration: 0.8, ease: "power2.inOut", delay: 0.8 })
      .to(".d-card", { rotateY: 360, duration: 0.8, ease: "power2.inOut", delay: 1.6 })
      .set(".d-card", { rotateY: 0 });
  });
  return (
    <Shell refEl={ref} className="flex items-center justify-center [perspective:800px]">
      <div className="d-card relative h-24 w-44 [transform-style:preserve-3d]">
        <div className="absolute inset-0 flex flex-col justify-center rounded-lg border border-line-strong bg-surface-2 p-3 [backface-visibility:hidden]">
          <span className="text-[10px] uppercase tracking-wider text-crimson-ink">RA 10173</span>
          <span className="mt-1 text-xs text-ink">What does the Data Privacy Act do?</span>
        </div>
        <div className="absolute inset-0 flex flex-col justify-center rounded-lg border border-crimson/40 bg-crimson/10 p-3 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <span className="text-[10px] uppercase tracking-wider text-crimson-ink">Answer</span>
          <span className="mt-1 text-[11px] text-ink">Protects personal data; consent before collection.</span>
        </div>
      </div>
    </Shell>
  );
}

function QuizDemo() {
  const ref = useLoop((tl) => {
    tl.to(".d-pick", { opacity: 1, duration: 0.25, delay: 0.6 })
      .to(".d-right", { opacity: 1, duration: 0.3, delay: 0.4 })
      .from(".d-score", { y: 8, opacity: 0, duration: 0.3 }, "<")
      .to([".d-pick", ".d-right"], { opacity: 0, duration: 0.4, delay: 1.4 })
      .to(".d-score", { opacity: 0, duration: 0.3 }, "<");
  });
  return (
    <Shell refEl={ref}>
      <div className="mb-2 flex items-center justify-between text-[10px] text-faint">
        <span>Who signed RA 10175?</span><span className="d-score text-green-400">+1</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
        {["Gloria Macapagal Arroyo", "Benigno Aquino III", "Rodrigo Duterte", "Fidel V. Ramos"].map((o, i) => (
          <span key={o} className="relative isolate rounded-md border border-line bg-white/[0.03] px-2 py-1.5 text-muted">
            {i === 1 && <><Hl className="d-pick -inset-px border border-navy-ink/70" /><Hl className="d-right -inset-px border border-green-400/70 bg-green-500/15" /></>}
            {o}
          </span>
        ))}
      </div>
    </Shell>
  );
}

function ProgressDemo() {
  const rows = [["Technology & Crime", 1], ["Social & Welfare", 0.75], ["Governance", 0.57], ["Finance & Taxes", 0.5]] as const;
  const ref = useLoop((tl) => {
    tl.from(".d-bar", { scaleX: 0, transformOrigin: "0 50%", stagger: 0.15, duration: 0.9, ease: "expo.out" })
      .to(".d-bar", { opacity: 0.3, duration: 0.4, delay: 1.6 });
  });
  return (
    <Shell refEl={ref} className="space-y-2.5">
      {rows.map(([label, v]) => (
        <div key={label}>
          <div className="mb-1 flex justify-between text-[10px] text-muted"><span>{label}</span><span>{Math.round(v * 100)}%</span></div>
          <div className="h-1.5 rounded-full bg-white/[0.06]"><div className="d-bar h-full rounded-full bg-gradient-to-r from-navy to-crimson" style={{ width: `${v * 100}%` }} /></div>
        </div>
      ))}
    </Shell>
  );
}

function WriteDemo() {
  const ref = useLoop((tl) => {
    tl.fromTo(".d-c1", { scaleX: 1 }, { scaleX: 0, duration: 0.9, ease: "steps(14)" })
      .fromTo(".d-c2", { scaleX: 1 }, { scaleX: 0, duration: 1, ease: "steps(16)" })
      .fromTo(".d-new", { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(3)" })
      .to(".d-new", { opacity: 0, duration: 0.3, delay: 1.4 })
      .to([".d-c1", ".d-c2"], { scaleX: 1, duration: 0.3, ease: "power2.in" }, "<");
  });
  return (
    <Shell refEl={ref} className="space-y-2">
      <div className="rounded-md border border-line bg-[#15151d] px-3 py-2 text-[11px]"><span className="text-faint">Front </span><Typed cls="d-c1"><span className="text-ink">What is RA 11313?</span></Typed></div>
      <div className="rounded-md border border-line bg-[#15151d] px-3 py-2 text-[11px]"><span className="text-faint">Back </span><Typed cls="d-c2"><span className="text-ink">The Safe Spaces Act.</span></Typed></div>
      <span className="d-new inline-block rounded-full bg-crimson px-2.5 py-0.5 text-[10px] font-semibold text-white opacity-0">Card added</span>
    </Shell>
  );
}

function HpDemo() {
  const ref = useLoop((tl) => {
    tl.from(".d-play", { y: 30, opacity: 0, duration: 0.45, ease: "back.out(2)" })
      .to(".d-hp", { scaleX: 0.55, duration: 0.6, ease: "power2.out" }, "+=0.1")
      .to(".d-hit", { opacity: 1, y: -8, duration: 0.3 }, "<")
      .to(".d-hit", { opacity: 0, duration: 0.3 }, "+=0.4")
      .to(".d-hp", { scaleX: 0.08, duration: 0.6, ease: "power2.out" }, "+=0.3")
      .to(".d-win", { opacity: 1, scale: 1, duration: 0.3 })
      .to([".d-win", ".d-play"], { opacity: 0, duration: 0.3, delay: 1.2 })
      .set(".d-hp", { scaleX: 1 });
  });
  return (
    <Shell refEl={ref}>
      <div className="flex items-center justify-between text-[10px] text-muted"><span>Threat HP</span><span className="d-hit text-crimson-ink opacity-0">-30</span></div>
      <div className="mt-1 h-2 rounded-full bg-white/[0.06]"><div className="d-hp h-full origin-left rounded-full bg-crimson" /></div>
      <div className="mt-4 flex items-end justify-between">
        <span className="d-play rounded-md border border-navy-ink/50 bg-navy/30 px-2.5 py-2 text-[10px] text-ink">RA 10175<br /><span className="text-faint">Cybercrime</span></span>
        <span className="d-win scale-75 rounded-full bg-crimson px-3 py-1 text-[11px] font-semibold text-white opacity-0">Case won</span>
      </div>
    </Shell>
  );
}

function TiersDemo() {
  const ref = useLoop((tl) => {
    tl.from(".d-tier", { y: 24, opacity: 0, stagger: 0.25, duration: 0.6 })
      .to(".d-boss", { opacity: 1, duration: 0.3 }, "+=0.2")
      .to(".d-tier", { opacity: 0.25, duration: 0.4, delay: 1.4 });
  });
  return (
    <Shell refEl={ref} className="flex items-end gap-2">
      {[["Tier 1", "Infractions", "h-12"], ["Tier 2", "Violations", "h-20"], ["Tier 3", "Boss litigation", "h-28"]].map(([t, n, h], i) => (
        <div key={t} className={`d-tier relative isolate flex ${h} flex-1 flex-col justify-end rounded-md border border-line bg-white/[0.04] p-2`}>
          {i === 2 && <Hl className="d-boss -inset-px border border-crimson-ink/60 bg-crimson/10" />}
          <span className="text-[10px] font-semibold text-crimson-ink">{t}</span>
          <span className="text-[10px] text-muted">{n}</span>
        </div>
      ))}
    </Shell>
  );
}

function RankDemo() {
  const ref = useLoop((tl) => {
    tl.from(".d-rank", { x: -20, opacity: 0, stagger: 0.15, duration: 0.5 })
      .to(".d-rank-up", { y: -34, duration: 0.6, ease: "power3.inOut" }, "+=0.3")
      .to(".d-rank-down", { y: 34, duration: 0.6, ease: "power3.inOut" }, "<")
      .to(".d-rank", { opacity: 0, duration: 0.4, delay: 1.2 })
      .set([".d-rank-up", ".d-rank-down"], { y: 0 });
  });
  return (
    <Shell refEl={ref} className="space-y-1.5">
      <div className="d-rank d-rank-down flex justify-between rounded-md bg-white/[0.04] px-3 py-2 text-[11px] text-muted"><span>Law Student</span><span>2 cases</span></div>
      <div className="d-rank d-rank-up flex justify-between rounded-md border border-crimson/30 bg-crimson/10 px-3 py-2 text-[11px] text-ink"><span>You</span><span>3 cases</span></div>
      <div className="d-rank flex justify-between rounded-md bg-white/[0.04] px-3 py-2 text-[11px] text-muted"><span>Guest</span><span>not listed</span></div>
    </Shell>
  );
}

export default function Demo({ kind, sites }: { kind: DemoKind; sites: string[] }) {
  switch (kind) {
    case "search": return <SearchDemo />;
    case "breakdown": return <BreakdownDemo />;
    case "chips": return <ChipsDemo />;
    case "notes": return <NotesDemo />;
    case "rating": return <RatingDemo />;
    case "account": return <AccountDemo sites={sites} />;
    case "flip": return <FlipDemo />;
    case "quiz": return <QuizDemo />;
    case "progress": return <ProgressDemo />;
    case "write": return <WriteDemo />;
    case "hp": return <HpDemo />;
    case "tiers": return <TiersDemo />;
    case "rank": return <RankDemo />;
  }
}
