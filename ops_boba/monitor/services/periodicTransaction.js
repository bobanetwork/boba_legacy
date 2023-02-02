const ethers = require('ethers')
const GlobalEnv = require('./utils/globalEnv')
const { sleep } = require('@eth-optimism/core-utils')

class periodicTransactionService extends GlobalEnv {
  constructor() {
    super(...arguments)

    this.wallet = null
  }

  async initConnection() {
    this.logger.info('Trying to connect to the L2 network...')
    for (let i = 0; i < 10; i++) {
      try {
        await this.L2Provider.detectNetwork()
        this.logger.info('Successfully connected to the L2 network.')
        break
      } catch (err) {
        if (i < 9) {
          this.logger.info('Unable to connect to L2 network', {
            retryAttemptsRemaining: 10 - i,
          })
          await sleep(1000)
        } else {
          throw new Error(
            `Unable to connect to the L2 network, check that your L2 endpoint is correct.`
          )
        }
      }
    }
  }

  async sendTransactionPeriodically() {
    const transferAmount = ethers.utils.parseEther('0.01')
    if (this.periodicTransactionPK) {
      this.wallet = new ethers.Wallet(this.periodicTransactionPK).connect(
        this.L2Provider
      )
      try {
        await this.wallet.sendTransaction({
          to: this.wallet.address,
          value: transferAmount,
        })
        this.logger.info('Sent transaction periodically for testing in L2', {
          to: this.wallet.address,
          amount: transferAmount,
        })
      } catch {
        this.logger.error(
          'Error while sending transaction periodically for testing in L2'
        )
      }
    }
    await sleep(this.periodicTransactionInterval)
  }
}

module.exports = periodicTransactionService
