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
}
  ],
});