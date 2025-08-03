import { defineType } from 'sanity';

export default defineType({
  name: 'workPage',
  title: 'Work Page',
  type: 'document',
  fields: [
    { name: 'title', title: 'Page Title', type: 'string' },
    { name: 'description', title: 'Page Description', type: 'text' },
  ],
});