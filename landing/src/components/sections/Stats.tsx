import { useEffect, useRef, useState } from "react";
import { revealChildren, ScrollTrigger, useGSAP } from "../../lib/gsap";
import CountUp from "../reactbits/CountUp";
import { site } from "../../content";

/** Only real numbers. The law and category counts are read live from the API when it answers. */
export default function Stats() {
  const scope = useRef<HTMLElement>(null);
  const [live, setLive] = useState<{ laws?: number; categories?: number }>({});

  useEffect(() => {
    if (!site.stats.items.some((s) => s.live)) return;
    const ctrl = new AbortController();
    fetch(site.statsApi, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d.total === "number") {
          setLive({ laws: d.total, categories: d.categories ? Object.keys(d.categories).length : undefined });
        }
      })
      .catch(() => { /* keep the numbers written in content.ts */ });
    return () => ctrl.abort();
  }, []);

  useGSAP(() => {
    const mm = revealChildren(scope.current!);
    // Arrived after the others were measured: re-measure, unless the load-time refresh is still to come.
    if (document.readyState === "complete") ScrollTrigger.refresh();
    return () => mm.revert();
  }, { scope });

  return (
    <section ref={scope} aria-labelledby="stats-title" className="relative py-16 md:py-24">
      <div className="container-page">
        <h2 id="stats-title" data-reveal className="sr-only">{site.stats.title}</h2>
        <dl className="glass grid grid-cols-2 divide-line overflow-hidden rounded-3xl lg:grid-cols-4 lg:divide-x">
          {site.stats.items.map((s, i) => {
            const value = (s.live && live[s.live]) || s.to;
            return (
              <div key={s.label} data-reveal data-delay={String(i * 0.06)} className="flex flex-col-reverse gap-2 border-line p-6 text-center max-lg:[&:nth-child(-n+2)]:border-b max-lg:[&:nth-child(odd)]:border-r md:p-10">
                <dt className="text-sm text-muted">{s.label}</dt>
                <dd className="font-display text-5xl font-semibold tracking-tight md:text-6xl">
                  <span className="sr-only">{value}{s.suffix ?? ""}</span>
                  <span aria-hidden="true" className="bg-gradient-to-b from-ink to-ink/60 bg-clip-text text-transparent">
                    <CountUp key={value} to={value} duration={1.6} trigger="view" />
                    {s.suffix}
                  </span>
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
