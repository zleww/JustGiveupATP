import { useRef } from "react";
import { gsap, MQ, revealChildren, useGSAP } from "../../lib/gsap";
import BrowserFrame from "../ui/BrowserFrame";
import { site } from "../../content";

export default function HowItWorks() {
  const scope = useRef<HTMLElement>(null);
  const { steps } = site;
  const n = steps.items.length;

  useGSAP(() => {
    const reveal = revealChildren(scope.current!);
    const mm = gsap.matchMedia();

    // Desktop with motion: pin, fill the progress line, and crossfade one screenshot per step.
    mm.add(`${MQ.desktop} and ${MQ.motion}`, () => {
      const texts = gsap.utils.toArray<HTMLElement>("[data-step]");
      const shots = gsap.utils.toArray<HTMLElement>("[data-step-shot]");
      gsap.set(shots.slice(1), { opacity: 0 });
      gsap.set(texts.slice(1), { opacity: 0.75 });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: "[data-steps-pin]", start: "top top+=96", end: `+=${n * 80}%`, pin: true, scrub: 1 },
      });
      tl.fromTo("[data-progress]", { scaleY: 0 }, { scaleY: 1, duration: n - 1 }, 0);
      for (let i = 1; i < n; i++) {
        tl.to(shots[i - 1], { opacity: 0, duration: 0.3 }, i - 0.3)
          .to(shots[i], { opacity: 1, duration: 0.3 }, i - 0.3)
          .to(texts[i - 1], { opacity: 0.75, duration: 0.3 }, i - 0.3)
          .to(texts[i], { opacity: 1, duration: 0.3 }, i - 0.3);
      }
      tl.to({}, { duration: 0.4 });
    });
    return () => { reveal.revert(); mm.revert(); };
  }, { scope });

  return (
    <section ref={scope} id="how-it-works" aria-labelledby="how-title" className="relative py-20 md:py-28">
      <div className="container-page">
        <div className="mb-12 max-w-2xl md:mb-16">
          <p data-reveal className="eyebrow">{steps.eyebrow}</p>
          <h2 data-reveal data-delay="0.05" id="how-title" className="section-title mt-4">{steps.title}</h2>
        </div>

        {/* Desktop: pinned story. Below 1024px (and in this same markup for reduced motion) it reads as a list. */}
        <div data-steps-pin className="hidden gap-12 lg:grid lg:grid-cols-12 motion-reduce:!hidden">
          <ol className="relative lg:col-span-5">
            <span className="absolute bottom-6 left-[19px] top-6 w-px bg-line-strong" aria-hidden="true" />
            <span data-progress className="absolute bottom-6 left-[19px] top-6 w-px origin-top bg-gradient-to-b from-accent to-accent2-ink motion-reduce:hidden" aria-hidden="true" />
            {steps.items.map((s, i) => (
              <li key={s.title} data-step className="relative flex gap-6 pb-14 last:pb-0">
                <span className="relative z-10 flex h-10 w-10 flex-none items-center justify-center rounded-full border border-accent/40 bg-surface font-display text-sm font-semibold text-ink">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="pt-1.5">
                  <h3 className="text-2xl font-semibold tracking-tight">{s.title}</h3>
                  <p className="mt-2 max-w-sm leading-relaxed text-muted">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="relative lg:col-span-7">
            <div className="glow-accent pointer-events-none absolute -inset-10 -z-10 opacity-40 blur-2xl" aria-hidden="true" />
            <div className="relative aspect-[16/10.6]">
              {steps.items.map((s, i) => (
                <div key={s.title} data-step-shot className="absolute inset-0" aria-hidden={i === 0 ? undefined : true}>
                  <BrowserFrame shot={s.shot} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <ol className="space-y-14 lg:hidden motion-reduce:lg:block">
          {steps.items.map((s, i) => (
            <li key={s.title} data-reveal>
              <span className="font-display text-sm font-semibold text-accent-ink">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight">{s.title}</h3>
              <p className="mb-6 mt-2 leading-relaxed text-muted">{s.text}</p>
              <BrowserFrame shot={s.shot} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
