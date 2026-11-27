import assert from 'node:assert/strict'
import test from 'node:test'
import {evaluate, parse} from 'groq-js'
import {ConcreteRuleClass} from 'sanity'
import project from '../schemaTypes/project.ts'

const field = project.fields.find((field) => field.name === 'projectNumber')
const rule = field.validation(new ConcreteRuleClass().type('string'))
const document = (id, projectNumber = '123', type = 'project') => ({
  _id: id, _type: type, projectNumber,
})

async function validate(value, id, dataset) {
  return rule.validate(value, {
    path: ['projectNumber'],
    type: {name: 'string', jsonType: 'string'},
    document: document(id),
    getClient: () => ({
      fetch: async (query, params) => (await evaluate(parse(query), {dataset, params})).get(),
    }),
  })
}

test('Project number validation permits empty values without querying Sanity', async () => {
  for (const value of [undefined, '']) {
    assert.deepEqual(await rule.validate(value, {
      getClient: () => assert.fail('Empty project numbers must not query Sanity'),
    }), [])
  }
})

test('Project number validation permits a unique number', async () => {
  assert.deepEqual(await validate('123', 'current', [
    document('another-project', '456'),
    document('unrelated-document', '123', 'insight'),
  ]), [])
})

test('Project number validation excludes its own published and draft records', async () => {
  const dataset = [document('current'), document('drafts.current')]
  for (const id of ['current', 'drafts.current']) {
    assert.deepEqual(await validate('123', id, dataset), [])
  }
})

test('Project number validation rejects duplicates on another published or draft project', async () => {
  for (const duplicateId of ['another-project', 'drafts.another-project']) {
    const errors = await validate('123', 'drafts.current', [
      document('current'), document('drafts.current'), document(duplicateId),
    ])
    assert.equal(errors.length, 1)
    assert.equal(errors[0].message, 'This project number belongs to another Project.')
  }
})
