import { defineType } from 'sanity';

export default defineType({
  name: 'workPage',
  title: 'Work Page',
  type: 'document',
  fields: [
    { name: 'title', title: 'Page Title', type: 'string' },
    {
      name: 'projects', title: 'Work grid case studies', type: 'array',
      description: 'Select published case studies and drag to reorder. Only enabled project pages with photography appear. The complete Work index is independent of this selection.',
      of: [{ type: 'reference', to: [{ type: 'project' }], options: { filter: 'caseStudyEnabled == true && defined(heroImage.asset)' } }],
      validation: (rule) => rule.unique(),
    },
    { name: 'description', title: 'Page Description', type: 'text' },
        { name: 'seo', title: 'SEO', type: 'seo' }
  ],
});
