/* External Imports */
const { ethers, network } = require('hardhat')
const { providers, Wallet } = require('ethers')
const chai = require('chai')
const { solidity } = require('ethereum-waffle')
const { expect } = chai
const hre = require('hardhat')


chai.use(solidity)

const cfg = hre.network.config
const local_provider = new providers.JsonRpcProvider(cfg['url'])
const gasOverride = { gasLimit: 8_000_000 }

describe(`SimpleStorage`, () => {

  let account1

  before(`load account`, async () => {
    ;[ account1 ] = await ethers.getSigners()
  })

  let Store

  before(`deploy SimpleStorage contract`, async () => {
    const accountBalance = await local_provider.getBalance(account1.address)
    console.log('Balance: ', accountBalance)
    console.log('Deploying SimpleStorage contract')
    const Factory__SimpleStorage = await ethers.getContractFactory('SimpleStorage')
    Store = await Factory__SimpleStorage.connect(account1).deploy(41, gasOverride)
    await Store.deployTransaction.wait()
  })

  it(`should be able to read a number set via constructor from storage`, async () => {
    const tx = await Store.get()
    console.log("The number was set to:", tx.toString(), "during deploy")
    expect(tx.toString()).to.equal('41')
  })

  it(`should be able to write a new value and then read it from storage`, async () => {
    tx = await Store.set(43)
    tx = await Store.get()
    console.log("The number was changed to:", tx.toString())
    expect(tx.toString()).to.equal('43')
  })

})
