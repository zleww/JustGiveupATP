import { lazy, Suspense, useEffect } from "react";
import { ScrollTrigger } from "./lib/gsap";
import { SmoothScroll } from "./components/SmoothScroll";
import Noise from "./components/reactbits/Noise";
import Navbar from "./components/sections/Navbar";
import Hero from "./components/sections/Hero";
import TechStrip from "./components/sections/TechStrip";
import ProblemSolution from "./components/sections/ProblemSolution";
import Features from "./components/sections/Features";
import HowItWorks from "./components/sections/HowItWorks";
import Showcase from "./components/sections/Showcase";
import BuiltWith from "./components/sections/BuiltWith";
import Faq from "./components/sections/Faq";
import FinalCta from "./components/sections/FinalCta";
import Footer from "./components/sections/Footer";

// CountUp brings the motion library; load it with this section instead of up front.
const Stats = lazy(() => import("./components/sections/Stats"));

export default function App() {
  // Images change section heights, so measure again once they have loaded.
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    if (document.readyState === "complete") refresh();
    else window.addEventListener("load", refresh, { once: true });
    return () => window.removeEventListener("load", refresh);
  }, []);

  return (
    <SmoothScroll>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-bg">
        Skip to content
      </a>
      <Navbar />
      <main id="main">
        <Hero />
        <TechStrip />
        <ProblemSolution />
        <Features />
        <HowItWorks />
        <Suspense fallback={<div className="h-[280px] md:h-[360px]" aria-hidden="true" />}>
          <Stats />
        </Suspense>
        <Showcase />
        <BuiltWith />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      {/* Film grain over everything, drawn once (fps 0) so it costs nothing while scrolling */}
      <Noise opacity={0.03} fps={0} fixed blendMode="normal" zIndex={60} className="pointer-events-none" />
    </SmoothScroll>
  );
}
