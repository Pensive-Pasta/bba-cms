import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'galleryBlock',
  title: 'Gallery',
  type: 'object',
  fields: [
    defineField({name: 'heading', title: 'Heading (optional)', type: 'string'}),
    defineField({
      name: 'presentation',
      title: 'Presentation',
      type: 'string',
      initialValue: 'scroll',
      options: {
        list: [
          {title: 'Scrolling gallery (existing)', value: 'scroll'},
          {title: 'Editorial image layout', value: 'editorial'},
        ],
        layout: 'radio',
      },
      description: 'Editorial uses the page’s two-column grid on desktop and a single image stack on mobile. Leaving this unset keeps the existing scrolling gallery.',
    }),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      description: 'Select existing images or upload new ones. Drag to reorder. Images keep their proportions; only crops you choose are applied.',
      validation: (rule) => rule.required().min(1).custom((images, context) => {
        if ((context.parent as {presentation?: string})?.presentation !== 'editorial') return true
        for (let index = 0; index < (images?.length ?? 0); index++) {
          const image = images![index] as {editorialLayout?: string}
          if (image.editorialLayout !== 'portrait-stack') continue
          const following = images!.slice(index + 1, index + 3) as {editorialLayout?: string}[]
          if (following.length !== 2 || following.some((item) =>
            item.editorialLayout === 'full' || item.editorialLayout === 'portrait-stack')) {
            return 'Portrait with stacked images needs two following images set to Half width or Automatic.'
          }
          index += 2
        }
        return true
      }),
      of: [
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          validation: (rule) => rule.required().assetRequired(),
          fields: [
            defineField({
              name: 'altText',
              title: 'Alt Text (optional)',
              type: 'string',
              description: 'Optional description for this image in the gallery. Missing alt text is handled by the frontend.',
            }),
            defineField({name: 'caption', title: 'Caption (optional)', type: 'string'}),
            defineField({
              name: 'editorialLayout',
              title: 'Editorial placement',
              type: 'string',
              initialValue: 'auto',
              options: {
                list: [
                  {title: 'Automatic', value: 'auto'},
                  {title: 'Full width (both columns)', value: 'full'},
                  {title: 'Half width', value: 'half'},
                  {title: 'Portrait left + next two images stacked right', value: 'portrait-stack'},
                ],
              },
              description: 'Used only in Editorial mode. Automatic pairs adjacent images; images at least twice as wide as tall use full width. Portrait left groups this image with the next two images; set those to Half width. All images retain their proportions and mobile order.',
            }),
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
