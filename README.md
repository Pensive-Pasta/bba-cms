# Sanity Clean Content Studio

## Gallery alt text

Gallery `altText` is entirely optional, regardless of whether the referenced image
asset has saved alt text. Missing descriptions never block image selection,
uploading, or publishing. The frontend handles missing alt text.

The website can optionally fall back to asset alt text (this repository contains
the Studio only). Inside a gallery block projection, use:

```groq
images[]{
  ...,
  "assetAltText": asset->altText
}
```

Then render the image with `alt={image.altText?.trim() || image.assetAltText?.trim() || ''}`.

The Media library is enabled in `sanity.config.ts`. Use its Studio tab to browse
assets and edit their shared alt text, or enter a gallery override for a specific
placement.

Congratulations, you have now installed the Sanity Content Studio, an open-source real-time content editing environment connected to the Sanity backend.

Now you can do the following things:

- [Read “getting started” in the docs](https://www.sanity.io/docs/introduction/getting-started?utm_source=readme)
- [Join the Sanity community](https://www.sanity.io/community/join?utm_source=readme)
- [Extend and build plugins](https://www.sanity.io/docs/content-studio/extending?utm_source=readme)

## Unified project publishing

Projects > Case Studies, Index Only and All Projects are filtered views of one collection.
Enter public information once. Include in Work index publishes a basic listing without
requiring a slug or photography. Enable project page requires a valid slug, hero image
(or video poster) and meaningful editorial text. Preparing content does not enable its page.

Home Page > Homepage project tiles controls the ordered homepage cells. White tiles can
retain a postcode label until their Project is known, or reference a Project to reuse its
postcode. White tiles never link. Work Page > Work grid case studies is an independent
ordered list of enabled photographed case studies. Removing a selection does not delete
its Project or disable its detail page. CMS changes reach the static website on its next build.

### Repeatable spreadsheet import

Run through the existing CLI login, never by embedding a token:

```sh
npx sanity exec scripts/import-project-index.mjs --with-user-token -- --workbook "/absolute/path/to/index.xlsx"
```

This is a no-write plan. Review its ignored backups directory: source, affected documents,
patch plan and discrepancies. It verifies both sheets agree, omits records explicitly marked
for omission, matches existing project numbers/naming aliases and uses deterministic IDs
for new records. Existing nonempty classifications, slugs, media, editorial content and SEO
are preserved. It seeds page selections only if absent, respecting future editorial changes.
A pre-existing draft receives the index metadata but its unfinished content stays unpublished.

Publication additionally requires `--publish --frontend-verification /absolute/path/checks.json`.
That JSON must contain `checks: {check: true, tests: true, build: true}` and a `files`
array of `{path, sha256}` entries for the verified frontend sources. Generate it only after
Astro checks, tests and a production build pass with the route guards in place. The importer
checks those hashes before one atomic, revision-locked transaction and compares all resulting
documents against its plan. Re-run the no-write plan to confirm zero operations.

The Rev5 workbook selects 120 entries, but project 115 has an explicit omission note,
so the approved import contains 119. Project 325 is already excluded as a duplicate of 275.
Project number 160 is duplicated outside the selected website rows and must be reconciled
before any wider business-data import. The spreadsheet Case Study marker never enables a page.
