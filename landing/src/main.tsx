import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./theme"; // this site's fonts
import "./lib/gsap"; // registers the GSAP plugins once, before any component uses them
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
