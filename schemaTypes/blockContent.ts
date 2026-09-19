import {defineType, defineArrayMember, defineField} from 'sanity'

/**
 * Portable Text schema for post bodies.
 *
 * Scoped to what the real 309-post archive actually contains (surveyed
 * directly from red-door-pmw-website-scrape/archive/blog/*.html rather than
 * guessed at): plain paragraphs, h2-h4 headings, bold/italic/underline,
 * bullet and numbered lists, links, blockquotes, inline images, a
 * meaningful number of YouTube embeds (218 iframes across the archive), and
 * a small number of simple data tables (29). No blog post used inline
 * scripts or anything else that needs special handling.
 */
export default defineType({
  name: 'blockContent',
  title: 'Body',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        {title: 'Normal', value: 'normal'},
        {title: 'H2', value: 'h2'},
        {title: 'H3', value: 'h3'},
        {title: 'H4', value: 'h4'},
        {title: 'Quote', value: 'blockquote'},
      ],
      lists: [
        {title: 'Bullet', value: 'bullet'},
        {title: 'Numbered', value: 'number'},
      ],
      marks: {
        decorators: [
          {title: 'Bold', value: 'strong'},
          {title: 'Italic', value: 'em'},
          {title: 'Underline', value: 'underline'},
        ],
        annotations: [
          {
            name: 'link',
            title: 'Link',
            type: 'object',
            fields: [
              defineField({
                name: 'href',
                title: 'URL',
                type: 'url',
                validation: (Rule) =>
                  Rule.uri({allowRelative: true, scheme: ['http', 'https', 'mailto', 'tel']}),
              }),
            ],
          },
        ],
      },
    }),
    defineArrayMember({
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          description: 'Required for accessibility and SEO.',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'caption',
          title: 'Caption',
          type: 'string',
        }),
      ],
    }),
    defineArrayMember({
      type: 'object',
      name: 'youtubeEmbed',
      title: 'YouTube video',
      fields: [
        defineField({
          name: 'url',
          title: 'YouTube URL',
          type: 'url',
          validation: (Rule) => Rule.required(),
        }),
      ],
      preview: {
        select: {url: 'url'},
        prepare: ({url}) => ({title: 'YouTube video', subtitle: url}),
      },
    }),
    defineArrayMember({
      type: 'object',
      name: 'table',
      title: 'Table',
      fields: [
        defineField({
          name: 'rows',
          title: 'Rows',
          type: 'array',
          of: [
            {
              type: 'object',
              name: 'row',
              fields: [
                defineField({
                  name: 'cells',
                  title: 'Cells',
                  type: 'array',
                  of: [{type: 'string'}],
                }),
              ],
            },
          ],
        }),
      ],
    }),
  ],
})
