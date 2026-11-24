import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap, ScrollTrigger, prefersReducedMotion } from "../lib/gsap";

const LenisContext = createContext<Lenis | null>(null);

/** One Lenis instance for the page, driven by GSAP's ticker so ScrollTrigger stays in sync.
 *  Not started at all when the visitor prefers reduced motion (native scrolling instead). */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const instance = new Lenis({ autoRaf: false });
    instance.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    setLenis(instance);
    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}

export const useLenis = () => useContext(LenisContext);

/** Scrolls to a section (80px below the navbar) and moves keyboard focus to it. */
export function useScrollToSection() {
  const lenis = useLenis();
  return useCallback(
    (id: string) => {
      const target = document.getElementById(id);
      if (!target) return;
      if (lenis) lenis.scrollTo(target, { offset: -80 });
      else window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 80, behavior: prefersReducedMotion() ? "auto" : "smooth" });
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
      history.replaceState(null, "", `#${id}`);
    },
    [lenis],
  );
}
