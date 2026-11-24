// GSAP plugins are registered once, here, and imported from this file everywhere else.
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, SplitText, Flip, useGSAP);
// No automatic refresh on "load": App.tsx calls ScrollTrigger.refresh() once after images load.
ScrollTrigger.config({ autoRefreshEvents: "visibilitychange,DOMContentLoaded,resize" });

export { gsap, Flip, ScrollTrigger, SplitText, useGSAP };

/** gsap.matchMedia() conditions shared by every section. */
export const MQ = {
  motion: "(prefers-reduced-motion: no-preference)",
  reduce: "(prefers-reduced-motion: reduce)",
  desktop: "(min-width: 1024px)",
} as const;

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia(MQ.reduce).matches;

/**
 * Default reveal for every [data-reveal] element inside `scope`:
 * opacity 0 -> 1, y 40 -> 0, 0.8s expo.out, once, when its top reaches 80% of the viewport.
 * Reduced motion: a short opacity fade only. Optional data-delay="0.1" per element.
 */
export function revealChildren(scope: Element) {
  const mm = gsap.matchMedia();
  mm.add({ motion: MQ.motion, reduce: MQ.reduce }, (ctx) => {
    const reduce = Boolean(ctx.conditions?.reduce);
    gsap.utils.toArray<HTMLElement>("[data-reveal]", scope).forEach((el) => {
      gsap.fromTo(el, { opacity: 0, y: reduce ? 0 : 40 }, {
        opacity: 1,
        y: 0,
        duration: reduce ? 0.4 : 0.8,
        ease: "expo.out",
        delay: Number(el.dataset.delay || 0),
        scrollTrigger: { trigger: el, start: "top 80%", once: true },
      });
    });
  });
  return mm;
}

/** Plays a looping timeline only while its element is on screen. */
export function playWhileVisible(el: Element, tl: gsap.core.Timeline) {
  tl.pause();
  return ScrollTrigger.create({
    trigger: el,
    start: "top bottom",
    end: "bottom top",
    onToggle: (self) => (self.isActive ? tl.play() : tl.pause()),
  });
}
