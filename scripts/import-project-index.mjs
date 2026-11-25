import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import {mkdir, readFile, writeFile} from 'node:fs/promises'
import {resolve} from 'node:path'
import {getCliClient} from 'sanity/cli'

// Run through sanity exec --with-user-token. Never reads or prints credentials.
const args = process.argv.slice(2)
const option = (name) => args.includes(name) ? args[args.indexOf(name) + 1] : undefined
const publish = args.includes('--publish')
const workbook = option('--workbook')
assert.ok(workbook, 'Provide --workbook /absolute/path.xlsx')
const extraction = spawnSync('python3', [resolve(import.meta.dirname, 'read-project-index.py'), workbook], {encoding: 'utf8'})
assert.equal(extraction.status, 0, extraction.stderr)
const source = JSON.parse(extraction.stdout)
const client = getCliClient({apiVersion: '2025-02-19'}).withConfig({projectId: '9s2ar5mb', dataset: 'production', perspective: 'raw', useCdn: false, maxRetries: 0})
assert.equal(client.config().projectId, '9s2ar5mb')
assert.equal(client.config().dataset, 'production')

// The eight approved, already photographed case studies. The spreadsheet's
// Case Study marker never automatically enables a page or selects its grid tile.
const caseStudyIds = [
  'project-woodlands-pavilion', '1ec74086-bd4b-4670-ad50-d26e60270192',
  'project-oundle-bookshop', 'a14e60aa-1e2c-4a14-82a1-ca38839eeb6b',
  '8a5048a2-7f49-4263-92ec-38a3728c5f10', 'project-eastcroft',
  'project-pitch-view', 'fb4f89b5-d561-4a1f-ba9a-170b517f79de',
]
const aliases = {'east croft': 'eastcroft', 'the oundle bookshop': 'oundle bookshop'}
const normalise = (value) => value.normalize('NFKC').trim().toLowerCase()
const canonicalId = (id) => id.replace(/^drafts\./, '')
const documents = await client.fetch('*[_type in ["project", "homePage", "workPage"]] | order(_id)')
const backup = resolve(option('--backup-root') ?? resolve(import.meta.dirname, '../backups'), `unified-projects-${new Date().toISOString().replaceAll(':', '-')}.local`)
await mkdir(backup, {recursive: true, mode: 0o700})
await writeFile(resolve(backup, 'before-content.json'), JSON.stringify(documents, null, 2), {mode: 0o600})
await writeFile(resolve(backup, 'source.json'), JSON.stringify(source, null, 2), {mode: 0o600})
const projects = documents.filter((document) => document._type === 'project')
const expected = new Map(documents.map((document) => [document._id, document]))
const operations = []
const matches = []
const discrepancies = []
const update = (document, fields) => {
  const changes = Object.fromEntries(Object.entries(fields).filter(([key, value]) => JSON.stringify(document[key]) !== JSON.stringify(value)))
  if (!Object.keys(changes).length) return
  operations.push({patch: {id: document._id, ifRevisionID: document._rev, set: changes}})
  expected.set(document._id, {...document, ...changes})
}

for (const record of source.records) {
  const title = aliases[normalise(record.title)] ?? normalise(record.title)
  const candidates = projects.filter((document) => document.projectNumber === record.projectNumber || normalise(document.title) === title)
  const ids = [...new Set(candidates.map((document) => canonicalId(document._id)))]
  assert.ok(ids.length <= 1, `Ambiguous existing match: ${record.title}`)
  const id = ids[0] ?? `project-index-${record.projectNumber}`
  const published = candidates.find((document) => document._id === id)
  const draft = candidates.find((document) => document._id === `drafts.${id}`)
  const existing = published ?? draft
  if (!existing) assert.ok(!documents.some((document) => document._id === id), `ID collision: ${id}`)
  if (existing) matches.push({projectNumber: record.projectNumber, spreadsheetTitle: record.title, title: existing.title, id, draftOnly: !published})
  for (const key of ['county', 'type', 'postCode']) {
    if (existing?.[key] && existing[key] !== record[key]) {
      discrepancies.push({projectNumber: record.projectNumber, title: existing.title, field: key, spreadsheet: record[key], retained: existing[key], reason: 'Preserve existing classification; explicit context corrections also applied below.'})
    }
  }
  const fields = {
    projectNumber: record.projectNumber,
    title: existing?.title || record.title,
    postCode: existing?.postCode || record.postCode,
    county: existing?.county || record.county,
    type: id === 'project-woodlands-pavilion' ? 'rural' : id === 'project-oundle-bookshop' ? 'inter-urban' : existing?.type || record.type,
    typology: existing?.typology || record.typology,
    includeInWorkIndex: existing?.includeInWorkIndex ?? true,
    caseStudyEnabled: existing?.caseStudyEnabled ?? caseStudyIds.includes(id),
  }
  if (fields.caseStudyEnabled) {
    assert.ok(published?.heroImage?.asset?._ref, `Enabled case study requires published photography: ${id}`)
    assert.ok(published.contentBlocks?.some((block) => block._type === 'textBlock' && block.content?.some((paragraph) => paragraph.children?.some((span) => span.text?.trim()))), `Enabled case study requires published editorial text: ${id}`)
  }
  if (published) update(published, fields)
  else {
    // A pre-existing unfinished draft stays a draft. Publish only its approved
    // basic index data under the same canonical ID, without exposing draft media.
    const newDocument = {_id: id, _type: 'project', ...fields, ...(draft?.slug ? {slug: draft.slug} : {}), ...(draft?.year ? {year: draft.year} : {})}
    operations.push({create: newDocument})
    expected.set(id, newDocument)
  }
  if (draft) update(draft, fields)
}

