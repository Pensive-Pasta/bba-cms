import { defineArrayMember, defineField, defineType } from "sanity";

const seoFields = [
  defineField({
    name: "metaTitle",
    title: "Meta Title",
    type: "string",
    validation: (rule) => rule.required().max(60),
  }),
  defineField({
    name: "metaDescription",
    title: "Meta Description",
    type: "text",
    rows: 3,
    validation: (rule) => rule.max(160),
  }),
  defineField({
    name: "ogImage",
    title: "OG Image",
    type: "image",
    options: { hotspot: true },
    description: "This image will be used on social media and search engines",
  }),
];

export default defineType({
  name: "legalPage",
  title: "Legal Page",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Page Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "lastUpdated",
      title: "Last Updated",
      type: "date",
      options: { dateFormat: "D MMMM YYYY" },
    }),
    defineField({
      name: "body",
      title: "Body Content",
      type: "array",
      of: [
        defineArrayMember({
          type: "block",
          styles: [
            { title: "Normal", value: "normal" },
            { title: "H2", value: "h2" },
            { title: "H3", value: "h3" },
            { title: "H4", value: "h4" },
            { title: "Blockquote", value: "blockquote" },
          ],
          lists: [
            { title: "Bullet", value: "bullet" },
            { title: "Numbered", value: "number" },
          ],
          marks: {
            decorators: [
              { title: "Strong", value: "strong" },
              { title: "Emphasis", value: "em" },
              { title: "Underline", value: "underline" },
              { title: "Code", value: "code" },
            ],
            annotations: [
              defineField({
                name: "link",
                title: "Link",
                type: "object",
                fields: [
                  defineField({
                    name: "href",
                    title: "URL",
                    type: "url",
                    validation: (rule) =>
                      rule.uri({
                        allowRelative: true,
                        scheme: ["http", "https", "mailto", "tel"],
                      }),
                  }),
                  defineField({
                    name: "blank",
                    title: "Open in new tab",
                    type: "boolean",
                    initialValue: false,
                  }),
                ],
              }),
            ],
          },
        }),
      ],
      validation: (rule) => rule.required(),
      description:
        "Add the full legal page content here. Headings, lists, links and inline formatting are supported.",
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "object",
      options: { collapsible: true, collapsed: true },
      fields: seoFields,
    }),
  ],
  preview: {
    select: {
      title: "title",
      lastUpdated: "lastUpdated",
    },
    prepare({ title, lastUpdated }) {
      return {
        title: title || "Legal Page",
        subtitle: lastUpdated ? `Updated ${lastUpdated}` : "No update date set",
      };
    },
  },
});
