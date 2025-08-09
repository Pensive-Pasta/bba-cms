import { defineType } from 'sanity';

export default defineType({
  name: 'studioPage',
  title: 'Studio Page',
  type: 'document',
  groups: [
    { name: 'profile', title: 'Profile' },
    { name: 'people', title: 'People' },
    { name: 'values', title: 'Values' },
    { name: 'awards', title: 'Awards' },
  ],
  fields: [
    {
      name: 'profileBlocks',
      title: 'Profile Content',
      type: 'array',
      group: 'profile',
      of: [{ type: 'textBlock' }, { type: 'imageBlock' }],
    },
    {
  name: 'peopleIntro',
  title: 'People Intro Text',
  type: 'textBlock', // reuse your existing textBlock schema
  group: 'people',
},
{
  name: 'people',
  title: 'People List',
  type: 'array',
  group: 'people',
  of: [{ type: 'person' }],
},
    {
      name: 'valuesBlocks',
      title: 'Values Content',
      type: 'array',
      group: 'values',
      of: [{ type: 'textBlock' }, { type: 'imageBlock' }],
    },
    {
      name: 'awardsBlocks',
      title: 'Awards Content',
      type: 'array',
      group: 'awards',
      of: [{ type: 'textBlock' }, { type: 'imageBlock' }],
    },

            {
          name: "seo",
          title: "SEO",
          type: "object",
          options: { collapsible: true, collapsed: true },
          fields: [
                    { name: "metaTitle", title: "Meta Title", type: "string", validation: (r) => r.required().max(60) },
                    { name: "metaDescription", title: "Meta Description", type: "text", rows: 3, validation: (r) => r.max(160) },
                  ]
        }
  ],

  // ADD THIS:
  preview: {
    prepare() {
      return {
        title: 'Studio Page',
      };
    },
  },
});