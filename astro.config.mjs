// @ts-check
import 'dotenv/config';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sanity from '@sanity/astro';

// https://astro.build/config
export default defineConfig({
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
