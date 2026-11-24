import { useRef } from "react";
import { Check, X } from "lucide-react";
import { gsap, MQ, revealChildren, useGSAP } from "../../lib/gsap";
import ScrollReveal from "../reactbits/ScrollReveal";
import { site } from "../../content";

export default function ProblemSolution() {
  const scope = useRef<HTMLElement>(null);
  const { problem } = site;

  useGSAP(() => {
    const reveal = revealChildren(scope.current!);
    const mm = gsap.matchMedia();

    // Desktop with motion: the section pins while the new-way points slide in one by one.
    mm.add(`${MQ.desktop} and ${MQ.motion}`, () => {
      const points = gsap.utils.toArray<HTMLElement>("[data-point]");
      gsap.timeline({
        scrollTrigger: { trigger: "[data-pin]", start: "top top+=96", end: `+=${points.length * 45}%`, pin: true, scrub: 1 },
      })
        .fromTo(points, { xPercent: 12, opacity: 0 }, { xPercent: 0, opacity: 1, stagger: 0.5, duration: 1, ease: "power3.out" })
        .to({}, { duration: 0.4 }); // a short hold before the pin releases
    });

    // Phones, tablets and reduced motion: no pin, each point simply fades up.
    mm.add(`(max-width: 1023px), ${MQ.reduce}`, (ctx) => {
      const reduce = window.matchMedia(MQ.reduce).matches;
      gsap.utils.toArray<HTMLElement>("[data-point]").forEach((el) =>
        gsap.fromTo(el, { opacity: 0, y: reduce ? 0 : 30 }, { opacity: 1, y: 0, duration: 0.7, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 85%", once: true } }),
      );
      return ctx;
    });
    return () => { reveal.revert(); mm.revert(); };
  }, { scope });

  return (
    <section ref={scope} aria-labelledby="problem-title" className="relative py-20 md:py-28">
      <div className="container-page">
        <div className="mx-auto mb-14 max-w-3xl text-center md:mb-20">
          <p data-reveal className="eyebrow">{problem.eyebrow}</p>
          <h2 data-reveal data-delay="0.05" id="problem-title" className="section-title mt-4">{problem.title}</h2>
        </div>

        <div data-pin className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="glass relative overflow-hidden rounded-3xl p-7 md:p-10 lg:col-span-6">
            <div className="glow-accent2 pointer-events-none absolute -left-24 -top-24 h-72 w-72 opacity-60" aria-hidden="true" />
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-faint">
              <X size={16} aria-hidden="true" /> {problem.oldLabel}
            </h3>
            <ScrollReveal
              as="p"
              baseOpacity={0.12}
              enableBlur
              blurStrength={3}
              baseRotation={0}
              containerClassName="!mb-0 !mt-6"
              textClassName="!text-[clamp(1.35rem,2.4vw,2rem)] !leading-[1.35] !font-medium tracking-[-0.01em] text-ink"
            >
              {problem.oldCopy}
            </ScrollReveal>
          </div>

          <div className="relative rounded-3xl border border-accent/25 bg-gradient-to-b from-accent/[0.08] to-transparent p-7 md:p-10 lg:col-span-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-accent-ink">
              <Check size={16} aria-hidden="true" /> {problem.newLabel}
            </h3>
            <ul className="mt-6 space-y-3">
              {problem.points.map((p) => (
                <li key={p.title} data-point className="glass flex gap-4 rounded-2xl p-5">
                  <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-accent/15 text-accent-ink" aria-hidden="true">
                    <Check size={15} />
                  </span>
                  <span>
                    <span className="block font-display text-lg font-semibold tracking-tight">{p.title}</span>
                    <span className="mt-1 block text-muted">{p.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
