import { defineType } from 'sanity';

export default defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string' },
    { name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title', maxLength: 96 } },
    { name: 'postCode', title: 'Post Code', type: 'string' },
    { name: 'county', title: 'County', type: 'string' },
    { name: 'year', title: 'Year', type: 'number' },
    {
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: ['urban', 'inter-urban', 'rural'],
        layout: 'radio',
      },
      initialValue: 'urban',
    },
    {
  name: 'heroImage',
  title: 'Hero Image',
  type: 'image',
  options: { hotspot: true },
  fields: [
    {
      name: 'altText',
      title: 'Alt Text',
      type: 'string',
    },
    ],
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
  name: 'credits',
  title: 'Credits',
  type: 'array',
  of: [
    {
      type: 'object',
      fields: [
        { name: 'label', title: 'Label', type: 'string' },
        { name: 'value', title: 'Value', type: 'string' },
      ],
      preview: {
        select: { title: 'label', subtitle: 'value' },
      },
    },
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
