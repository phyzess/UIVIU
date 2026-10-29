// @ts-check
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// RSS, canonical URLs, Open Graph URLs, the sitemap and the footer domain all
// derive from this value.
const SITE = "https://uiviu.me";

// https://astro.build/config
export default defineConfig({
  site: SITE,
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    shikiConfig: {
      // One light theme: the site is a paper-white surface by design, so a
      // dark-mode pair would only add CSS the site never uses.
      theme: "github-light",
    },
  },
});
