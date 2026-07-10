import { defineField, defineType } from "sanity";

const locationFields = [
  defineField({ name: "label", title: "Card Label", type: "string" }),
  defineField({
    name: "addressLines",
    title: "Address Lines",
    type: "array",
    of: [{ type: "string" }],
  }),
  defineField({ name: "postcodeBadge", title: "Postcode Badge", type: "string" }),
  defineField({
    name: "mapsLink",
    title: "Google Maps Link (opens in new tab)",
    type: "url",
    validation: (r) => r.uri({ scheme: ["http", "https"] }),
  }),
  defineField({
    name: "embedSrc",
    title: "Google Maps Iframe SRC",
    type: "url",
    validation: (r) => r.required().uri({ scheme: ["http", "https"] }),
  }),
];

export default defineType({
  name: "contactPage",
  title: "Contact Page",
  type: "document",
  initialValue: {
    mapCards: { locationA: {}, locationB: {} }, // two empty slots ready
  },
  fields: [
    defineField({ name: "title", title: "Page Title", type: "string", validation: (r) => r.required() }),
    defineField({ name: "description", title: "Intro Description", type: "text", rows: 6, validation: (r) => r.required() }),
    defineField({ name: "email", title: "Email", type: "email", validation: (r) => r.required() }),
    defineField({
      name: "tel",
      title: "Telephone",
      type: "string",
      validation: (r) => r.required().regex(/^[+()0-9\s-]+$/, { name: "phone number" }),
    }),

    // Strict two-card group
    defineField({
      name: "mapCards",
      title: "Map Cards",
      type: "object",
      options: { collapsible: true, collapsed: false },
      fields: [
        defineField({
          name: "locationA",
          title: "Location A",
          type: "object",
          fields: locationFields,
          validation: (r) => r.required().custom((v) =>
            v?.embedSrc ? true : "Location A: embedSrc is required"
          ),
        }),
        defineField({
          name: "locationB",
          title: "Location B",
          type: "object",
          fields: locationFields,
          validation: (r) => r.required().custom((v) =>
            v?.embedSrc ? true : "Location B: embedSrc is required"
          ),
        }),
      ],
      validation: (r) =>
        r.custom((v) => (v?.locationA && v?.locationB ? true : "Provide both locations.")),
    }),

    // SEO
    defineField({
      name: "seo",
      title: "SEO Settings",
      type: "object",
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: "metaTitle", title: "Meta Title", type: "string", validation: (r) => r.required().max(60) }),
        defineField({ name: "metaDescription", title: "Meta Description", type: "text", rows: 3, validation: (r) => r.max(160) }),
        defineField({ name: "ogImage", title: "OG Image", type: "image", options: { hotspot: true }, description: "This image will be used on social media and search engines" }),
      ],
    }),
  ],
  preview: { select: { title: "title", subtitle: "email" } },
});
