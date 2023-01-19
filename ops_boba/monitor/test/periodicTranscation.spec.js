const { ethers } = require('hardhat')
const { expect } = require('./setup')
const periodicTransactionService = require('../services/periodicTransaction')
const { Timer, loop } = require('./utils')

let service

describe('PeriodicTransaction Tests', () => {
  it('should connect to node', async () => {
    service = new periodicTransactionService()
    service.L2Provider = ethers.provider
    await service.initConnection()
  })

  it('should not send tx if the private key is not provided', async () => {
    const prevBlockNumber = await ethers.provider.getBlockNumber()
    service.periodicTransactionInterval = 1000
    await service.sendTransactionPeriodically()
    const postBlockNumber = await ethers.provider.getBlockNumber()
    expect(prevBlockNumber).to.be.eq(postBlockNumber)
  })

  it('should send tx if the private key is provided', async () => {
    ;[signer] = await ethers.getSigners()
    wallet = ethers.Wallet.createRandom().connect(ethers.provider)
    await signer.sendTransaction({
      to: wallet.address,
      value: ethers.utils.parseEther('1'),
    })
    const prevBlockNumber = await ethers.provider.getBlockNumber()
    const prevBalance = await wallet.getBalance()
    service = new periodicTransactionService()
    service.periodicTransactionPK = wallet.privateKey
    service.L2Provider = ethers.provider
    service.periodicTransactionInterval = 1000
    await service.sendTransactionPeriodically()
    const postBlockNumber = await ethers.provider.getBlockNumber()
    const postBalance = await wallet.getBalance()
    const tx = (await ethers.provider.getBlockWithTransactions(postBlockNumber)).transactions[0]
    const gasPrice = tx.gasPrice
    const receipt = await ethers.provider.getTransactionReceipt(tx.hash)
    const gasUsed = receipt.gasUsed
    const gasFee = gasUsed.mul(gasPrice)
    expect(prevBlockNumber).to.be.eq(postBlockNumber - 1)
    expect(prevBalance).to.be.eq(postBalance.add(gasFee))
  })

  it('should send tx multiple times if the private key is provided', async () => {
    const prevBalance = await wallet.getBalance()
    const prevBlockNumber = await ethers.provider.getBlockNumber()
    await Promise.race([
      Timer(5000),
      loop(() => service.sendTransactionPeriodically()),
    ])
    const postBalance = await wallet.getBalance()
    const postBlockNumber = await ethers.provider.getBlockNumber()
    expect(prevBlockNumber).to.be.lt(postBlockNumber + 2)
    expect(postBalance).to.be.lt(prevBalance)
  })
})
