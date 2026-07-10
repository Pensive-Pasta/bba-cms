import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '9s2ar5mb',
    dataset: 'production'
  },
  studioHost: 'bba-cms',
  deployment: {
    appId: 'cold242f6o1jpio8lilceo56',
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/cli#auto-updates
     */
    autoUpdates: true,
  },
})
