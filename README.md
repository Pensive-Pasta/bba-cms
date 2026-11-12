# Sanity Clean Content Studio

## Gallery alt text

Gallery images accept an optional `altText` override. When it is blank, Studio
validation checks `altText` on the referenced image asset. An image must have a
nonblank description in one of those places.

The website must resolve the same fallback when querying gallery images (this
repository contains the Studio only). Inside a gallery block projection, use:

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
