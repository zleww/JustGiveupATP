import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { gsap, MQ, revealChildren, useGSAP } from "../../lib/gsap";
import { site } from "../../content";

export default function Faq() {
  const scope = useRef<HTMLElement>(null);
  const [open, setOpen] = useState<number | null>(null);

  useGSAP(() => {
    const mm = revealChildren(scope.current!);
    return () => mm.revert();
  }, { scope });

  const { contextSafe } = useGSAP({ scope });

  // Height animation (GSAP to "auto"), with the icon turning into an x.
  const toggle = contextSafe((i: number) => {
    const reduce = window.matchMedia(MQ.reduce).matches;
    const panels = scope.current!.querySelectorAll<HTMLElement>("[data-answer]");
    const icons = scope.current!.querySelectorAll<HTMLElement>("[data-icon]");
    const next = open === i ? null : i;
    panels.forEach((p, j) => {
      const show = j === next;
      gsap.to(p, { height: show ? "auto" : 0, opacity: show ? 1 : 0, duration: reduce ? 0 : 0.5, ease: "expo.out" });
      gsap.to(icons[j], { rotate: show ? 45 : 0, duration: reduce ? 0 : 0.4, ease: "expo.out" });
    });
    setOpen(next);
  });

  return (
    <section ref={scope} id="faq" aria-labelledby="faq-title" className="relative py-20 md:py-28">
      <div className="container-page grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p data-reveal className="eyebrow">FAQ</p>
          <h2 data-reveal data-delay="0.05" id="faq-title" className="section-title mt-4">Questions, answered.</h2>
        </div>
        <ul className="lg:col-span-8">
          {site.faq.map((item, i) => (
            <li key={item.q} data-reveal data-delay={String(i * 0.04)} className="border-b border-line">
              <h3>
                <button
                  type="button"
                  id={`faq-q-${i}`}
                  aria-expanded={open === i}
                  aria-controls={`faq-a-${i}`}
                  onClick={() => toggle(i)}
                  className="flex w-full items-center justify-between gap-6 py-6 text-left font-display text-lg font-medium tracking-tight transition-colors hover:text-crimson-ink md:text-xl"
                >
                  {item.q}
                  <span data-icon className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-line-strong text-muted" aria-hidden="true">
                    <Plus size={16} />
                  </span>
                </button>
              </h3>
              <div
                data-answer
                id={`faq-a-${i}`}
                role="region"
                aria-labelledby={`faq-q-${i}`}
                inert={open !== i}
                className="h-0 overflow-hidden opacity-0"
              >
                <p className="max-w-2xl pb-6 leading-relaxed text-muted">{item.a}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
