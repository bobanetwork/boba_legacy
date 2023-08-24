import { defineConfig } from 'cypress'
import synpressPlugins from '@synthetixio/synpress/plugins'
import * as dotenv from 'dotenv'
dotenv.config()
import webpackPreprocessor from '@cypress/webpack-preprocessor'
import { tagify } from 'cypress-tags'
import { cypressWebpackConfig } from './cypress/webpack.config.js'

export default defineConfig({
  userAgent: 'synpress',
  chromeWebSecurity: true,
  defaultCommandTimeout: 30000,
  pageLoadTimeout: 30000,
  requestTimeout: 30000,
  e2e: {
    testIsolation: false,
    setupNodeEvents: (on, config) => {
      on(
        'file:preprocessor',
        webpackPreprocessor({ webpackOptions: cypressWebpackConfig })
      )
      on('file:preprocessor', tagify(config))
      synpressPlugins(on, config)
    },
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
  },
})
