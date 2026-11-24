import type { Shot } from "../../types";

interface Props {
  shot: Shot;
  eager?: boolean;
  className?: string;
}

/** A screenshot in a minimal browser window. 1440x900 source, 960px version for small screens. */
export default function BrowserFrame({ shot, eager = false, className = "" }: Props) {
  return (
    <figure className={`overflow-hidden rounded-2xl border border-line-strong bg-surface shadow-[0_40px_120px_-40px_rgb(0_0_0/0.9)] ${className}`}>
      <div className="flex items-center gap-3 border-b border-line bg-surface-2/80 px-4 py-2.5" aria-hidden="true">
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        </span>
        <span className="mx-auto w-full max-w-sm truncate rounded-md bg-white/5 px-3 py-1 text-center text-[11px] text-muted">
          {shot.url}
        </span>
        <span className="w-[42px]" />
      </div>
      <img
        src={shot.src}
        srcSet={`${shot.small} 960w, ${shot.src} 1440w`}
        sizes="(min-width: 1200px) 1140px, 100vw"
        width={1440}
        height={900}
        alt={shot.alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={eager ? "high" : "auto"}
        className="block aspect-[16/10] w-full object-cover object-top"
      />
    </figure>
  );
}
