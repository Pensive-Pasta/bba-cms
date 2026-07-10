import { defineType } from 'sanity';

export default defineType({
  name: 'insightPage',
  title: 'Insight Page',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string' },
            {
          name: "seo",
          title: "SEO",
          type: "object",
          options: { collapsible: true, collapsed: true },
          fields: [
                    { name: "metaTitle", title: "Meta Title", type: "string", validation: (r) => r.required().max(60) },
                    { name: "metaDescription", title: "Meta Description", type: "text", rows: 3, validation: (r) => r.max(160) },
                    { name: "ogImage", title: "OG Image", type: "image", options: { hotspot: true }, description: "This image will be used on social media and search engines" },
                  ]
        }
  ],
});
