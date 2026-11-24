import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// The site itself is plain HTML with no build step on Vercel. This app is built locally
// and its output is committed: ../landing.html plus hashed files in ../landing-assets/.
export default defineConfig({
  root: __dirname,
  base: "./",
  publicDir: false,
  plugins: [react(), tailwindcss()],
  build: {
    outDir: resolve(__dirname, ".."),
    emptyOutDir: false, // the output folder is the whole site; scripts/clean.mjs clears only landing-assets
    assetsDir: "landing-assets",
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 700,
    rollupOptions: { input: resolve(__dirname, "landing.html") },
  },
});
