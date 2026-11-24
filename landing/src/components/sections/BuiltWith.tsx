import { Fragment, useRef } from "react";
import { Database, Globe, Server, ShieldCheck } from "lucide-react";
import { gsap, MQ, revealChildren, useGSAP } from "../../lib/gsap";
import { theme } from "../../theme";
import { ARCHITECTURE } from "../../stack";

const ICONS = [Globe, Server, ShieldCheck, Database];

/** A connector between two nodes: horizontal on desktop, vertical on phones. Drawn on scroll. */
function Connector() {
  return (
    <div className="flex items-center justify-center lg:w-12 lg:flex-none" aria-hidden="true">
      <svg className="h-10 w-2 lg:hidden" viewBox="0 0 2 40" preserveAspectRatio="none">
        <path data-line d="M1 0 V40" pathLength={1} stroke="url(#wire-v)" strokeWidth="2" fill="none" strokeDasharray="1" strokeDashoffset="1" />
      </svg>
      <svg className="hidden h-2 w-full lg:block" viewBox="0 0 48 2" preserveAspectRatio="none">
        <path data-line d="M0 1 H48" pathLength={1} stroke="url(#wire-h)" strokeWidth="2" fill="none" strokeDasharray="1" strokeDashoffset="1" />
      </svg>
    </div>
  );
}

export default function BuiltWith() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(() => {
    const reveal = revealChildren(scope.current!);
    const mm = gsap.matchMedia();
    mm.add({ motion: MQ.motion, reduce: MQ.reduce }, (ctx) => {
      const lines = gsap.utils.toArray<SVGPathElement>("[data-line]");
      if (ctx.conditions?.reduce) { gsap.set(lines, { strokeDashoffset: 0 }); return; }
      gsap.to(lines, {
        strokeDashoffset: 0,
        ease: "none",
        stagger: 0.5,
        scrollTrigger: { trigger: "[data-arch]", start: "top 75%", end: "bottom 55%", scrub: 1 },
      });
    });
    return () => { reveal.revert(); mm.revert(); };
  }, { scope });

  return (
    <section ref={scope} aria-labelledby="built-title" className="relative py-20 md:py-28">
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <linearGradient id="wire-h" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor={theme.wire[0]} /><stop offset="1" stopColor={theme.wire[1]} /></linearGradient>
          <linearGradient id="wire-v" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={theme.wire[0]} /><stop offset="1" stopColor={theme.wire[1]} /></linearGradient>
        </defs>
      </svg>
      <div className="container-page">
        <div className="mb-12 max-w-2xl md:mb-16">
          <p data-reveal className="eyebrow">Built with</p>
          <h2 data-reveal data-delay="0.05" id="built-title" className="section-title mt-4">How a request travels.</h2>
          <p data-reveal data-delay="0.1" className="mt-5 text-lg text-muted">
            One API and one database behind three sites. Security is enforced twice: in the API, and again by PostgreSQL itself.
          </p>
        </div>

        <ol data-arch className="flex flex-col lg:flex-row lg:items-stretch">
          {ARCHITECTURE.map((node, i) => {
            const Icon = ICONS[i];
            return (
              <Fragment key={node.title}>
                {i > 0 && <li aria-hidden="true" className="list-none"><Connector /></li>}
                <li data-reveal data-delay={String(i * 0.08)} className="glass relative flex-1 rounded-3xl p-6">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line-strong bg-white/[0.04] text-accent2-ink">
                    <Icon size={19} aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold tracking-tight">{node.title}</h3>
                  <p className="text-sm text-faint">{node.sub}</p>
                  <ul className="mt-4 space-y-2 text-sm text-muted">
                    {node.points.map((p) => (
                      <li key={p} className="flex gap-2"><span className="mt-2 h-1 w-1 flex-none rounded-full bg-accent-ink" aria-hidden="true" />{p}</li>
                    ))}
                  </ul>
                </li>
              </Fragment>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
