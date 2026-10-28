// @ts-check
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// TODO(deploy): replace with the production domain. RSS, canonical URLs and the
// sitemap all derive absolute URLs from this value, so nothing else needs to
// change when the real domain is known.
const SITE = "https://uiviu.example.com";

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
