const DatabaseService = require('./database.service')
const OptimismEnv = require('./utilities/optimismEnv')
const { logger } = require('../services/utilities/logger')

class ResponseTime extends OptimismEnv {
  constructor() {
    super(...arguments)
    this.databaseService = new DatabaseService()
  }

  async logResponseTime() {
    try {
      await this.databaseService.getLatestTx(logger)
    } catch (error) {
      logger.error('Unhandled exception during logging tx', {
        message: error.toString(),
        stack: error.stack,
        code: error.code,
      })
    }
    try {
      await this.databaseService.getLatestReceipt(logger)
    } catch (error) {
      logger.error('Unhandled exception during logging receipt', {
        message: error.toString(),
        stack: error.stack,
        code: error.code,
      })
    }
  }
}

module.exports = ResponseTime
