import { defineField, defineType } from 'sanity';

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
    defineField({
      name: 'heroVideo',
      title: 'Desktop hero video (optional)',
      type: 'file',
      options: { accept: 'video/mp4,video/webm' },
      description: 'Replaces the desktop Hero Image visually. Keep Hero Image as the poster/fallback and project tile. Use a short, compressed landscape montage (1920 × 1080), without audio.',
      validation: (rule) => rule.custom((file) =>
        !file?.asset?._ref || /-(mp4|webm)$/i.test(file.asset._ref)
          ? true
          : 'Please upload an MP4 or WebM video.'
      ),
    }),
    defineField({
      name: 'mobileHeroImage',
      title: 'Mobile hero image (optional)',
      type: 'image',
      options: { hotspot: true },
      description: 'Portrait-friendly image (for example 1080 × 1920). Overrides desktop media on mobile when no mobile video is provided; also used as the mobile video poster. Leave empty to reuse the desktop image/media.',
      fields: [{ name: 'altText', title: 'Alt Text', type: 'string' }],
    }),
    defineField({
      name: 'mobileHeroVideo',
      title: 'Mobile hero video (optional)',
      type: 'file',
      options: { accept: 'video/mp4,video/webm' },
      description: 'Overrides other hero media on mobile. Use a short, compressed portrait-friendly montage (1080 × 1920), without audio. If empty, mobile image takes priority, then desktop video, then Hero Image.',
      validation: (rule) => rule.custom((file) =>
        !file?.asset?._ref || /-(mp4|webm)$/i.test(file.asset._ref)
          ? true
          : 'Please upload an MP4 or WebM video.'
      ),
    }),
    {
      name: 'contentBlocks',
      title: 'Content Blocks',
      type: 'array',
      of: [
        { type: 'textBlock' },
        { type: 'imageBlock' },
        { type: 'galleryBlock' },
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
