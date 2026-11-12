import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'galleryBlock',
  title: 'Gallery',
  type: 'object',
  fields: [
    defineField({name: 'heading', title: 'Heading (optional)', type: 'string'}),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      description: 'Select existing images or upload new ones. Drag to reorder. Images keep their proportions; only crops you choose are applied.',
      validation: (rule) => rule.required().min(1),
      of: [
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          validation: (rule) => rule.required().assetRequired(),
          fields: [
            defineField({
              name: 'altText',
              title: 'Alt Text (override)',
              type: 'string',
              description: 'Optional when the image has alt text saved in the Media library. Enter text here to override that description for this gallery.',
              validation: (rule) => rule.custom(async (value, context) => {
                if (value?.trim()) return true

                const parent = context.parent as {asset?: {_ref?: string}} | undefined
                const assetId = parent?.asset?._ref
                // The image field validates missing assets separately.
                if (!assetId) return true

                try {
                  const altText = await context.getClient({apiVersion: '2025-01-01'})
                    .withConfig({useCdn: false})
                    .fetch<string | null>('*[_id == $assetId][0].altText', {assetId})
                  return altText?.trim()
                    ? true
                    : 'Enter alt text here or add it to the image in the Media library.'
                } catch {
                  return 'Could not check the image’s saved alt text. Retry or enter alt text here.'
                }
              }),
            }),
            defineField({name: 'caption', title: 'Caption (optional)', type: 'string'}),
          ],
          preview: {
            select: {title: 'altText', subtitle: 'caption', media: 'asset'},
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {heading: 'heading', images: 'images'},
    prepare({heading, images}) {
      const count = Array.isArray(images) ? images.length : 0
      return {
        title: heading || 'Gallery',
        subtitle: `${count} image${count === 1 ? '' : 's'}`,
        media: images?.[0],
      }
    },
  },
})
