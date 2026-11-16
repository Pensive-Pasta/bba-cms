import { defineType, defineField } from "sanity";

export default defineType({
  name: "homePage",
  title: "Home Page",
  type: "document",

  fields: [
    defineField({ name: "title", title: "Title", type: "string" }),
    defineField({ name: "intro", title: "Intro", type: "text" }),
    // Visitor introduction content. Optional so existing documents remain valid.
    defineField({ name: "landingHeading", title: "Visitor introduction heading", type: "string", description: "Short heading over the full-screen introduction. Falls back to the homepage title." }),
    defineField({ name: "landingText", title: "Visitor introduction supporting text", type: "text", rows: 3 }),
    defineField({ name: "heroImage", title: "Visitor introduction desktop image", type: "image", options: { hotspot: true }, fields: [{ name: "altText", title: "Alt text", type: "string" }], description: "A single architectural image. Also the fallback for video; the website uses its existing Copper House photograph if empty." }),
    defineField({ name: "heroVideo", title: "Visitor introduction desktop video", type: "file", options: { accept: "video/mp4,video/webm" }, description: "Optional short, compressed video without audio. Keep an image for reduced motion and playback failures.", validation: rule => rule.custom(file => !file?.asset?._ref || /-(mp4|webm)$/i.test(file.asset._ref) ? true : "Please upload an MP4 or WebM video.") }),
    defineField({ name: "mobileHeroImage", title: "Visitor introduction mobile image", type: "image", options: { hotspot: true }, fields: [{ name: "altText", title: "Alt text", type: "string" }], description: "Optional portrait-friendly alternative. If supplied without a mobile video, this replaces desktop video on mobile." }),
    defineField({ name: "mobileHeroVideo", title: "Visitor introduction mobile video", type: "file", options: { accept: "video/mp4,video/webm" }, description: "Optional compressed portrait-friendly video without audio. Otherwise mobile image, then desktop video/image is used.", validation: rule => rule.custom(file => !file?.asset?._ref || /-(mp4|webm)$/i.test(file.asset._ref) ? true : "Please upload an MP4 or WebM video.") }),

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
        defineField({ name: "ogImage", title: "OG Image", type: "image", options: { hotspot: true }, description: "This image will be used on social media and search engines" }),
      ],
    }),
  ],
});
