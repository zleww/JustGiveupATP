// The technology the three sites are built with. Same list on L-Lawliet, JurisCards and the Arena.
import type { IconType } from "react-icons";
import {
  SiCss, SiFastapi, SiGmail, SiGoogle, SiGreensock, SiHtml5, SiJavascript, SiJsonwebtokens,
  SiNeon, SiPostgresql, SiPydantic, SiPython, SiReact, SiTailwindcss, SiTypescript, SiVercel, SiVite,
} from "react-icons/si";

export const STACK: { label: string; Icon: IconType }[] = [
  { label: "Neon PostgreSQL", Icon: SiNeon },
  { label: "PostgreSQL", Icon: SiPostgresql },
  { label: "Python", Icon: SiPython },
  { label: "FastAPI", Icon: SiFastapi },
  { label: "Pydantic", Icon: SiPydantic },
  { label: "JWT", Icon: SiJsonwebtokens },
  { label: "Google Sign-In", Icon: SiGoogle },
  { label: "Gmail SMTP", Icon: SiGmail },
  { label: "Vercel", Icon: SiVercel },
  { label: "HTML", Icon: SiHtml5 },
  { label: "CSS", Icon: SiCss },
  { label: "JavaScript", Icon: SiJavascript },
  { label: "React", Icon: SiReact },
  { label: "TypeScript", Icon: SiTypescript },
  { label: "Tailwind CSS", Icon: SiTailwindcss },
  { label: "GSAP", Icon: SiGreensock },
  { label: "Vite", Icon: SiVite },
];

/** The request path, left to right. Facts from the API code and deployment settings. */
export const ARCHITECTURE = [
  {
    title: "Three static sites",
    sub: "HTML, CSS, JavaScript",
    points: ["L-Lawliet, JurisCards, JurisCards Arena", "Login token in sessionStorage", "Same API, one account"],
  },
  {
    title: "Vercel",
    sub: "Hosting, region sin1",
    points: ["Static files from the CDN", "/api/* to one Python function", "Secrets only in env variables"],
  },
  {
    title: "FastAPI",
    sub: "Python serverless API",
    points: ["Pydantic checks every request", "JWT sessions, bcrypt passwords", "Lockout after 5 wrong passwords"],
  },
  {
    title: "Neon PostgreSQL",
    sub: "Singapore, pooled TLS",
    points: ["Least-privilege lawliet_app role", "Row-Level Security policies", "Column-level UPDATE grants"],
  },
] as const;
