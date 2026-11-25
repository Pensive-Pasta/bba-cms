import assert from 'node:assert/strict'
import test from 'node:test'
import {ConcreteRuleClass} from 'sanity'
import seo from '../schemaTypes/seo.ts'
import insight from '../schemaTypes/insight.ts'
import {imageAccessibilityFields} from '../schemaTypes/imageAccessibility.js'

const context = (name, type) => ({path: [name], type: {name: type, jsonType: type}})

test('SEO overrides remain optional so the website can use current content defaults', async () => {
  for (const name of ['metaTitle', 'metaDescription']) {
    const rule = seo.fields.find(field => field.name === name).validation(new ConcreteRuleClass().type('string'))
    assert.equal((await rule.validate(undefined, context(name, 'string'))).length, 0)
    assert.equal((await rule.validate('Approved manual metadata', context(name, 'string'))).length, 0)
  }
})

test('Insight validation leaves article readiness to editors rather than scanning copy', async () => {
  const field = insight.fields.find(field => field.name === 'contentBlocks')
  const base = new ConcreteRuleClass().type('array')
  const rule = field.validation ? field.validation(base) : base
  const content = text => [{_type: 'textBlock', content: [{children: [{text}]}]}]
  for (const value of [[], content('Lorem ipsum dolor sit amet'), content('A finished article about the practice.')]) {
    assert.equal((await rule.validate(value, context('contentBlocks', 'array'))).length, 0)
  }
})

test('image fields support the existing people alt name and explicit decoration without mandatory text', () => {
  const fields = imageAccessibilityFields('alt')
  assert.equal(fields[0].name, 'alt')
  assert.equal(fields[0].validation, undefined)
  assert.equal(fields[1].name, 'decorative')
  assert.equal(fields[1].initialValue, false)
})
