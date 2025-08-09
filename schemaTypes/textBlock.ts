export default {
  name: 'textBlock',
  type: 'object',
  title: 'Text Block',
  fields: [
    {
      name: 'content',
      type: 'array',
      title: 'Content',
      of: [
        {
          type: 'block',
          styles: [],
          marks: {
            decorators: [
              { title: 'Strong', value: 'strong' },
            ],
            annotations: [],
          },
          lists: [],
        },
      ],
    },
  ],
  preview: {
    select: { title: 'content' },
prepare(value: Record<string, any>) {
  return {
    title: 'Text Block',
  };
}
  },
}