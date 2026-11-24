import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { AuroraProps } from "../reactbits/Aurora";
import { useMotionOK } from "../../lib/useMotionOK";

// Code-split: the WebGL background loads in its own chunk.
const Aurora = lazy(() => import("../reactbits/Aurora"));

const whenIdle = (cb: () => void) => {
  const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
  if (ric) ric(cb, { timeout: 2500 });
  else setTimeout(cb, 600);
};

/**
 * Aurora that starts only after the visitor first interacts (or 8 s), when it is near the
 * screen and the main thread is idle. Creating the WebGL context and compiling its shaders is the single
 * most expensive thing on the page, so the static gradient behind it shows first.
 * Not rendered at all for reduced motion. Aurora itself pauses while off screen.
 */
export default function DeferredAurora({ className = "", ...props }: AuroraProps & { className?: string }) {
  const motionOK = useMotionOK();
  const ref = useRef<HTMLDivElement>(null);
  const [start, setStart] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!motionOK || start) return;
    let cancelled = false;
    let io: IntersectionObserver | undefined;
    // Wait for the first sign of a person (scroll, pointer, key, touch) or 8 seconds, so
    // page load stays responsive; then start once the canvas is near the screen.
    const EVENTS = ["pointermove", "pointerdown", "wheel", "touchstart", "keydown", "scroll"] as const;
    let timer = 0;
    const observe = () => {
      EVENTS.forEach((e) => window.removeEventListener(e, observe));
      clearTimeout(timer);
      if (cancelled || io) return;
      io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io?.disconnect();
          whenIdle(() => { if (!cancelled) setStart(true); });
        }
      }, { rootMargin: "300px 0px" });
      if (ref.current) io.observe(ref.current);
    };
    EVENTS.forEach((e) => window.addEventListener(e, observe, { passive: true }));
    timer = window.setTimeout(observe, 8000);
    return () => {
      cancelled = true;
      io?.disconnect();
      clearTimeout(timer);
      EVENTS.forEach((e) => window.removeEventListener(e, observe));
    };
  }, [motionOK, start]);

  useEffect(() => {
    if (!start) return;
    const t = setTimeout(() => setShown(true), 50);
    return () => clearTimeout(t);
  }, [start]);

  if (!motionOK) return null;
  return (
    <div ref={ref} className={`transition-opacity duration-[1600ms] ${shown ? "" : "!opacity-0"} ${className}`} aria-hidden="true">
      {start && (
        <Suspense fallback={null}>
          <Aurora {...props} />
        </Suspense>
      )}
    </div>
  );
}
