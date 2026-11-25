import { defineType } from 'sanity';

export default defineType({
  name: 'insightPage',
  title: 'Insight Page',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string' },
    { name: 'description', title: 'Introduction', type: 'text', description: 'Optional editorial introduction for the Insights page.' },
            { name: 'seo', title: 'SEO', type: 'seo' }
  ],
});
