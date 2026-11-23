import assert from 'node:assert/strict'
import test from 'node:test'
import {configureCopper, openingFilenames} from './configure-copper-editorial.mjs'

const assets = [...openingFilenames, 'drawing.jpg', 'section.png', 'desk.jpg', 'detail.png', 'roof.png'].map((originalFilename, index) => ({
  _id: `image-${index}`, originalFilename, metadata: {dimensions: {width: 3000, height: 2000}},
}))
const selected = (index) => ({_type: 'image', _key: `key-${index}`, asset: {_type: 'reference', _ref: assets[index]._id}, altText: `Existing alt ${index}`, caption: index === 4 ? 'Existing caption' : undefined})
const document = {
  _id: 'fb4f89b5-d561-4a1f-ba9a-170b517f79de', slug: {current: 'copper-house'},
  heroImage: {asset: {_ref: 'hero'}}, credits: [{label: 'Photography', value: 'Existing credit'}],
  contentBlocks: [{_key: 'text', _type: 'textBlock', content: ['Existing copy']}, {
    _key: 'gallery', _type: 'galleryBlock', images: [4, 5, 2, 1, 6, 7, 8, 0].map(selected),
  }],
}

test('Copper migration retains every original asset exactly once and preserves remaining relative order', () => {
  const original = structuredClone(document)
  const result = configureCopper(document, assets)
  assert.deepEqual(result.images.map((image) => image.asset._ref), assets.map((asset) => asset._id))
  assert.deepEqual(result.images.slice(0, 4).map((image) => image.editorialLayout), ['full', 'portrait-stack', 'half', 'half'])
  for (const image of document.contentBlocks[1].images) {
    const updated = result.images.find((item) => item.asset._ref === image.asset._ref)
    assert.deepEqual({...updated, editorialLayout: undefined}, {...image, editorialLayout: undefined})
  }
  assert.deepEqual(document, original)
  assert.equal(result.images.length, 9)
})

test('Copper migration is idempotent, including image keys, existing alt text and captions', () => {
  const first = configureCopper(document, assets)
  assert.deepEqual(configureCopper({...document, contentBlocks: [document.contentBlocks[0], first]}, assets), first)
})

test('Copper migration refuses the missing joinery asset and other projects instead of substituting images', () => {
  assert.throws(() => configureCopper(document, assets.filter((asset) => asset.originalFilename !== openingFilenames[3])), /Missing existing Sanity asset/)
  assert.throws(() => configureCopper({...document, _id: 'other-project'}, assets), /Only the published Copper House/)
  assert.throws(() => configureCopper(document, assets, 'nonexistent'), /Missing existing Sanity asset/)
})
