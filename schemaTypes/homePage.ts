import {imageAccessibilityFields} from './imageAccessibility.js'
import { defineType, defineField } from "sanity";

export default defineType({
  name: "homePage",
  title: "Home Page",
  type: "document",

  fields: [
    defineField({ name: "title", title: "Title", type: "string" }),
    defineField({ name: "intro", title: "Intro", type: "text" }),
    defineField({
      name: "projectTiles", title: "Homepage project tiles", type: "array",
      description: "Drag to reorder the existing cells. Media tiles reuse a Project's hero. White postcode tiles never link. Leave their Project empty until its identity is confirmed.",
      validation: (rule) => rule.max(16),
      of: [{
        name: "projectTile", title: "Project / postcode tile", type: "object",
        fields: [
          defineField({ name: "display", title: "Display", type: "string", initialValue: "postcode", options: { list: [{ title: "White postcode", value: "postcode" }, { title: "Project media", value: "media" }], layout: "radio" }, validation: (rule) => rule.required() }),
          defineField({ name: "project", title: "Project", type: "reference", to: [{ type: "project" }], description: "Optional for white tiles. When selected, its postcode is reused automatically.", validation: (rule) => rule.custom((value, context) => (context.parent as { display?: string })?.display === "media" && !value?._ref ? "Choose a Project for a media tile." : true) }),
          defineField({ name: "label", title: "Postcode label", type: "string", hidden: ({ parent }) => Boolean(parent?.project), description: "Use only for an unassigned white postcode tile.", validation: (rule) => rule.custom((value, context) => { const tile = context.parent as { display?: string; project?: { _ref?: string } }; return tile?.display === "postcode" && !tile.project?._ref && !value?.trim() ? "Enter a postcode or select a Project." : true; }) }),
        ],
        preview: { select: { title: "project.title", postcode: "project.postCode", label: "label", display: "display", media: "project.heroImage" }, prepare({ title, postcode, label, display, media }) { return { title: title || label || "Choose a project or postcode", subtitle: display === "media" ? "Project media" : `White postcode: ${postcode || label || ""}`, media }; } },
      }],
    }),
    // Visitor introduction content. Optional so existing documents remain valid.
    defineField({ name: "landingHeading", title: "Visitor introduction heading", type: "string", description: "Short heading over the full-screen introduction. Falls back to the homepage title." }),
    defineField({ name: "landingText", title: "Visitor introduction supporting text", type: "text", rows: 3 }),
    defineField({ name: "heroImage", title: "Visitor introduction desktop image", type: "image", options: { hotspot: true }, fields: [...imageAccessibilityFields()], description: "A single architectural image. Also the fallback for video; the website uses its existing Copper House photograph if empty." }),
    defineField({ name: "heroVideo", title: "Visitor introduction desktop video", type: "file", options: { accept: "video/mp4,video/webm" }, description: "Optional short, compressed video without audio. Keep an image for reduced motion and playback failures.", validation: rule => rule.custom(file => !file?.asset?._ref || /-(mp4|webm)$/i.test(file.asset._ref) ? true : "Please upload an MP4 or WebM video.") }),
    defineField({ name: "mobileHeroImage", title: "Visitor introduction mobile image", type: "image", options: { hotspot: true }, fields: [...imageAccessibilityFields()], description: "Optional portrait-friendly alternative. If supplied without a mobile video, this replaces desktop video on mobile." }),
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
    
    defineField({ name: 'seo', title: 'SEO', type: 'seo' }),
  ],
});
