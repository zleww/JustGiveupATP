# Landing page

React + Vite + TypeScript + Tailwind, with GSAP (ScrollTrigger, SplitText, Flip), Lenis and
React Bits components. The rest of the site is plain HTML, so this folder is built locally
and its output is committed: `../landing.html` and `../landing-assets/`.

```
cd landing
npm install
npm run build      # cleans ../landing-assets, type-checks, writes ../landing.html
npm run dev        # http://localhost:5173/landing.html (links to other pages only work after a build)
```

- All copy and screenshots for this site: `src/content.ts` and `src/assets/`.
- Sections: `src/components/sections/`. React Bits sources (TS + Tailwind): `src/components/reactbits/`.
- GSAP plugins are registered once in `src/lib/gsap.ts`.
- The sections, `src/lib`, `src/stack.tsx` and the React Bits files are the same on
  L-Lawliet, JurisCards and the Arena; only `content.ts`, `landing.html` and the assets differ.
