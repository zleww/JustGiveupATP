import { useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { gsap, MQ, ScrollTrigger, useGSAP } from "../../lib/gsap";
import { useLenis, useScrollToSection } from "../SmoothScroll";
import { site } from "../../content";

export default function Navbar() {
  const navRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const scrollTo = useScrollToSection();
  const lenis = useLenis();

  // Transparent at the top; a blurred glass pill fades and scales in after 50px.
  useGSAP(() => {
    ScrollTrigger.create({
      start: 50,
      end: "max",
      toggleClass: { targets: navRef.current!, className: "is-scrolled" },
    });
  }, { scope: navRef });

  // Full-screen phone menu: backdrop fades in, links rise in one after another.
  const { contextSafe } = useGSAP({ scope: menuRef });
  const setMenu = contextSafe((next: boolean) => {
    const menu = menuRef.current!;
    const links = menu.querySelectorAll("[data-menu-item]");
    const reduce = window.matchMedia(MQ.reduce).matches;
    gsap.killTweensOf([menu, links]);
    if (next) {
      setOpen(true);
      lenis?.stop();
      gsap.set(menu, { visibility: "visible" });
      gsap.fromTo(menu, { opacity: 0 }, { opacity: 1, duration: reduce ? 0.15 : 0.35, ease: "power2.out" });
      if (!reduce) gsap.fromTo(links, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "expo.out", stagger: 0.06, delay: 0.05 });
      else gsap.set(links, { opacity: 1, y: 0 });
      requestAnimationFrame(() => menu.querySelector<HTMLElement>("a, button")?.focus());
    } else {
      setOpen(false);
      lenis?.start();
      gsap.to(menu, { opacity: 0, duration: reduce ? 0.1 : 0.25, ease: "power2.in", onComplete: () => { gsap.set(menu, { visibility: "hidden" }); } });
      toggleRef.current?.focus();
    }
  });

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (open) setMenu(false);
    scrollTo(id);
  };

  return (
    <header ref={navRef} className="group fixed inset-x-0 top-0 z-50 pt-3 md:pt-4">
      <nav aria-label="Main" className="container-page">
        <div className="relative flex h-14 items-center justify-between gap-4 px-2 md:px-4">
          {/* The pill: only its opacity and scale change, so nothing around it moves */}
          <div
            aria-hidden="true"
            className="glass pointer-events-none absolute inset-0 scale-[0.98] rounded-full opacity-0 transition-[opacity,transform] duration-500 ease-[var(--ease-expo)] group-[.is-scrolled]:scale-100 group-[.is-scrolled]:opacity-100"
            style={{ background: "color-mix(in srgb, var(--color-surface) 70%, transparent)" }}
          />
          <a href={site.homeHref} className="relative flex items-center gap-2.5 rounded-full pl-1 pr-2" aria-label={`${site.name} home`}>
            <img src={site.logo} alt="" width={30} height={31} className="h-[30px] w-auto" />
            <span className="font-display text-lg font-semibold tracking-tight">{site.name}</span>
          </a>

          <ul className="relative hidden items-center gap-1 lg:flex">
            {site.nav.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} onClick={go(item.id)} className="rounded-full px-4 py-2 text-sm text-muted transition-colors hover:bg-white/5 hover:text-ink">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="relative hidden items-center gap-2 lg:flex">
            <a href={site.login.href} className="rounded-full px-4 py-2 text-sm text-muted transition-colors hover:text-ink">{site.login.label}</a>
            <a href={site.signup.href} className="btn btn-primary !min-h-10 !px-5 text-sm">Sign up free</a>
          </div>

          <button
            ref={toggleRef}
            type="button"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-white/5 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setMenu(!open)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      <div
        ref={menuRef}
        id="mobile-menu"
        className="invisible fixed inset-0 top-0 -z-10 bg-bg/95 opacity-0 backdrop-blur-xl lg:hidden"
        onKeyDown={(e) => { if (e.key === "Escape") setMenu(false); }}
        aria-hidden={!open}
        inert={!open}
      >
        <div className="container-page flex h-full flex-col justify-center gap-2 pb-10 pt-24">
          {site.nav.map((item) => (
            <a key={item.id} data-menu-item href={`#${item.id}`} onClick={go(item.id)} className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              {item.label}
            </a>
          ))}
          <div data-menu-item className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href={site.signup.href} className="btn btn-primary">Sign up free</a>
            <a href={site.login.href} className="btn btn-ghost">{site.login.label}</a>
          </div>
        </div>
      </div>
    </header>
  );
}
