import assert from 'node:assert/strict'
import test from 'node:test'
import {ConcreteRuleClass} from 'sanity'
import project from '../schemaTypes/project.ts'

const field = (name) => project.fields.find((item) => item.name === name)
const context = (name, type, document = {}) => ({path: [name], type: {name: type, jsonType: type}, document})

test('index-only records can publish without a slug or media while index information is validated', async () => {
  for (const name of ['slug', 'heroImage']) {
    const rule = field(name).validation(new ConcreteRuleClass().type('object'))
    assert.equal((await rule.validate(undefined, context(name, 'object', {includeInWorkIndex: true}))).length, 0)
    assert.ok((await rule.validate(undefined, context(name, 'object', {caseStudyEnabled: true}))).length)
  }
  for (const name of ['postCode', 'county', 'type', 'typology']) {
    const rule = field(name).validation(new ConcreteRuleClass().type('string'))
    assert.ok((await rule.validate(undefined, context(name, 'string', {includeInWorkIndex: true}))).length)
    assert.equal((await rule.validate(undefined, context(name, 'string'))).length, 0)
  }
})

test('enabling a page requires meaningful editorial text rather than an empty block', async () => {
  const rule = field('caseStudyEnabled').validation(new ConcreteRuleClass().type('boolean'))
  const document = {contentBlocks: [{_type: 'textBlock', content: [{children: [{text: '  '}]}]}]}
  assert.ok((await rule.validate(true, context('caseStudyEnabled', 'boolean', document))).length)
  document.contentBlocks[0].content[0].children[0].text = 'Our project story'
  assert.equal((await rule.validate(true, context('caseStudyEnabled', 'boolean', document))).length, 0)
  assert.equal((await rule.validate(false, context('caseStudyEnabled', 'boolean'))).length, 0)
})

test('new projects never default into a view or classification and existing content remains grouped', () => {
  assert.equal(field('type').title, 'Context')
  assert.equal(field('type').initialValue, undefined)
  assert.equal(field('includeInWorkIndex').initialValue, false)
  assert.equal(field('caseStudyEnabled').initialValue, false)
  assert.deepEqual(field('typology').options.list, ['Private Residential', 'Residential', 'Workplace', 'Community', 'Sport', 'Retail'])
  assert.ok(project.fields.every((item) => project.groups.some((group) => group.name === item.group)))
})
