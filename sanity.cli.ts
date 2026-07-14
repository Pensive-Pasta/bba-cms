import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '9s2ar5mb',
    dataset: 'production',
  },
  studioHost: 'wearebba',
  deployment: {
    appId: 'lbl4rsiao8bublihz7toto6c',
    autoUpdates: true,
  },
})