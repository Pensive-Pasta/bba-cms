import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {mkdir, writeFile} from 'node:fs/promises'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'

export const projectId = '9s2ar5mb'
export const dataset = 'production'
export const studioId = 'studioPage'
export const legacyKeys = ['691653f0b884', 'a664f024c4e2', '981b844c5c80', '9b6ce947b1b6']
export const originalRefs = [
  'image-6875dbd5dceab4c7f8032155eef5eb3f564d5451-592x394-png',
  'image-1fe56491f3f3ebb8c7d916509a86d82b6dea05d2-593x386-png',
  'image-08ee7de6bfe03fb738db58b6a226dc54cd6db3e1-385x511-png',
  'image-ecdf94960c737ab407578900190f787238f4cfc7-801x532-png',
]
// One existing, consecutive photo sequence: team image, then the portrait with
// the two complementary landscape working shots. No text boundary is crossed.
export const editorialRefs = [originalRefs[0], originalRefs[2], originalRefs[1], originalRefs[3]]
const placements = ['full', 'portrait-stack', 'half', 'half']

export function configureStudioProfile(document, assets) {
  assert.equal(document._id, studioId, 'Only the published Studio document is supported')
  assert.equal(document._type, 'studioPage')
  assert.ok(Array.isArray(document.profileBlocks), 'Profile content must be an array')
  const blocks = document.profileBlocks
  const existingRefs = blocks.flatMap((block) => block.images?.map((image) => image.asset?._ref) ?? [])
  assert.equal(existingRefs.length, originalRefs.length, 'Profile image count changed; inspect again before migrating')
  assert.deepEqual([...existingRefs].sort(), [...originalRefs].sort(), 'Profile asset membership changed')
  const legacy = blocks.filter((block) => block._type === 'imageBlock')
  const byId = new Map(assets.map((asset) => [asset._id, asset]))
  for (const ref of originalRefs) {
    const asset = byId.get(ref)
    assert.ok(asset, `Missing existing Profile asset: ${ref}; no substitution or upload was attempted`)
    assert.ok(asset.metadata?.dimensions?.width > 0 && asset.metadata?.dimensions?.height > 0, 'Image dimensions are required')
  }

  if (!legacy.length) {
    const gallery = blocks.find((block) => block._key === legacyKeys[0])
    assert.equal(gallery?._type, 'galleryBlock', 'Expected the migrated Profile gallery')
    assert.equal(gallery.presentation, 'editorial')
    assert.deepEqual(gallery.images.map((image) => image.asset?._ref), editorialRefs)
    assert.deepEqual(gallery.images.map((image) => image.editorialLayout), placements)
    return blocks
  }

  assert.deepEqual(legacy.map((block) => block._key), legacyKeys, 'Profile image blocks changed; inspect again before migrating')
  const start = blocks.indexOf(legacy[0])
  assert.deepEqual(blocks.slice(start, start + legacy.length), legacy, 'Never merge across intervening text or other blocks')
  for (const block of legacy) {
    assert.deepEqual(Object.keys(block).sort(), ['_key', '_type', 'images'], 'Unexpected legacy block metadata; preserve it explicitly before migrating')
    assert.equal(block.images?.length, 1, 'Expected one original image per legacy block')
  }
  const images = legacy.flatMap((block) => block.images)
  assert.deepEqual(images.map((image) => image.asset?._ref), originalRefs, 'Profile image references or order changed')
  assert.ok(images.every((image) => image._key), 'Original image keys are required')
  assert.equal(new Set(images.map((image) => image._key)).size, images.length, 'Image keys must remain unique')
  const byRef = new Map(images.map((image) => [image.asset._ref, image]))
  const gallery = {
    _key: legacy[0]._key,
    _type: 'galleryBlock',
    presentation: 'editorial',
    images: editorialRefs.map((ref, index) => {
      // Legacy size is replaced by the schema's editorial placement. All image
      // metadata, reference IDs, stable keys, alt text, captions and crops stay.
      const {size, ...image} = byRef.get(ref)
      return {...image, editorialLayout: placements[index]}
    }),
  }
  const result = [...blocks.slice(0, start), gallery, ...blocks.slice(start + legacy.length)]
  const untouched = (items) => items.filter((block) => !legacyKeys.includes(block._key))
  assert.deepEqual(untouched(result), untouched(blocks), 'Non-image Profile content must remain byte-equivalent')
  for (const ref of originalRefs) assert.equal(gallery.images.filter((image) => image.asset._ref === ref).length, 1)
  return result
}

const stable = (doc) => Object.fromEntries(Object.entries(doc).filter(([key]) => !['profileBlocks', '_rev', '_updatedAt', '_system'].includes(key)))
const digest = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex')

