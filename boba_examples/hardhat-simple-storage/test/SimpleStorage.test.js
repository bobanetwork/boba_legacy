/* External Imports */
const { ethers, network } = require('hardhat')
const chai = require('chai')
const { solidity } = require('ethereum-waffle')
const { expect } = chai

chai.use(solidity)

describe(`SimpleStorage`, () => {

  let account1

  before(`load account`, async () => {
    ;[ account1 ] = await ethers.getSigners()
  })

  let Store

  before(`deploy SimpleStorage contract`, async () => {
    console.log('Deploying SimpleStorage contract')
    const Factory__SimpleStorage = await ethers.getContractFactory('SimpleStorage')
    Store = await Factory__SimpleStorage.connect(account1).deploy(41)
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
