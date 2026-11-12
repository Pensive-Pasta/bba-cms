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
              title: 'Alt Text',
              type: 'string',
              description: 'Describe the photograph for people who cannot see it.',
              validation: (rule) => rule.required().custom((value) =>
                !value || value.trim().length > 0 ? true : 'Enter meaningful alt text.'
              ),
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
