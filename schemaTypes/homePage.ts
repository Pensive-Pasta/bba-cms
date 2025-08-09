import { defineType, defineField } from "sanity";

export default defineType({
  name: "homePage",
  title: "Home Page",
  type: "document",

  fields: [
    defineField({ name: "title", title: "Title", type: "string" }),
    defineField({ name: "intro", title: "Intro", type: "text" }),
    defineField({
      name: "featuredPage",
      title: "Featured Page",
      type: "object",
      fields: [
        defineField({ name: "pageTitle", title: "Page Title", type: "string" }),
        defineField({ name: "pageSlug", title: "Page Slug", type: "string" }),
      ],
    }),
    
    defineField({
      name: "seo",
      title: "SEO",
      type: "object",
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: "metaTitle", title: "Meta Title", type: "string", validation: r => r.max(60) }),
        defineField({ name: "metaDescription", title: "Meta Description", type: "text", rows: 3, validation: r => r.max(160) }),
      ],
    }),
  ],
});