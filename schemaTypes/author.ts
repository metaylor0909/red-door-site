import {defineType, defineField} from 'sanity'

/**
 * Author is its own document type (not a plain string on the post) so a
 * byline can carry a photo/bio later and so the migration script can map
 * the 5 raw author strings found in the source archive
 * (red-door-pmw-website-scrape/archive/blog/*.html) onto a small, clean
 * set of real records instead of importing the raw values verbatim:
 *   - "Michael Taylor" (92 posts), "Carlos Piñón" (58), "Chris Knight" (51)
 *     — real people, straightforward.
 *   - "RAIZEL ANN NAME" (64 posts) — reads like an unfilled template
 *     field on the old site, not a real name. Needs a real mapping before
 *     import; do not create an author record with this literal value.
 *   - "System" (44 posts) — likely auto-generated/bulk content with no
 *     real byline. Needs a decision: attribute to the company generally,
 *     or omit the author field for these posts (it's optional on `post`
 *     for exactly this reason).
 */
export default defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'name', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'text',
      rows: 3,
    }),
  ],
  preview: {
    select: {title: 'name', media: 'photo'},
  },
})
