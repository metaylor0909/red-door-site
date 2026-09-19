import {defineType, defineField} from 'sanity'

/**
 * Shared SEO fields, reused on the post type (and later on any other
 * document type that needs its own title/meta override).
 */
export default defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'SEO title',
      type: 'string',
      description:
        'Overrides the <title> tag. Falls back to the post title if left blank. Keep under 60 characters where possible.',
      validation: (Rule) => Rule.max(70).warning('Titles over ~60 characters get truncated in search results.'),
    }),
    defineField({
      name: 'description',
      title: 'Meta description',
      type: 'text',
      rows: 3,
      validation: (Rule) =>
        Rule.max(200).warning('Meta descriptions over ~160 characters get truncated in search results.'),
    }),
  ],
})
