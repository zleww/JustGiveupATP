import LogoLoop, { type LogoItem } from "../reactbits/LogoLoop";
import { STACK } from "../../stack";

const logos: LogoItem[] = STACK.map(({ label, Icon }) => ({
  title: label,
  ariaLabel: label,
  node: (
    <span className="flex items-center gap-2.5 text-muted transition-colors hover:text-ink">
      <Icon aria-hidden="true" className="h-5 w-5" />
      <span className="text-sm font-medium">{label}</span>
    </span>
  ),
}));

export default function TechStrip() {
  return (
    <section aria-label="Built with" className="relative py-16 md:py-20">
      <p className="mb-8 text-center text-xs font-semibold uppercase tracking-[0.18em] text-faint">Built with</p>
      <div className="mask-fade-x">
        <LogoLoop
          logos={logos}
          speed={40}
          gap={48}
          logoHeight={24}
          pauseOnHover
          scaleOnHover={false}
          ariaLabel="Technologies used to build the site"
        />
      </div>
    </section>
  );
}
