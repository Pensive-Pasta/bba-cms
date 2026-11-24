import assert from 'node:assert/strict'
import test from 'node:test'
import {configureStudioProfile, originalRefs, editorialRefs, legacyKeys} from './migrate-studio-profile.mjs'

const text = (key) => ({_type: 'textBlock', _key: key, content: [{_type: 'block', children: [{_type: 'span', text: `Existing copy ${key}`}]}]})
const assets = originalRefs.map((_id, index) => ({_id, metadata: {dimensions: {width: index === 2 ? 385 : 592, height: index === 2 ? 511 : 394}}}))
const document = {
  _id: 'studioPage', _type: 'studioPage', people: [{name: 'Existing person'}], valuesBlocks: [text('values')], awardsBlocks: [text('awards')], seo: {metaTitle: 'Existing title'},
  profileBlocks: [text('before'), ...originalRefs.map((ref, index) => ({
    _key: legacyKeys[index], _type: 'imageBlock', images: [{_key: `photo-${index}`, _type: 'image', asset: {_type: 'reference', _ref: ref}, altText: `Existing alt ${index}`, caption: index % 2 ? '' : 'Existing caption', crop: {left: 0, right: 0, top: 0, bottom: 0}, size: 'medium'}],
  })), text('after')],
}

test('all four existing photographs appear once in the shared editorial arrangement without losing metadata', () => {
  const original = structuredClone(document)
  const result = configureStudioProfile(document, assets)
  assert.deepEqual(result.filter((block) => block._type === 'textBlock'), [document.profileBlocks[0], document.profileBlocks.at(-1)])
  assert.equal(result[1]._type, 'galleryBlock'); assert.equal(result[1].presentation, 'editorial')
  assert.deepEqual(result[1].images.map((image) => image.asset._ref), editorialRefs)
  assert.deepEqual(result[1].images.map((image) => image.editorialLayout), ['full', 'portrait-stack', 'half', 'half'])
  for (const block of document.profileBlocks.filter((block) => block._type === 'imageBlock')) {
    const {size, ...image} = block.images[0]
    const {editorialLayout, ...migrated} = result[1].images.find((entry) => entry.asset._ref === image.asset._ref)
    assert.deepEqual(migrated, image)
  }
  assert.deepEqual(document, original)
})

test('rerunning retains the same gallery, image keys and block sequence', () => {
  const first = configureStudioProfile(document, assets)
  assert.deepEqual(configureStudioProfile({...document, profileBlocks: first}, assets), first)
})

test('intervening text is never swallowed or moved across an image group', () => {
  const mixed = structuredClone(document)
  mixed.profileBlocks.splice(3, 0, text('intervening'))
  assert.throws(() => configureStudioProfile(mixed, assets), /Never merge across intervening text/)
})

test('missing assets, wrong documents and changed references are refused without substitution', () => {
  assert.throws(() => configureStudioProfile(document, assets.slice(1)), /Missing existing Profile asset/)
  assert.throws(() => configureStudioProfile({...document, _id: 'other'}, assets), /Only the published Studio/)
  const changed = structuredClone(document)
  changed.profileBlocks[1].images[0].asset._ref = 'image-unrelated'
  assert.throws(() => configureStudioProfile(changed, assets), /asset membership changed/)
})

test('unexpected legacy block metadata must be handled explicitly rather than discarded', () => {
  const changed = structuredClone(document)
  changed.profileBlocks[1].heading = 'Existing image heading'
  assert.throws(() => configureStudioProfile(changed, assets), /Unexpected legacy block metadata/)
})
