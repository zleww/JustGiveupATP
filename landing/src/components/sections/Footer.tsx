import { SiGithub } from "react-icons/si";
import { site } from "../../content";

export default function Footer() {
  const { footer } = site;
  return (
    <footer className="border-t border-line py-14">
      <div className="container-page grid gap-10 md:grid-cols-12">
        <div className="md:col-span-5">
          <a href={site.homeHref} className="inline-flex items-center gap-2.5" aria-label={`${site.name} home`}>
            <img src={site.logo} alt="" width={28} height={29} className="h-7 w-auto" loading="lazy" />
            <span className="font-display text-lg font-semibold tracking-tight">{site.name}</span>
          </a>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">{footer.description}</p>
          <a href={footer.github} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-full border border-line-strong px-4 py-2 text-sm text-muted transition-colors hover:text-ink">
            <SiGithub aria-hidden="true" /> View on GitHub
          </a>
        </div>

        <nav aria-label="Site" className="md:col-span-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">Site</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {footer.links.map((l) => (
              <li key={l.href}><a href={l.href} className="text-muted transition-colors hover:text-ink">{l.label}</a></li>
            ))}
            <li><a href={site.login.href} className="text-muted transition-colors hover:text-ink">{site.login.label}</a></li>
          </ul>
        </nav>

        <nav aria-label="Sister sites" className="md:col-span-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">Same account works on</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {footer.sisters.map((s) => (
              <li key={s.href}>
                <a href={s.href} className="text-ink transition-colors hover:text-accent-ink">{s.label}</a>
                <span className="block text-faint">{s.note}</span>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="container-page mt-12 flex flex-col gap-2 border-t border-line pt-6 text-xs text-faint sm:flex-row sm:justify-between">
        <p>© {footer.year} {site.name}</p>
        <p>{footer.disclaimer}</p>
      </div>
    </footer>
  );
}
