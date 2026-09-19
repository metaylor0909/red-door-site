import {defineType, defineField} from 'sanity'

/**
 * Optional. The source archive has no categories or tags at all — every
 * post's tag list came back empty in the scrape — so this type exists but
 * starts unused. Nothing in the migration script should invent categories;
 * add real ones here later if/when Red Door wants a taxonomy, then assign
 * them to posts by hand or in a follow-up pass.
 */
export default defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
  ],
})
