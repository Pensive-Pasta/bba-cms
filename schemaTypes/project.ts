import {imageAccessibilityFields} from './imageAccessibility.js'
import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  groups: [
    { name: 'information', title: 'Project Information', default: true },
    { name: 'website', title: 'Website' },
    { name: 'media', title: 'Media' },
    { name: 'caseStudy', title: 'Case Study' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'projectNumber', title: 'Project Number', type: 'string', group: 'information',
      description: 'BBA project number. Keep this stable so future spreadsheet updates match this record.',
      validation: (rule) => rule.custom(async (value, context) => {
        if (!value) return true;
        const id = context.document?._id.replace(/^drafts\./, '');
        const count = await context.getClient({ apiVersion: '2025-02-19' }).fetch<number>(
          'count(*[_type == "project" && projectNumber == $value && !(_id in [$id, $draftId])])',
          { value, id, draftId: `drafts.${id}` }
        );
        return count === 0 ? true : 'This project number belongs to another Project.';
      }),
    }),
    defineField({
      name: 'typology', title: 'Typology', type: 'string', group: 'information',
      options: { list: ['Private Residential', 'Residential', 'Workplace', 'Community', 'Sport', 'Retail'] },
      validation: (rule) => rule.custom((value, context) =>
        context.document?.includeInWorkIndex && !value ? 'Enter a typology for the Work index.' : true),
    }),
    defineField({
      name: 'includeInWorkIndex', title: 'Include in Work index', type: 'boolean', group: 'website', initialValue: false,
      description: 'Include this published project in the complete index. No photographs or project page are needed.',
    }),
    defineField({
      name: 'caseStudyEnabled', title: 'Enable project page', type: 'boolean', group: 'website', initialValue: false,
      description: 'Enable the detail URL when its media and editorial content are ready. Home Page and Work Page have independent ordered selections.',
      validation: (rule) => rule.custom((enabled, context) => {
        if (!enabled) return true;
        const document = context.document;
        const blocks = (document?.contentBlocks ?? []) as { _type: string; content?: { children?: { text?: string }[] }[] }[];
        const hasText = blocks.some((block) => block._type === 'textBlock' &&
          block.content?.some((paragraph) => paragraph.children?.some((span) => span.text?.trim())));
        if (!hasText) return 'Add editorial text before enabling the project page.';
        return true;
      }),
    }),
    { name: 'title', title: 'Public Project Name', type: 'string', group: 'information', validation: (rule) => rule.required() },
    {
      name: 'slug', title: 'Slug', type: 'slug', group: 'caseStudy',
      options: { source: 'title', maxLength: 96 },
      description: 'Only needed for a project page. Preserve existing slugs to keep published URLs.',
      validation: (rule) => rule.custom((value, context) => context.document?.caseStudyEnabled &&
        (!(value as { current?: string } | undefined)?.current || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test((value as { current: string }).current))
        ? 'Enter a valid slug before enabling the project page.' : true),
    },
    {
      name: 'postCode', title: 'Code / outward postcode', type: 'string', group: 'information',
      description: 'Public outward code, for example PE8. Reused by project tiles and the index.',
      validation: (rule) => rule.custom((value, context) => context.document?.includeInWorkIndex && !value
        ? 'Enter a code for the Work index.' : true),
    },
    {
      name: 'county', title: 'County', type: 'string', group: 'information',
      validation: (rule) => rule.custom((value, context) => context.document?.includeInWorkIndex && !value
        ? 'Enter a county for the Work index.' : true),
    },
    { name: 'year', title: 'Year', type: 'number', group: 'information' },
    {
      name: 'type',
      title: 'Context',
      group: 'information',
      type: 'string',
      options: {
        list: ['urban', 'inter-urban', 'rural'],
        layout: 'radio',
      },
      validation: (rule) => rule.custom((value, context) => context.document?.includeInWorkIndex && !value
        ? 'Choose a context for the Work index.' : true),
    },
    {
  name: 'heroImage',
  group: 'media',
  validation: (rule) => rule.custom((value, context) => context.document?.caseStudyEnabled && !(value as { asset?: { _ref?: string } } | undefined)?.asset?._ref
    ? 'Select a hero image or video poster before enabling the project page.' : true),
  title: 'Hero Image',
  type: 'image',
  options: { hotspot: true },
  fields: [
    ...imageAccessibilityFields(),
    ],
  },
    defineField({
      name: 'heroVideo',
      group: 'media',
      title: 'Desktop hero video (optional)',
      type: 'file',
      options: { accept: 'video/mp4,video/webm' },
      description: 'Replaces the desktop Hero Image visually. Keep Hero Image as the poster/fallback and project tile. Use a short, compressed landscape montage (1920 × 1080), without audio.',
      validation: (rule) => rule.custom((file) =>
        !file?.asset?._ref || /-(mp4|webm)$/i.test(file.asset._ref)
          ? true
          : 'Please upload an MP4 or WebM video.'
      ),
    }),
    defineField({
      name: 'mobileHeroImage',
      group: 'media',
      title: 'Mobile hero image (optional)',
      type: 'image',
      options: { hotspot: true },
      description: 'Portrait-friendly image (for example 1080 × 1920). Overrides desktop media on mobile when no mobile video is provided; also used as the mobile video poster. Leave empty to reuse the desktop image/media.',
      fields: [...imageAccessibilityFields()],
    }),
    defineField({
      name: 'mobileHeroVideo',
      group: 'media',
      title: 'Mobile hero video (optional)',
      type: 'file',
      options: { accept: 'video/mp4,video/webm' },
      description: 'Overrides other hero media on mobile. Use a short, compressed portrait-friendly montage (1080 × 1920), without audio. If empty, mobile image takes priority, then desktop video, then Hero Image.',
      validation: (rule) => rule.custom((file) =>
        !file?.asset?._ref || /-(mp4|webm)$/i.test(file.asset._ref)
          ? true
          : 'Please upload an MP4 or WebM video.'
      ),
    }),
    {
      name: 'contentBlocks',
      group: 'caseStudy',
      description: 'Build editorial content here while the project page is disabled. Publish the page only when ready.',
      title: 'Content Blocks',
      type: 'array',
      of: [
        { type: 'textBlock' },
        { type: 'imageBlock' },
        { type: 'galleryBlock' },
      ],
    },
    {
  name: 'credits',
  group: 'caseStudy',
  title: 'Credits',
  type: 'array',
  of: [
    {
      type: 'object',
      fields: [
        { name: 'label', title: 'Label', type: 'string' },
        { name: 'value', title: 'Value', type: 'string' },
      ],
      preview: {
        select: { title: 'label', subtitle: 'value' },
      },
    },
  ],
},
    { name: 'seo', title: 'SEO', type: 'seo', group: 'seo' }
  ],
  preview: {
    select: { title: 'title', subtitle: 'postCode', media: 'heroImage' },
  },
});
