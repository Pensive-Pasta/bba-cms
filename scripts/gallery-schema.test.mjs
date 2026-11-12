import assert from 'node:assert/strict'
import test from 'node:test'
import {ConcreteRuleClass} from 'sanity'
import gallery from '../schemaTypes/galleryBlock.ts'

const images = gallery.fields.find((field) => field.name === 'images')
const image = images.of[0]
const context = (name, type) => ({path: [name], type: {name: type, jsonType: type}})

test('Gallery requires at least one selected image without limiting image count', async () => {
  const rule = images.validation(new ConcreteRuleClass().type('array'))
  for (const value of [undefined, []]) {
    assert.ok((await rule.validate(value, context('images', 'array'))).length)
  }
  for (const count of [1, 30]) {
    const value = Array.from({length: count}, () => ({asset: {_ref: 'image-test'}}))
    assert.equal((await rule.validate(value, context('images', 'array'))).length, 0)
  }
})

test('Gallery images require an asset and meaningful alt text; captions remain optional', async () => {
  const imageRule = image.validation(new ConcreteRuleClass().type('object'))
  assert.ok((await imageRule.validate({}, context('image', 'object'))).length)
  assert.equal((await imageRule.validate({asset: {_ref: 'image-test'}}, context('image', 'object'))).length, 0)
  const alt = image.fields.find((field) => field.name === 'altText')
  const altRule = alt.validation(new ConcreteRuleClass().type('string'))
  const assetContext = (savedAlt) => ({
    ...context('altText', 'string'),
    parent: {asset: {_ref: 'image-test'}},
    getClient: () => ({
      withConfig: () => ({fetch: async (query, params) => {
        assert.equal(query, '*[_id == $assetId][0].altText')
        assert.deepEqual(params, {assetId: 'image-test'})
        return savedAlt
      }}),
    }),
  })
  for (const value of [undefined, '', '   ']) {
    for (const savedAlt of [null, '', '   ']) {
      assert.ok((await altRule.validate(value, assetContext(savedAlt))).length)
    }
    assert.equal((await altRule.validate(value, assetContext('Courtyard entrance'))).length, 0)
  }
  // An explicit override works without fetching the asset.
  assert.equal((await altRule.validate('Courtyard entrance', context('altText', 'string'))).length, 0)
  assert.equal((await altRule.validate(undefined, context('altText', 'string'))).length, 0)
  const unavailable = {...assetContext(null), getClient: () => {throw new Error('Offline')}}
  const errors = await altRule.validate(undefined, unavailable)
  assert.ok(errors.some((error) => error.message.includes('Could not check')))
  assert.equal(image.fields.find((field) => field.name === 'caption').validation, undefined)
  assert.equal(image.options.hotspot, true)
})

test('Gallery previews support empty values, a thumbnail, heading and image count', () => {
  assert.equal(gallery.preview.prepare({}).subtitle, '0 images')
  assert.equal(gallery.preview.prepare({images: [{}]}).subtitle, '1 image')
  const first = {asset: {_ref: 'image-first'}}
  assert.deepEqual(gallery.preview.prepare({heading: 'Courtyard', images: [first, {}]}), {
    title: 'Courtyard', subtitle: '2 images', media: first,
  })
})
