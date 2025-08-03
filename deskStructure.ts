import { StructureResolver } from 'sanity/structure';

const deskStructure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      // Grouped pages
      S.listItem()
        .title('Pages')
        .child(
          S.list()
            .title('Pages')
            .items([
              S.listItem()
                .title('Work Page')
                .child(S.document().schemaType('workPage').documentId('workPage')),
            ])
        ),
      S.divider(),

      // Normal documents
      S.documentTypeListItem('project').title('Projects'),
    ]);

export default deskStructure;