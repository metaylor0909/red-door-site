import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

/**
 * Standalone Sanity Studio config for the blog migration.
 *
 * This file gets bundled and shipped to the BROWSER (it's the live Studio
 * app, not just a build-time reference), so it can only read `PUBLIC_`-
 * prefixed variables via `import.meta.env` — there is no `process.env` in
 * a browser at all. Set PUBLIC_SANITY_PROJECT_ID / PUBLIC_SANITY_DATASET
 * in a local .env file (already gitignored, see .env.example).
 */
export default defineConfig({
  name: 'red-door-rents',
  title: 'Red Door Property Management',

  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID || 'placeholder-project',
  dataset: import.meta.env.PUBLIC_SANITY_DATASET || 'production',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
