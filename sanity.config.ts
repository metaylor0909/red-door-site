import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

/**
 * Standalone Sanity Studio config for the blog migration.
 *
 * PROJECT_ID and DATASET are not real yet — there is no live Sanity
 * project for this site as of this file's creation. Once one exists
 * (Free tier, per CLAUDE.md's "Sanity plan" decision), set:
 *   SANITY_PROJECT_ID=<real project id>
 *   SANITY_DATASET=production
 * in a local .env file (already gitignored) before running `npx sanity dev`.
 */
export default defineConfig({
  name: 'red-door-rents',
  title: 'Red Door Property Management',

  projectId: process.env.SANITY_PROJECT_ID || 'placeholder-project',
  dataset: process.env.SANITY_DATASET || 'production',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
