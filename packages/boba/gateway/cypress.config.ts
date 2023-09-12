import { defineConfig } from 'cypress'
import synpressPlugins from '@synthetixio/synpress/plugins'
import * as dotenv from 'dotenv'
dotenv.config()

export default defineConfig({
  userAgent: 'synpress',
  chromeWebSecurity: true,
  defaultCommandTimeout: 60000,
  pageLoadTimeout: 60000,
  requestTimeout: 60000,
  e2e: {
    testIsolation: false,
    setupNodeEvents: (on, config) => {
      synpressPlugins(on, config)
    },
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: [
      'cypress/e2e/**/page.spec.cy.ts',
      'cypress/e2e/**/bridge.spec.cy.ts',
      'cypress/e2e/**/history.spec.cy.ts',
    ],
  },
  env: {
    target_hash: process.env.CYPRESS_TEST_HASH,
  },
})
