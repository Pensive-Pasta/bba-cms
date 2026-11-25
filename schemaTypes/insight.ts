import { defineType } from 'sanity';

export default defineType({
  name: 'insight',
  title: 'Insight',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required() },
    { name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title', maxLength: 96 }, validation: (rule) => rule.required() },
    {
  name: 'publishedAt',
  title: 'Published Date',
  description: 'Displayed article date. Use Publish or Unpublish to control visibility; this date does not schedule publication.',
  validation: (rule) => rule.required(),
  type: 'datetime',
  initialValue: () => new Date().toISOString(),
},
    {
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          { title: 'News', value: 'news' },
          { title: 'Projects', value: 'projects' },
          { title: 'Perspectives', value: 'thinking' },
        ],
        layout: 'radio',
      },
      initialValue: 'news',
    },
    {
      name: 'contentBlocks',
      title: 'Content Blocks',
      description: 'Manage article readiness editorially. Published Insights appear on the website regardless of their content.',
      type: 'array',
      of: [
        { type: 'textBlock' },
        { type: 'imageBlock' },
        { type: 'galleryBlock' },
      ],
    },
    { name: 'seo', title: 'SEO', type: 'seo' }
  ],
});