// @ts-check
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
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