export async function run({publish = false, backupRoot = resolve(import.meta.dirname, '../backups')} = {}) {
  if (process.env.PUBLIC_SANITY_PROJECT_ID) assert.equal(process.env.PUBLIC_SANITY_PROJECT_ID, projectId)
  const token = process.env.SANITY_API_TOKEN || process.env.SANITY_AUTH_TOKEN
  assert.ok(token, 'Provide an authorized Sanity token through the environment')
  const {createClient} = await import('@sanity/client')
  const client = createClient({projectId, dataset, apiVersion: '2025-02-19', perspective: 'raw', useCdn: false, token, maxRetries: 0})
  assert.equal(client.config().projectId, projectId)
  assert.equal(client.config().dataset, dataset)
  const before = await client.fetch('*[_type == "studioPage"] | order(_id)')
  assert.ok(!before.some((doc) => doc._id === `drafts.${studioId}`), 'Studio has an unpublished draft; inspect it before migrating')
  const document = before.find((doc) => doc._id === studioId)
  assert.ok(document, 'Published Studio document was not found')
  const backup = resolve(backupRoot, `studio-profile-editorial-${new Date().toISOString().replaceAll(':', '-')}.local`)
  await mkdir(backup, {recursive: true, mode: 0o700})
  await writeFile(resolve(backup, 'before-studio.json'), JSON.stringify(document, null, 2), {mode: 0o600})
  await writeFile(resolve(backup, 'before-studio-records.json'), JSON.stringify(before, null, 2), {mode: 0o600})
  const assets = await client.fetch('*[_type == "sanity.imageAsset" && _id in $refs]{_id,originalFilename,url,metadata{dimensions}}', {refs: originalRefs})
  await writeFile(resolve(backup, 'assets.json'), JSON.stringify(assets, null, 2), {mode: 0o600})
  const projectsBefore = await client.fetch('*[_type == "project"] | order(_id)')
  await writeFile(resolve(backup, 'before-projects.sha256'), digest(projectsBefore) + '\n', {mode: 0o600})
  const profileBlocks = configureStudioProfile(document, assets)
  const gallery = profileBlocks.find((block) => block._key === legacyKeys[0])
  const manifest = {
    projectId, dataset, documentId: studioId, revision: document._rev,
    originalBlocks: document.profileBlocks.map((block) => ({key: block._key, type: block._type, images: block.images?.map((image) => ({key: image._key, ref: image.asset?._ref, size: image.size}))})),
    finalBlocks: profileBlocks.map((block) => ({key: block._key, type: block._type})),
    imageOrder: gallery.images.map((image) => ({key: image._key, ref: image.asset._ref, placement: image.editorialLayout})),
  }
  await writeFile(resolve(backup, 'manifest.json'), JSON.stringify(manifest, null, 2), {mode: 0o600})
  await writeFile(resolve(backup, 'expected-profileBlocks.json'), JSON.stringify(profileBlocks, null, 2), {mode: 0o600})
  console.log(JSON.stringify({projectId, dataset, documentId: studioId, backup, publish, originalImageCount: document.profileBlocks.flatMap((block) => block.images ?? []).length, finalImageCount: gallery.images.length, legacyBlocksReplaced: document.profileBlocks.filter((block) => block._type === 'imageBlock').map((block) => block._key), imageOrder: manifest.imageOrder}, null, 2))
  if (JSON.stringify(profileBlocks) === JSON.stringify(document.profileBlocks)) {
    console.log('Already migrated; no mutation sent.')
    return {backup, changed: false}
  }
  if (!publish) {
    console.log('Dry run only; no mutation sent.')
    return {backup, changed: false}
  }
  // This is the existing published ID, not a draft. Patch only Profile, guarded
  // by its backed-up revision; other Studio fields cannot be overwritten.
  await client.patch(studioId).ifRevisionId(document._rev).set({profileBlocks}).commit({visibility: 'sync'})
  const after = await client.fetch('*[_type == "studioPage"] | order(_id)')
  const updated = after.find((doc) => doc._id === studioId)
  await writeFile(resolve(backup, 'after-studio.json'), JSON.stringify(updated, null, 2), {mode: 0o600})
  assert.deepEqual(updated.profileBlocks, profileBlocks)
  assert.deepEqual(stable(updated), stable(document), 'Unexpected change outside Studio Profile')
  assert.deepEqual(after.filter((doc) => doc._id !== studioId), before.filter((doc) => doc._id !== studioId))
  const published = await client.withConfig({perspective: 'published'}).getDocument(studioId)
  assert.deepEqual(published.profileBlocks, profileBlocks, 'Published content did not match the migration')
  assert.equal(digest(await client.fetch('*[_type == "project"] | order(_id)')), digest(projectsBefore), 'Project records changed during migration')
  assert.deepEqual(configureStudioProfile(updated, assets), profileBlocks, 'The migration must be safe to rerun')
  console.log('Published and verified Studio Profile: four unique existing assets, unchanged text/metadata/other tabs, unchanged projects, idempotent result.')
  return {backup, changed: true}
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  run({publish: process.argv.includes('--publish')}).catch((error) => {console.error(error.message); process.exitCode = 1})
}
