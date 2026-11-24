import { useRef } from "react";
import { revealChildren, useGSAP } from "../../lib/gsap";
import DeferredAurora from "../ui/DeferredAurora";
import StarBorder from "../reactbits/StarBorder";
import { site } from "../../content";


export default function FinalCta() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(() => {
    const mm = revealChildren(scope.current!);
    return () => mm.revert();
  }, { scope });

  return (
    <section ref={scope} aria-labelledby="cta-title" className="relative isolate overflow-hidden py-28 md:py-40">
      {/* The hero's aurora, echoed faintly (the second and last WebGL canvas; it pauses off screen) */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_100%,rgb(220_20_60/0.22),transparent_70%),radial-gradient(60%_50%_at_50%_100%,rgb(30_58_138/0.35),transparent_70%)]" />
        <DeferredAurora className="absolute inset-0 rotate-180 opacity-35" colorStops={["#1E3A8A", "#DC143C", "#1E3A8A"]} amplitude={0.8} blend={0.6} speed={0.4} mouseInteraction={false} intro={false} />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-bg to-transparent" />
      </div>

      <div className="container-page flex flex-col items-center text-center">
        <h2 data-reveal id="cta-title" className="max-w-4xl text-[clamp(2.5rem,6.5vw,5.5rem)] font-semibold leading-[1] tracking-[-0.04em]">
          {site.finalCta.title}
        </h2>
        <p data-reveal data-delay="0.08" className="mt-6 text-lg text-muted">{site.finalCta.sub}</p>
        <div data-reveal data-delay="0.16" className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <StarBorder
            as="a"
            href={site.signup.href}
            color="#F26B84"
            trailColor="#8AA4FF"
            backgroundColor="#DC143C"
            textColor="#ffffff"
            borderColor="rgba(255,255,255,0.18)"
            radius={999}
            duration={5}
            theme="dark"
            className="font-semibold"
          >
            Create a free account
          </StarBorder>
          <a href={site.guest.href} className="btn btn-ghost">{site.guest.label}</a>
        </div>
      </div>
    </section>
  );
}
