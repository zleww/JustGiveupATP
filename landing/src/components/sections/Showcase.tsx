import { useRef, useState } from "react";
import { Flip, gsap, MQ, revealChildren, useGSAP } from "../../lib/gsap";
import BrowserFrame from "../ui/BrowserFrame";
import { site } from "../../content";

export default function Showcase() {
  const scope = useRef<HTMLElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(0);
  const { showcase } = site;

  useGSAP(() => {
    const mm = revealChildren(scope.current!);
    return () => mm.revert();
  }, { scope });

  const { contextSafe } = useGSAP({ scope });

  // The indicator moves into the chosen tab with GSAP Flip; the panels crossfade.
  const select = contextSafe((i: number, focus = false) => {
    if (i === active) return;
    const reduce = window.matchMedia(MQ.reduce).matches;
    const state = Flip.getState(indicator.current!);
    scope.current!.querySelectorAll<HTMLElement>("[role=tab]")[i].appendChild(indicator.current!);
    Flip.from(state, { duration: reduce ? 0 : 0.55, ease: "expo.out" });

    const panels = scope.current!.querySelectorAll<HTMLElement>("[role=tabpanel]");
    gsap.to(panels[active], { opacity: 0, duration: reduce ? 0 : 0.3, ease: "power2.out" });
    gsap.fromTo(panels[i], { opacity: 0, y: reduce ? 0 : 12 }, { opacity: 1, y: 0, duration: reduce ? 0 : 0.6, ease: "expo.out" });
    setActive(i);
    if (focus) scope.current!.querySelectorAll<HTMLElement>("[role=tab]")[i].focus();
  });

  const onKey = (e: React.KeyboardEvent) => {
    const last = showcase.tabs.length - 1;
    const next = { ArrowRight: active === last ? 0 : active + 1, ArrowLeft: active === 0 ? last : active - 1, Home: 0, End: last }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    select(next, true);
  };

  return (
    <section ref={scope} id="showcase" aria-labelledby="showcase-title" className="relative py-20 md:py-28">
      <div className="container-page">
        <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
          <p data-reveal className="eyebrow">{showcase.eyebrow}</p>
          <h2 data-reveal data-delay="0.05" id="showcase-title" className="section-title mt-4">{showcase.title}</h2>
          <p data-reveal data-delay="0.1" className="mt-5 text-lg text-muted">{showcase.sub}</p>
        </div>

        <div data-reveal className="mb-8 flex justify-center">
          <div role="tablist" aria-label="Screens" onKeyDown={onKey} className="glass inline-flex max-w-full gap-1 overflow-x-auto rounded-full p-1.5">
            {showcase.tabs.map((t, i) => (
              <button
                key={t.label}
                role="tab"
                id={`tab-${i}`}
                type="button"
                aria-selected={active === i}
                aria-controls={`panel-${i}`}
                tabIndex={active === i ? 0 : -1}
                onClick={() => select(i)}
                className={`relative isolate whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors md:px-5 ${active === i ? "text-white" : "text-muted hover:text-ink"}`}
              >
                {t.label}
                {i === 0 && <span ref={indicator} className="absolute inset-0 -z-10 rounded-full bg-crimson shadow-[0_8px_30px_-8px_rgb(220_20_60/0.8)]" aria-hidden="true" />}
              </button>
            ))}
          </div>
        </div>

        <div data-reveal className="relative">
          <div className="glow-navy pointer-events-none absolute -inset-x-10 -top-10 bottom-0 -z-10 opacity-50 blur-3xl" aria-hidden="true" />
          <div className="grid">
            {showcase.tabs.map((t, i) => (
              <div
                key={t.label}
                role="tabpanel"
                id={`panel-${i}`}
                aria-labelledby={`tab-${i}`}
                hidden={false}
                aria-hidden={active !== i}
                inert={active !== i}
                className="[grid-area:1/1]"
                style={{ opacity: i === 0 ? 1 : 0 }}
              >
                <BrowserFrame shot={t.shot} />
                <p className="mt-5 text-center text-sm text-muted">{t.caption}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
