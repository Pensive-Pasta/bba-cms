import {defineConfig} from 'sanity';
import {structureTool} from 'sanity/structure';
import {visionTool} from '@sanity/vision';
import {schemaTypes} from './schemaTypes';
import deskStructure from './deskStructure';

export default defineConfig({
  name: 'default',
  title: 'bba-cms',

  projectId: '9s2ar5mb',
  dataset: 'production',

  plugins: [structureTool({ structure: deskStructure }), visionTool()],

  schema: {
    types: schemaTypes,
  },
});