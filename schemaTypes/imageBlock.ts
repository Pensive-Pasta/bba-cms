export default {
  name: 'imageBlock',
  title: 'Image Block',
  type: 'object',
  fields: [
    {
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [
        {
          name: 'image',
          title: 'Image',
          type: 'image',
          options: { hotspot: true },
          validation: (Rule: any) => Rule.required(),
          fields: [
            {
              name: 'altText',
              title: 'Alt Text',
              type: 'string',
            },
            {
              name: 'caption',
              title: 'Caption',
              type: 'string',
              description: 'Optional caption for this image',
            },
            {
              name: 'size',
              title: 'Image Size',
              type: 'string',
              options: {
                list: [
                  { title: 'Small', value: 'small' },
                  { title: 'Medium', value: 'medium' },
                  { title: 'Large', value: 'large' },
                ],
                layout: 'radio',
              },
              initialValue: 'medium',
            },
          ],
          preview: {
            select: {
              title: 'altText',
              media: 'asset',
            },
            prepare(value: Record<string, any>) {
  const { media, title } = value;
  return {
    title: title || 'Image',
    media,
  };
}
          },
        },
      ],
      validation: (Rule: any) => Rule.max(2),
      description: 'Maximum of 2 images allowed in this image block.',
    },
  ],
  preview: {
    select: {
      media: 'images.0.asset',
      title: 'images.0.altText',
    },
    prepare(value: Record<string, any>) {
  const { media, title } = value;
  return {
    title: title || 'Image Block',
    media,
  };
}
  },
};