export default {
  name: 'person',
  title: 'Person',
  type: 'object',
  fields: [
    {
      name: 'image',
      type: 'image',
      title: 'Image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'name',
      type: 'string',
      title: 'Name',
    },
    {
      name: 'position',
      type: 'string',
      title: 'Position',
    },
    {
      name: 'bio',
      type: 'text',
      title: 'Bio',
    },
    {
      name: 'socialLink',
      type: 'url',
      title: 'Social Media Link',
    },
    {
      name: 'email',
      type: 'string',
      title: 'Email (mailto)',
    },
  ],
};