import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { gsap, MQ, SplitText, useGSAP } from "../../lib/gsap";
import ShinyText from "../reactbits/ShinyText";
import GradientText from "../reactbits/GradientText";
import Magnet from "../reactbits/Magnet";
import BrowserFrame from "../ui/BrowserFrame";
import DeferredAurora from "../ui/DeferredAurora";
import { site } from "../../content";


const AURORA_STOPS = ["#1E3A8A", "#DC143C", "#1E3A8A"];

export default function Hero() {
  const scope = useRef<HTMLElement>(null);
  const { headline } = site.hero;
  // No space before closing punctuation ("the right law.", not "the right law .")
  const gap = /^[.,!?;:]/.test(headline.after) ? "" : " ";
  const fullHeadline = `${headline.before} ${headline.accent}${gap}${headline.after}`;

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add({ motion: MQ.motion, reduce: MQ.reduce }, (ctx) => {
      const reduce = Boolean(ctx.conditions?.reduce);
      const after = gsap.utils.toArray<HTMLElement>("[data-hero-after]");

      if (reduce) {
        gsap.fromTo([".hero-title", ...after], { opacity: 0 }, { opacity: 1, duration: 0.5, stagger: 0.08 });
        return;
      }

      // Headline: each word rises out of a mask and unblurs. The accent word moves as one unit.
      const split = SplitText.create("[data-split]", { type: "words", mask: "words", wordsClass: "hero-word", aria: "none" });
      const words = gsap.utils.toArray<HTMLElement>(".hero-word, [data-accent-inner]");
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.fromTo(words, { yPercent: 100, filter: "blur(8px)", opacity: 0 }, { yPercent: 0, filter: "blur(0px)", opacity: 1, duration: 1.1, stagger: 0.06 })
        .fromTo(after, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.08 }, "-=0.7");

      // Screenshot: tilted back at 25deg, straightens and grows as you scroll.
      gsap.fromTo(
        "[data-hero-shot]",
        { rotateX: 25, scale: 0.9, transformOrigin: "50% 0%" },
        { rotateX: 0, scale: 1, ease: "none", scrollTrigger: { trigger: "[data-hero-shot]", start: "top 85%", end: "top 25%", scrub: 1 } },
      );
      return () => split.revert();
    });
    return () => mm.revert();
  }, { scope });

  return (
    <section ref={scope} className="relative isolate overflow-hidden pt-32 md:pt-40" aria-labelledby="hero-title">
      {/* Background: Aurora in the accent colours, with a static gradient under it as the fallback */}
      <div className="absolute inset-x-0 top-0 -z-10 h-[820px]" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgb(30_58_138/0.45),transparent_70%),radial-gradient(40%_40%_at_70%_10%,rgb(220_20_60/0.25),transparent_70%)]" />
        <DeferredAurora className="absolute inset-0 opacity-55" colorStops={AURORA_STOPS} amplitude={1.1} blend={0.55} speed={0.6} mouseInteraction={false} intro />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-b from-transparent to-bg" />
      </div>

      <div className="container-page flex flex-col items-center text-center">
        <p data-hero-after className="glass mb-7 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-crimson shadow-[0_0_12px_2px_rgb(220_20_60/0.8)]" aria-hidden="true" />
          <ShinyText text={site.hero.eyebrow} color="#c9c9d4" shineColor="#ffffff" speed={3} />
        </p>

        <h1 id="hero-title" aria-label={fullHeadline} className="hero-title max-w-5xl text-[clamp(2.75rem,8vw,6rem)] font-semibold leading-[0.98] tracking-[-0.045em]">
          <span aria-hidden="true">
            <span data-split>{headline.before} </span>
            <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
              <span data-accent-inner className="inline-block">
                <GradientText colors={["#F26B84", "#8AA4FF", "#F26B84"]} animationSpeed={6} glow={0.4}>
                  {headline.accent}
                </GradientText>
              </span>
            </span>
            <span data-split>{gap}{headline.after}</span>
          </span>
        </h1>

        <p data-hero-after className="mt-7 max-w-2xl text-lg leading-relaxed text-muted md:text-xl">{site.hero.sub}</p>

        <div data-hero-after className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
          <Magnet padding={60} magnetStrength={4} maxOffset={14}>
            <a href={site.signup.href} className="btn btn-primary group/cta !min-h-[52px] !px-7 text-base">
              {site.signup.label}
              <ArrowRight size={18} className="transition-transform duration-300 group-hover/cta:translate-x-0.5" aria-hidden="true" />
            </a>
          </Magnet>
          <a href={site.guest.href} className="btn btn-ghost !min-h-[52px] !px-7 text-base">{site.guest.label}</a>
        </div>
      </div>

      <div className="container-page relative mt-16 md:mt-24 [perspective:1600px]">
        <div className="glow-crimson pointer-events-none absolute -top-10 left-1/2 -z-10 h-[420px] w-[80%] -translate-x-1/2 opacity-60 blur-2xl" aria-hidden="true" />
        <div data-hero-shot className="will-change-transform">
          <BrowserFrame shot={site.hero.shot} eager />
        </div>
      </div>
    </section>
  );
}
