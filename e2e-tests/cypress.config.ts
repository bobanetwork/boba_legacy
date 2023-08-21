import { defineConfig } from 'cypress'
import synpressPlugins from '@synthetixio/synpress/plugins'

export default defineConfig({
  userAgent: 'synpress',
  screenshotsFolder: 'screenshots',
  videosFolder: 'videos',
  video: true,
  chromeWebSecurity: true,
  viewportWidth: 1366,
  viewportHeight: 850,
  defaultCommandTimeout: 30000,
  pageLoadTimeout: 30000,
  requestTimeout: 30000,
  env: {
    coverage: false,
  },
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    includeShadowDom: true,
    baseUrl: process.env.GATEWAY_URL,
    supportFile: 'support/index.ts',
    fixturesFolder: 'fixtures',
    specPattern: 'specs/**/*.spec.{js,jsx,ts,tsx}',
  },
})
