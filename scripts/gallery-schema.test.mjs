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

test('Gallery images require an asset; alt text and captions remain optional', async () => {
  const imageRule = image.validation(new ConcreteRuleClass().type('object'))
  assert.ok((await imageRule.validate({}, context('image', 'object'))).length)
  assert.equal((await imageRule.validate({asset: {_ref: 'image-test'}}, context('image', 'object'))).length, 0)
  const alt = image.fields.find((field) => field.name === 'altText')
  assert.equal(alt.validation, undefined)
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


test('Editorial is opt-in and exposes reusable image placement without requiring captions', () => {
  const presentation = gallery.fields.find((field) => field.name === 'presentation')
  assert.equal(presentation.initialValue, 'scroll')
  assert.deepEqual(presentation.options.list.map((item) => item.value), ['scroll', 'editorial'])
  const layout = image.fields.find((field) => field.name === 'editorialLayout')
  assert.equal(layout.initialValue, 'auto')
  assert.deepEqual(layout.options.list.map((item) => item.value), ['auto', 'full', 'half', 'portrait-stack'])
})

test('Editorial portrait arrangements require two following images without conflicting placements', async () => {
  const rule = images.validation(new ConcreteRuleClass().type('array'))
  const ctx = {...context('images', 'array'), parent: {presentation: 'editorial'}}
  const selected = (layout) => ({asset: {_ref: 'image-test'}, editorialLayout: layout})
  assert.ok((await rule.validate([selected('portrait-stack')], ctx)).length)
  assert.ok((await rule.validate([selected('portrait-stack'), selected('half'), selected('full')], ctx)).length)
  assert.equal((await rule.validate([selected('full'), selected('portrait-stack'), selected('half'), selected('half')], ctx)).length, 0)
  assert.equal((await rule.validate([selected('portrait-stack')], context('images', 'array'))).length, 0)
})
