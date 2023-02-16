const { ethers } = require('hardhat')
const { expect } = require('./setup')
const balanceMonitorService = require('../services/balanceMonitor')

let service

describe('BalanceMonitor Tests', () => {
  it('should connect to node', async () => {
    service = new balanceMonitorService()
    service.L1Provider = ethers.provider
    service.L2Provider = ethers.provider
    await service.initConnection()
  })

  it('should record the balances', async () => {
    const signer = (await ethers.getSigners())[0]

    const wallet1 = ethers.Wallet.createRandom().connect(ethers.provider)
    const wallet2 = ethers.Wallet.createRandom().connect(ethers.provider)
    const wallet3 = ethers.Wallet.createRandom().connect(ethers.provider)

    await signer.sendTransaction({
      to: wallet1.address,
      value: ethers.utils.parseEther('1'),
    })
    await signer.sendTransaction({
      to: wallet2.address,
      value: ethers.utils.parseEther('2'),
    })
    await signer.sendTransaction({
      to: wallet3.address,
      value: ethers.utils.parseEther('3'),
    })

    /* eslint-disable */
    service.l1BalanceMonitorAddresses = [wallet1.address, wallet2.address, wallet3.address]
    service.l2BalanceMonitorAddresses = [wallet1.address, wallet2.address, wallet3.address]
    service.balanceMonitorInterval = 1000
    await service.startBalanceMonitor()

    expect(service.l1Balances[wallet1.address]).to.be.eq(1)
    expect(service.l1Balances[wallet2.address]).to.be.eq(2)
    expect(service.l1Balances[wallet3.address]).to.be.eq(3)
    expect(service.l2Balances[wallet1.address]).to.be.eq(1)
    expect(service.l2Balances[wallet2.address]).to.be.eq(2)
    expect(service.l2Balances[wallet3.address]).to.be.eq(3)
    /* eslint-enable */
  })
})
