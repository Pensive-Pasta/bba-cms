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
                .title('Home Page')
                .child(S.document().schemaType('homePage').documentId('homePage')),

              S.listItem()
                .title('Work Page')
                .child(S.document().schemaType('workPage').documentId('workPage')),

                S.listItem()
                  .title('Studio Page')
                  .child(S.document().schemaType('studioPage').documentId('studioPage')),
                  
              S.listItem()
                .title('Insight Page')
                .child(S.document().schemaType('insightPage').documentId('insightPage')),

              S.listItem()
                .title('Contact Page')
                .child(S.document().schemaType('contactPage').documentId('contactPage')),

              S.listItem()
                .title('Legal Page')
                .child(S.document().schemaType('legalPage').documentId('legalPage')),

            ])
        ),
      S.divider(),

      // Normal documents
      S.documentTypeListItem('project').title('Projects'),
      S.documentTypeListItem('insight').title('Insights'),
    ]);

export default deskStructure;
