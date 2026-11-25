import assert from 'node:assert/strict'
import {mkdir, writeFile} from 'node:fs/promises'
import {resolve} from 'node:path'
import {getCliClient} from 'sanity/cli'

const publish = process.argv.includes('--publish')
const client = getCliClient({apiVersion: '2025-02-19'}).withConfig({projectId: '9s2ar5mb', dataset: 'production', perspective: 'raw', useCdn: false, maxRetries: 0})
const documents = await client.fetch('*[_type in ["project", "insight", "homePage", "workPage", "studioPage", "insightPage", "contactPage", "legalPage"]] | order(_id)')
const backup = resolve(import.meta.dirname, '../backups', `launch-seo-${new Date().toISOString().replaceAll(':', '-')}.local`)
await mkdir(backup, {recursive: true, mode: 0o700})
await writeFile(resolve(backup, 'before-content.json'), JSON.stringify(documents, null, 2), {mode: 0o600})

// Reviewed against the published editorial copy, never against filenames alone.
const descriptions = {
  'copper-house': 'A copper-clad extension to a Victorian terrace in Cambridge, with handmade oak glazing, a wildflower roof and spaces designed for family life.',
  'eastcroft': 'A timber-framed extension to a Victorian cottage in Holywell, adding bedrooms and practical spaces with low embodied-carbon materials.',
  'centre-point': 'Access and landscape improvements at Nene Park, Peterborough, with a curved timber canopy, refurbished facilities and community artwork.',
  'the-old-stables': 'An extension to converted stables near Huntingdon, using reclaimed brick and oak to create a new wing, cartway and enclosed courtyard.',
  'weston-park': 'Twenty homes designed to Passivhaus principles by Western Park, Leicester, with retained trees and a timber community pavilion.',
  'oundle-bookshop': 'A Grade II* listed bookshop in Oundle, refurbished with bespoke shelving, a playful children’s reading area and spaces for community activities.',
  'pitch-view': 'A side and rear extension to a home near Stamford, creating flexible family spaces, garden views and a wildflower roof.',
  'woodlands-pavilion': 'A sports and community pavilion for Nene Park Trust in Castor, bringing changing facilities and a multi-use hall together in a restrained rural form.',
  'olly-roffe-returns-to-the-team': 'Olly Roffe returns to BBA after his final year at Loughborough University, where his circular-economy project won the People and Planet award.',
}
for (const description of Object.values(descriptions)) assert.ok(description.length <= 160)

// These images were visually inspected before writing these descriptions.
const imageDescriptions = {
  'image-a7bc0bcfdc5d3275eab4a36f6f482d26681af485-384x545-png': 'Olly Roffe seated with his arms folded, wearing a dark green quarter-zip top.',
  'image-327093b40ae09b542fe5b3090a0ba8e12babc9f0-801x799-png': 'Axonometric architectural illustration of a long, planted site with low buildings and an open-frame structure.',
  'image-bbbe77c41647c0afc39a2db1827f1ef7a31bae07-406x406-png': 'Portrait of Luke Butcher wearing a dark blue shirt against a turquoise background.',
  'image-76b232beb9b151748c8a96178bc3f9ce2227f5f5-406x406-png': 'Portrait of Carrie Bayley wearing a black top against a purple background.',
  'image-520f09a464a37ffa4a3970f18c6735c317ff4185-406x406-png': 'Portrait of Violet Sheppard wearing a patterned top against a yellow background.',
  'image-e7e075d2bdaf071f5a25c8758d58497c3ff6ba36-406x406-png': 'Portrait of Emma Bayley wearing a blue top against a green background.',
}

const operations = [], updates = []
const expected = new Map(documents.map(document => [document._id, structuredClone(document)]))
for (const document of documents) {
  if (document._id.startsWith('drafts.')) continue
  const set = {}, setIfMissing = {}, next = expected.get(document._id)
  const description = descriptions[document.slug?.current]
  if (description && !document.seo?.metaDescription?.trim()) {
    assert.ok(document._type !== 'project' || document.caseStudyEnabled, 'Only enabled case studies receive SEO updates')
    setIfMissing.seo = {_type: 'seo'}
    set['seo.metaDescription'] = description
    next.seo = {...next.seo, metaDescription: description}
    if (!document.seo) next.seo._type = 'seo'
  }
  if (document._id === 'workPage' && document.seo?.metaDescription?.endsWith('Architects.”')) {
    set['seo.metaDescription'] = document.seo.metaDescription.slice(0, -1)
    next.seo.metaDescription = set['seo.metaDescription']
  }
  if (document.slug?.current === 'olly-roffe-returns-to-the-team' && !document.seo?.ogImage?.asset?._ref) {
    const reference = 'image-a7bc0bcfdc5d3275eab4a36f6f482d26681af485-384x545-png'
    setIfMissing.seo = {_type: 'seo'}
    set['seo.ogImage'] = {_type: 'image', asset: {_type: 'reference', _ref: reference}, altText: imageDescriptions[reference], hotspot: {_type: 'sanity.imageHotspot', x: .5, y: .3, width: 1, height: .6}}
    next.seo = {...next.seo, ogImage: set['seo.ogImage']}
    if (!document.seo) next.seo._type = 'seo'
  }
  for (const [blockIndex, block] of (document.contentBlocks ?? []).entries()) {
    for (const [imageIndex, image] of (block.images ?? []).entries()) {
      const alt = imageDescriptions[image.asset?._ref]
      if (!alt || image.decorative || image.altText !== undefined) continue
      assert.ok(block._key && image._key, 'Image patches require stable keys')
      const path = `contentBlocks[_key==${JSON.stringify(block._key)}].images[_key==${JSON.stringify(image._key)}].altText`
      set[path] = alt
      next.contentBlocks[blockIndex].images[imageIndex].altText = alt
    }
  }
  for (const [personIndex, person] of (document.people ?? []).entries()) {
    const alt = imageDescriptions[person.image?.asset?._ref]
    if (!alt || person.image?.decorative || person.image?.alt !== undefined) continue
    assert.ok(person._key, 'Person patches require stable keys')
    set[`people[_key==${JSON.stringify(person._key)}].image.alt`] = alt
    next.people[personIndex].image.alt = alt
  }
  if (!Object.keys(set).length) continue
  operations.push({patch: {id: document._id, ifRevisionID: document._rev, set, ...(Object.keys(setIfMissing).length ? {setIfMissing} : {})}})
  updates.push({id: document._id, title: document.title || document._type, fields: Object.keys(set)})
}
const report = {publish, backup, updates, operationCount: operations.length}
await writeFile(resolve(backup, 'plan.json'), JSON.stringify(operations, null, 2), {mode: 0o600})
await writeFile(resolve(backup, 'report.json'), JSON.stringify(report, null, 2), {mode: 0o600})
if (publish && operations.length) {
  await client.mutate(operations, {visibility: 'sync'})
  const after = await client.fetch('*[_type in ["project", "insight", "homePage", "workPage", "studioPage", "insightPage", "contactPage", "legalPage"]] | order(_id)')
  await writeFile(resolve(backup, 'after-content.json'), JSON.stringify(after, null, 2), {mode: 0o600})
  const withoutSystem = document => Object.fromEntries(Object.entries(document).filter(([key]) => !['_rev', '_createdAt', '_updatedAt', '_system'].includes(key)))
  assert.equal(after.length, documents.length)
  for (const document of after) assert.deepEqual(withoutSystem(document), withoutSystem(expected.get(document._id)), `Unexpected change outside reviewed metadata/alt text: ${document._id}`)
}
console.log(JSON.stringify(report, null, 2))
