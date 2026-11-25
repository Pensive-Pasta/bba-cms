import {defineField} from 'sanity'

export const imageAccessibilityFields = (name = 'altText') => [
  defineField({name, title: 'Image description', type: 'string', description: 'Describe meaningful visible content, without guessing from its filename. Existing descriptions are preserved. If unset, shared asset alt text is reused.'}),
  defineField({name: 'decorative', title: 'Decorative image', type: 'boolean', initialValue: false, description: 'Use only when this image adds no information beyond nearby text. Decorative images have empty alt text.'}),
]
