import assert from 'node:assert/strict'
import {mkdir, writeFile} from 'node:fs/promises'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'
import {createClient} from '@sanity/client'

const projectId = '9s2ar5mb'
const dataset = 'production'
const copperId = 'fb4f89b5-d561-4a1f-ba9a-170b517f79de'
export const openingFilenames = [
  'copper-house-copper-extension-evening-exterior.jpg',
  'copper-house-bespoke-oak-bespoke-window-seat.jpg',
  'copper-house-open-plan-kitchen-dining-extension.jpg',
  'copper-house-contemporary-kitchen-joinery.jpg',
]

export function configureCopper(document, assets, joineryAssetId) {
  assert.equal(document._id, copperId, 'Only the published Copper House document is supported')
  assert.equal(document.slug?.current, 'copper-house')
  const galleries = document.contentBlocks.filter((block) => block._type === 'galleryBlock')
  assert.equal(galleries.length, 1, 'Expected one existing gallery')
  const gallery = galleries[0]
  const byFilename = new Map(assets.map((asset) => [asset.originalFilename, asset]))
  const opening = openingFilenames.map((filename, index) => {
    const asset = index === 3 && joineryAssetId
      ? assets.find((item) => item._id === joineryAssetId)
      : byFilename.get(filename)
    assert.ok(asset, `Missing existing Sanity asset: ${filename}. No images were uploaded or substituted.`)
    assert.ok(asset.metadata?.dimensions?.width && asset.metadata?.dimensions?.height, `Missing dimensions: ${filename}`)
    return asset
  })
  const existingRefs = gallery.images.map((image) => image.asset._ref)
  assert.equal(new Set(existingRefs).size, existingRefs.length, 'Existing gallery has duplicate assets')
  const openingRefs = opening.map((asset) => asset._id)
  for (const ref of openingRefs.slice(0, 3)) assert.ok(existingRefs.includes(ref), 'The first three opening assets must already belong to this gallery')
  assert.equal(new Set(openingRefs).size, 4, 'Opening images must be four distinct assets')
  const first = opening.map((asset, index) => ({
    ...(gallery.images.find((image) => image.asset._ref === asset._id) ?? {
      _type: 'image', _key: 'copper-editorial-joinery',
      asset: {_type: 'reference', _ref: asset._id},
      altText: 'Pale blue kitchen cabinets with circular timber handles and an oak-topped island at Copper House.',
    }),
    editorialLayout: ['full', 'portrait-stack', 'half', 'half'][index],
  }))
  const remaining = gallery.images.filter((image) => !openingRefs.includes(image.asset._ref))
    .map((image) => ({...image, editorialLayout: image.editorialLayout ?? 'half'}))
  // Low-resolution drawings/details stay in half-width cells rather than being
  // automatically expanded across the entire page. Their original order survives.
  const images = [...first, ...remaining]
  for (const ref of existingRefs) assert.equal(images.filter((image) => image.asset._ref === ref).length, 1)
  assert.equal(new Set(images.map((image) => image.asset._ref)).size, images.length)
  return {...gallery, presentation: 'editorial', images}
}

