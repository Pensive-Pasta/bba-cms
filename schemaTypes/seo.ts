import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'seo', title: 'SEO', type: 'object',
  options: {collapsible: true, collapsed: true},
  description: 'Optional overrides. The website otherwise uses the page title, published introduction and a relevant project/article image, falling back to the BBA logo.',
  fields: [
    defineField({name: 'metaTitle', title: 'Search and sharing title', type: 'string', description: 'Leave blank to use the page title and practice name. Keep it specific to this page.', validation: rule => rule.max(70).warning('Long titles may be shortened in search results.')}),
    defineField({name: 'metaDescription', title: 'Search and sharing description', type: 'text', rows: 3, description: 'Leave blank to use an excerpt of the published introduction. Describe this page naturally; do not repeat keywords.', validation: rule => rule.max(170).warning('Long descriptions may be shortened in search results.')}),
    defineField({name: 'ogImage', title: 'Social sharing image', type: 'image', options: {hotspot: true}, description: 'Optional. Defaults to project photography or the first article image, then the BBA logo. A landscape image around 1200 × 630 works well.', fields: [defineField({name: 'altText', title: 'Image description', type: 'string', description: 'Describe what is visible. Leave empty only for a decorative image; shared asset alt text is reused when no local description is supplied.'})]}),
  ],
})
