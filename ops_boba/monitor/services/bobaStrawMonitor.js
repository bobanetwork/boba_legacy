const ethers = require('ethers')
const GlobalEnv = require('./utils/globalEnv')
const { sleep } = require('@eth-optimism/core-utils')
const { formatBigNumberToEther } = require('./utils/utils')

class bobaStrawMonitorService extends GlobalEnv {
  constructor() {
    super(...arguments)

    this.bobaStrawContracts = []
    this.availableFunds = {}
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

    for (const bobaStrawContractAddress of this.bobaStrawContractAddresses) {
      const contract = new ethers.Contract(
        bobaStrawContractAddress,
        new ethers.utils.Interface([
          'function availableFunds () view returns (uint256)',
        ]),
        this.L2Provider
      )
      this.bobaStrawContracts = [...this.bobaStrawContracts, contract]
      this.logger.info('Added bobaStraw contract', {
        contractAddress: contract.address,
      })
    }
  }

  async startBobaStrawMonitor() {
    for (const bobaStrawContract of this.bobaStrawContracts) {
      const availableFunds = await bobaStrawContract.availableFunds()
      this.availableFunds = {
        ...this.availableFunds,
        [bobaStrawContract.address]: formatBigNumberToEther(availableFunds, 2),
      }
    }
    this.logger.info('bobaStraw balance', this.availableFunds)
    await sleep(this.bobaStrawMonitorInterval)
  }
}

module.exports = bobaStrawMonitorService