export async function run({publish = false, joineryAssetId, backupRoot = resolve(import.meta.dirname, '../backups')} = {}) {
  if (process.env.PUBLIC_SANITY_PROJECT_ID) assert.equal(process.env.PUBLIC_SANITY_PROJECT_ID, projectId)
  const token = process.env.SANITY_API_TOKEN || process.env.SANITY_AUTH_TOKEN
  assert.ok(token, 'Provide a Sanity token through the environment')
  const client = createClient({projectId, dataset, apiVersion: '2025-02-19', useCdn: false, perspective: 'raw', token, maxRetries: 0})
  const before = await client.fetch('*[_type == "project"] | order(_id)')
  assert.ok(!before.some((doc) => doc._id === `drafts.${copperId}`), 'Copper House has an unpublished draft; resolve it before running')
  const document = before.find((doc) => doc._id === copperId)
  assert.ok(document, 'Published Copper House document not found')
  const backup = resolve(backupRoot, `copper-editorial-${new Date().toISOString().replaceAll(':', '-')}.local`)
  await mkdir(backup, {recursive: true, mode: 0o700})
  await writeFile(resolve(backup, 'before-projects.json'), JSON.stringify(before, null, 2), {mode: 0o600})
  await writeFile(resolve(backup, 'before-copper.json'), JSON.stringify(document, null, 2), {mode: 0o600})
  const assets = await client.fetch('*[_type == "sanity.imageAsset" && (_id in $refs || originalFilename in $filenames)]{_id,originalFilename,url,metadata{dimensions}}', {
    refs: [...document.contentBlocks.flatMap((block) => block.images?.map((image) => image.asset._ref) ?? []), ...(joineryAssetId ? [joineryAssetId] : [])],
    filenames: openingFilenames,
  })
  await writeFile(resolve(backup, 'assets.json'), JSON.stringify(assets, null, 2))
  console.log(JSON.stringify({projectId, dataset, backup, publish}))
  const gallery = configureCopper(document, assets, joineryAssetId)
  const contentBlocks = document.contentBlocks.map((block) => block._key === gallery._key ? gallery : block)
  await writeFile(resolve(backup, 'expected-copper.json'), JSON.stringify({...document, contentBlocks}, null, 2))
  const order = gallery.images.map((image) => ({filename: assets.find((asset) => asset._id === image.asset._ref)?.originalFilename, assetId: image.asset._ref, placement: image.editorialLayout}))
  console.log(JSON.stringify({order}, null, 2))
  if (JSON.stringify(contentBlocks) === JSON.stringify(document.contentBlocks)) {
    console.log('Already configured; no mutation sent.')
    return
  }
  if (!publish) {
    console.log('Dry run only; no mutation sent.')
    return
  }
  // Updating this already-published ID publishes the new content directly.
  // Revision locking prevents overwriting edits made since the backup.
  const path = `contentBlocks[_key==${JSON.stringify(gallery._key)}]`
  await client.patch(copperId).ifRevisionId(document._rev).set({
    [`${path}.presentation`]: gallery.presentation,
    [`${path}.images`]: gallery.images,
  }).commit({visibility: 'sync'})
  const after = await client.fetch('*[_type == "project"] | order(_id)')
  await writeFile(resolve(backup, 'after-projects.json'), JSON.stringify(after, null, 2), {mode: 0o600})
  assert.deepEqual(after.filter((doc) => doc._id !== copperId), before.filter((doc) => doc._id !== copperId), 'Other project records changed during this operation')
  const updated = after.find((doc) => doc._id === copperId)
  assert.deepEqual(updated.contentBlocks, contentBlocks)
  const unchangedFields = (doc) => Object.fromEntries(Object.entries(doc).filter(([key]) => !['contentBlocks', '_rev', '_updatedAt', '_system'].includes(key)))
  assert.deepEqual(unchangedFields(updated), unchangedFields(document), 'Unexpected change outside Copper House contentBlocks')
  assert.deepEqual(updated.contentBlocks.filter((block) => block._key !== gallery._key), document.contentBlocks.filter((block) => block._key !== gallery._key))
  const published = await client.withConfig({perspective: 'published'}).getDocument(copperId)
  assert.deepEqual(published.contentBlocks, contentBlocks)
  console.log('Published Copper House; verified images, all original copy/media/credits, and unchanged other project records.')
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const aliasIndex = process.argv.indexOf('--joinery-asset-id')
  run({publish: process.argv.includes('--publish'), joineryAssetId: aliasIndex >= 0 ? process.argv[aliasIndex + 1] : undefined})
    .catch((error) => { console.error(error.message); process.exitCode = 1 })
}
