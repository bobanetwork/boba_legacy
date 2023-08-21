import { defineConfig } from 'cypress'
import * as dotenv from 'dotenv'
dotenv.config()

export default defineConfig({
  e2e: {
    baseUrl: process.env.BASE_URL,
  },
})
