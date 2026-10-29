import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

import { CATEGORIES } from "./lib/taxonomy";

/**
 * Blog posts. The schema is the contract described in docs/agents/content.md:
 * `draft` is required on purpose so a post is never published by omission.
 */
const posts = defineCollection({
  loader: glob({ base: "./src/content/posts", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(10),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().nullable().optional(),
    tags: z.array(z.string().trim().min(1)).default([]),
    category: z.enum(CATEGORIES),
    draft: z.boolean(),
  }),
});

export const collections = { posts };