const media = (id) => ({_type: 'projectTile', _key: `media-${id}`, display: 'media', project: {_type: 'reference', _ref: id}})
const postcode = (label) => ({_type: 'projectTile', _key: `postcode-${label}`, display: 'postcode', label})
const homeTiles = [
  postcode('PE8'), media(caseStudyIds[0]), media(caseStudyIds[1]), postcode('M28'), postcode('NN14'),
  media(caseStudyIds[3]), media(caseStudyIds[4]), postcode('NR21'), postcode('LE15'),
  media(caseStudyIds[6]), media(caseStudyIds[7]), postcode('CB10'),
]
for (const [id, type, field, value] of [
  ['homePage', 'homePage', 'projectTiles', homeTiles],
  ['workPage', 'workPage', 'projects', caseStudyIds.map((id) => ({_type: 'reference', _key: `work-${id}`, _ref: id}))],
]) {
  const page = documents.find((document) => document._id === id)
  assert.equal(page?._type, type, `Missing singleton ${id}`)
  // Seed once. A repeat import must not reset subsequent editorial curation.
  if (page[field] === undefined) update(page, {[field]: value})
  const draft = documents.find((document) => document._id === `drafts.${id}`)
  if (draft && draft[field] === undefined) update(draft, {[field]: value})
}

const report = {
  publish, backup, sourceSha256: source.sourceSha256,
  websiteRows: source.websiteRows, approvedIndexRecords: source.records.length,
  newPublishedRecords: operations.filter((operation) => operation.create).length,
  matchedExistingProjects: matches.length, operations: operations.length,
  matches, discrepancies, omitted: source.omitted,
  duplicateNumbers: source.duplicateNumbers, omissionNotes: source.omissionNotes,
  enabledCaseStudies: [...expected.values()].filter((document) => document._type === 'project' && !document._id.startsWith('drafts.') && document.caseStudyEnabled).map((document) => ({id: document._id, slug: document.slug?.current})),
}
await writeFile(resolve(backup, 'plan.json'), JSON.stringify(operations, null, 2), {mode: 0o600})
await writeFile(resolve(backup, 'report.json'), JSON.stringify(report, null, 2), {mode: 0o600})
if (publish) {
  const verification = JSON.parse(await readFile(option('--frontend-verification'), 'utf8'))
  assert.deepEqual(verification.checks, {check: true, tests: true, build: true}, 'Frontend verification is required before publication')
  for (const file of verification.files) {
    assert.equal(createHash('sha256').update(await readFile(file.path)).digest('hex'), file.sha256, `Frontend changed after verification: ${file.path}`)
  }
  if (operations.length) await client.mutate(operations, {visibility: 'sync'})
  const after = await client.fetch('*[_type in ["project", "homePage", "workPage"]] | order(_id)')
  await writeFile(resolve(backup, 'after-content.json'), JSON.stringify(after, null, 2), {mode: 0o600})
  assert.equal(after.length, expected.size, 'Unexpected document count after import')
  const withoutSystem = (document) => Object.fromEntries(Object.entries(document).filter(([key]) => !['_rev', '_createdAt', '_updatedAt', '_system'].includes(key)))
  for (const [id, document] of expected) {
    assert.deepEqual(withoutSystem(after.find((item) => item._id === id)), withoutSystem(document), `Unexpected content change: ${id}`)
  }
  report.verifiedPublishedIndexRecords = after.filter((document) => document._type === 'project' && !document._id.startsWith('drafts.') && document.includeInWorkIndex).length
  assert.equal(report.verifiedPublishedIndexRecords, source.records.length)
  await writeFile(resolve(backup, 'report.json'), JSON.stringify(report, null, 2), {mode: 0o600})
}
console.log(JSON.stringify({...report, matches: undefined, discrepancies: undefined, omitted: report.omitted.map(({projectNumber, title, notes}) => ({projectNumber, title, notes}))}, null, 2))
