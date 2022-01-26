/* External Imports */
import { ethers } from 'hardhat'
import { Signer, Contract } from 'ethers'
import { getContractFactory, predeploys } from '@eth-optimism/contracts'
import { expect } from '../../setup'

let L1NFTBridge: Contract
let L2NFTBridge: Contract
let L1CrossDomainMessenger: Contract
const deployL1NFTBridge = async (): Promise<Contract> => {
  return (await ethers.getContractFactory('L1NFTBridge')).deploy()
}
const deployL2NFTBridge = async (): Promise<Contract> => {
  return (await ethers.getContractFactory('L2NFTBridge')).deploy()
}
const deployL1CrossDomainMessenger = async (): Promise<Contract> => {
  const signer: Signer = (await ethers.getSigners())[0]
  return (
    await getContractFactory('L1CrossDomainMessenger').connect(signer)
  ).deploy()
}

describe('L1NFTBridge tests not initialized', () => {
  beforeEach(async () => {
    L1NFTBridge = await deployL1NFTBridge()
  })
  it('should be able to change the owner', async () => {
    const oldOwner = '0x0000000000000000000000000000000000000000'
    const newOwner = '0x0000000000000000000000000000000000000001'
    expect(await L1NFTBridge.owner()).to.be.equal(oldOwner)
    expect(await L1NFTBridge.transferOwnership(newOwner))
    expect(await L1NFTBridge.owner()).to.be.equal(newOwner)
  })
  it('changing gas reverts on not initialized', async () => {
    const newGas = 1
    await expect(L1NFTBridge.configureGas(newGas)).to.be.revertedWith(
      'Contract has not yet been initialized'
    )
  })
})

describe('L1NFTBridge tests initialized', () => {
  beforeEach(async () => {
    L1NFTBridge = await deployL1NFTBridge()
    L2NFTBridge = await deployL2NFTBridge()
    L1CrossDomainMessenger = await deployL1CrossDomainMessenger()
  })

  it('should be able to initialize and change the gas', async () => {
    const magicGas = 1400000
    await L1NFTBridge.initialize(
      L2NFTBridge.address,
      L1CrossDomainMessenger.address
    )
    // init works?
    expect(await L1NFTBridge.messenger()).to.be.equal(L2NFTBridge.address)
    expect(await L1NFTBridge.l2NFTBridge()).to.be.equal(
      L1CrossDomainMessenger.address
    )
    const signer: Signer = (await ethers.getSigners())[0]
    expect(await L1NFTBridge.owner()).to.be.equal(await signer.getAddress())
    expect(await L1NFTBridge.depositL2Gas()).to.be.equal(magicGas)
    // now test gas change
    expect(await L1NFTBridge.configureGas(magicGas + 1))
    expect(await L1NFTBridge.depositL2Gas()).to.be.equal(magicGas + 1)
  })

  it('should not be able to init if not owner', async () => {
    const newOwner = '0x0000000000000000000000000000000000000001'
    expect(await L1NFTBridge.transferOwnership(newOwner))
    const signer: Signer = (await ethers.getSigners())[1]
    await expect(
      L1NFTBridge.connect(signer).initialize(
        L2NFTBridge.address,
        L1CrossDomainMessenger.address,
        { from: await signer.getAddress() }
      )
    ).to.be.revertedWith('Caller is not the owner')
  })

  it('should not be able to init twice', async () => {
    await L1NFTBridge.initialize(
      L2NFTBridge.address,
      L1CrossDomainMessenger.address
    )
    await expect(
      L1NFTBridge.initialize(
        L2NFTBridge.address,
        L1CrossDomainMessenger.address
      )
    ).to.be.revertedWith('Initializable: contract is already initialized')
  })
  it('should not be able to init with zero address messenger', async () => {
    await expect(
      L1NFTBridge.initialize(
        '0x0000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000001'
      )
    ).to.be.revertedWith('zero address not allowed')
  })
  it('should not be able to init with zero address l2NFTbridge', async () => {
    await expect(
      L1NFTBridge.initialize(
        '0x0000000000000000000000000000000000000001',
        '0x0000000000000000000000000000000000000000'
      )
    ).to.be.revertedWith('zero address not allowed')
  })
})
