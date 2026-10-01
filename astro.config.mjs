// @ts-check
import 'dotenv/config';
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import sanity from '@sanity/astro';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Stays 'static' (the default) — every existing page keeps prerendering
  // exactly as before. The Cloudflare adapter only matters for the two new
  // rental-analysis routes, which opt into SSR individually via
  // `export const prerender = false` rather than flipping this site-wide.
  adapter: cloudflare(),
  integrations: [
    react(),
    sanity({
      projectId: process.env.SANITY_PROJECT_ID || 'placeholder-project',
      dataset: process.env.SANITY_DATASET || 'production',
      useCdn: false,
      studioBasePath: '/studio',
    }),
  ],
  vite: {
    // Only the rent-vs-sell calculator island uses Tailwind; its stylesheet
    // limits class scanning to its own folder and skips preflight.
    plugins: [tailwindcss()],
    // The embedded Studio (sanity + @sanity/vision) trips up Vite's dev-mode
    // dependency pre-bundler — it works fine in a real production build,
    // but `astro dev`'s optimizer throws hundreds of false MISSING_EXPORT
    // errors on these specific packages. Excluding them from pre-bundling
    // (they're already valid ESM, so no optimization is needed) fixes it.
    optimizeDeps: {
      exclude: ['sanity', '@sanity/vision', '@sanity/astro', 'styled-components'],
    },
  },
});
