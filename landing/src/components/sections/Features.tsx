import { useRef } from "react";
import { revealChildren, useGSAP } from "../../lib/gsap";
import SpotlightCard from "../reactbits/SpotlightCard";
import Demo from "../ui/Demos";
import { site } from "../../content";

const SPAN: Record<number, string> = {
  2: "lg:col-span-2",
  3: "lg:col-span-3",
  4: "md:col-span-2 lg:col-span-4",
  6: "md:col-span-2 lg:col-span-6",
};

const SISTER_NAMES = ["L-Lawliet", "JurisCards", "Arena"];

export default function Features() {
  const scope = useRef<HTMLElement>(null);
  const { features } = site;

  useGSAP(() => {
    const mm = revealChildren(scope.current!);
    return () => mm.revert();
  }, { scope });

  return (
    <section ref={scope} id="features" aria-labelledby="features-title" className="relative py-20 md:py-28">
      <div className="glow-navy pointer-events-none absolute left-1/2 top-24 -z-10 h-[500px] w-[900px] max-w-full -translate-x-1/2 opacity-40 blur-3xl" aria-hidden="true" />
      <div className="container-page">
        <div className="mb-12 max-w-2xl md:mb-16">
          <p data-reveal className="eyebrow">{features.eyebrow}</p>
          <h2 data-reveal data-delay="0.05" id="features-title" className="section-title mt-4">{features.title}</h2>
          <p data-reveal data-delay="0.1" className="mt-5 text-lg text-muted">{features.sub}</p>
        </div>

        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          {features.items.map((f, i) => {
            const Icon = f.icon;
            const wide = f.span === 6;
            return (
              <li key={f.title} data-reveal data-delay={String((i % 3) * 0.06)} className={SPAN[f.span]}>
                <SpotlightCard
                  spotlightColor="rgba(220, 20, 60, 0.16)"
                  theme="dark"
                  className={`glass h-full !rounded-3xl !border-line !bg-transparent p-6 md:p-7 ${wide ? "md:grid md:grid-cols-2 md:items-center md:gap-10" : "flex flex-col"}`}
                >
                  <div className={wide ? "" : "mb-6"}>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line-strong bg-white/[0.04] text-crimson-ink">
                      <Icon size={19} aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 text-xl font-semibold tracking-tight">{f.title}</h3>
                    <p className="mt-2 leading-relaxed text-muted">{f.text}</p>
                  </div>
                  <div className={wide ? "mt-6 md:mt-0" : "mt-auto"}>
                    <Demo kind={f.demo} sites={SISTER_NAMES} />
                  </div>
                </SpotlightCard>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
