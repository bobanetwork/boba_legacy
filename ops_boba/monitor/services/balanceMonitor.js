const ethers = require('ethers')
const GlobalEnv = require('./utils/globalEnv')
const { sleep } = require('@eth-optimism/core-utils')
const { formatBigNumberToEther } = require('./utils/utils')

class balanceMonitorService extends GlobalEnv {
  constructor() {
    super(...arguments)

    this.l1Balances = {}
    this.l2Balances = {}
  }

  async initConnection() {
    this.logger.info('Trying to connect to the L1 network...')
    for (let i = 0; i < 10; i++) {
      try {
        await this.L1Provider.detectNetwork()
        this.logger.info('Successfully connected to the L1 network.')
        break
      } catch (err) {
        if (i < 9) {
          this.logger.info('Unable to connect to L1 network', {
            retryAttemptsRemaining: 10 - i,
          })
          await sleep(1000)
        } else {
          throw new Error(
            `Unable to connect to the L1 network, check that your L1 endpoint is correct.`
          )
        }
      }
    }
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

  async startBalanceMonitor() {
    for (const l1Addresses of this.l1BalanceMonitorAddresses) {
      const l1Balance = await this.L1Provider.getBalance(l1Addresses)
      this.l1Balances[l1Addresses] = formatBigNumberToEther(l1Balance)
    }
    for (const l2Addresses of this.l2BalanceMonitorAddresses) {
      const l2Balance = await this.L2Provider.getBalance(l2Addresses)
      this.l2Balances[l2Addresses] = formatBigNumberToEther(l2Balance)
    }
    this.logger.info('l1Balances', { l1Balances: this.l1Balances })
    this.logger.info('l2Balances', { l2Balances: this.l2Balances })
    await sleep(this.balanceMonitorInterval)
  }
}

module.exports = balanceMonitorService
