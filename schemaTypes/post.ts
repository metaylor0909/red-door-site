import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'post',
  title: 'Blog Post',
  type: 'document',
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'seo', title: 'SEO'},
    {name: 'migration', title: 'Migration'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'content',
      description:
        'Must match the existing live URL exactly (e.g. "5-tips-for-getting-the-best-return-on-your-investment-property") — preserving every existing URL is a hard rule for this migration. Do not regenerate from the title for already-published posts.',
      options: {source: 'title', maxLength: 200},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{type: 'author'}],
      group: 'content',
      description:
        'Optional — leave blank for posts where the source archive had no real byline (see the "System" author note in schemaTypes/author.ts).',
    }),
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'category'}]}],
      group: 'content',
    }),
    defineField({
      name: 'mainImage',
      title: 'Featured image',
      type: 'image',
      group: 'content',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      group: 'content',
      description: 'Short summary used on index/card views. Falls back to the meta description if left blank.',
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'blockContent',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
    }),
    defineField({
      name: 'legacyUrl',
      title: 'Legacy URL',
      type: 'url',
      group: 'migration',
      readOnly: true,
      description:
        'The exact reddoorrents.com URL this post was migrated from. Kept for QA traceability during the migration, not shown on the site.',
    }),
    defineField({
      name: 'legacyAuthorRaw',
      title: 'Legacy author (raw)',
      type: 'string',
      group: 'migration',
      readOnly: true,
      description:
        'The unedited author string scraped from the old site (e.g. "RAIZEL ANN NAME" or "System"), kept for reference until the real author mapping is confirmed. Not shown on the site.',
    }),
  ],
  preview: {
    select: {title: 'title', media: 'mainImage', date: 'publishedAt'},
    prepare: ({title, media, date}) => ({
      title,
      subtitle: date ? new Date(date).toLocaleDateString() : 'No date',
      media,
    }),
  },
})
