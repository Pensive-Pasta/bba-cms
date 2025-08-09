import { defineType } from 'sanity';

export default defineType({
  name: 'insight',
  title: 'Insight',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string' },
    { name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title', maxLength: 96 } },
    {
  name: 'publishedAt',
  title: 'Published Date',
  type: 'datetime',
  initialValue: () => new Date().toISOString(),
},
    {
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: ['news', 'projects', 'thinking'],
        layout: 'radio',
      },
      initialValue: 'news',
    },
    {
      name: 'contentBlocks',
      title: 'Content Blocks',
      type: 'array',
      of: [
        { type: 'textBlock' },
        { type: 'imageBlock' },
      ],
    },
    {
  name: "seo",
  title: "SEO",
  type: "object",
  options: { collapsible: true, collapsed: true },
  fields: [
    { name: "metaTitle", title: "Meta Title", type: "string" },
    { name: "metaDescription", title: "Meta Description", type: "text", rows: 3 },
    { name: "ogImage", title: "OG Image", type: "image", options: { hotspot: true }, description: "This image will be used on social media and search engines" },
  ]
}
  ],
});