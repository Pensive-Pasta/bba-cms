import { defineType } from 'sanity';

export default defineType({
  name: 'customImage',
  type: 'image',
  title: 'Image with metadata',
  options: {
    hotspot: true,
  },
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'altText',
      type: 'string',
      title: 'Alt Text',
      description: 'Used for SEO and screen readers. Will fall back to title if left empty.',
    },
  ],
});