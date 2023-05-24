/* External Imports */
import { ethers } from 'hardhat'
import { Signer, Contract } from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'
import { expect } from '../../setup'

let L1ERC1155Bridge: Contract
let L2ERC1155Bridge: Contract
let L1CrossDomainMessenger: Contract
let L1StandardERC1155: Contract
let L2StandardERC1155: Contract
let ERC1155: Contract
const deployERC1155 = async (uri): Promise<Contract> => {
  return (await ethers.getContractFactory('ERC1155')).deploy(uri)
}
// eslint-disable-next-line prettier/prettier
const deployL2StandardERC11555 = async (l2Bridge, l1Contract, uri): Promise<Contract> => {
  // eslint-disable-next-line prettier/prettier
  return (await ethers.getContractFactory('L2StandardERC1155')).deploy(l2Bridge, l1Contract, uri)
}
// eslint-disable-next-line prettier/prettier
const deployL1StandardERC1155 = async (l1Bridge, l2Contract, uri): Promise<Contract> => {
  // eslint-disable-next-line prettier/prettier
  return (await ethers.getContractFactory('L1StandardERC1155')).deploy(l1Bridge, l2Contract, uri)
}
const deployL1ERC1155Bridge = async (): Promise<Contract> => {
  return (await ethers.getContractFactory('L1ERC1155Bridge')).deploy()
}
const deployL2ERC1155Bridge = async (): Promise<Contract> => {
  return (await ethers.getContractFactory('L2ERC1155Bridge')).deploy()
}
const deployL1CrossDomainMessenger = async (): Promise<Contract> => {
  const signer: Signer = (await ethers.getSigners())[0]
  return (
    await getContractFactory('L1CrossDomainMessenger').connect(signer)
  ).deploy()
}

describe('L1ERC1155Bridge Tests', () => {
  describe('L1ERC1155Bridge ownership', () => {
    beforeEach(async () => {
      L1ERC1155Bridge = await deployL1ERC1155Bridge()
      L2ERC1155Bridge = await deployL2ERC1155Bridge()
      L1CrossDomainMessenger = await deployL1CrossDomainMessenger()
    })
    it('should NOT be able to change the owner', async () => {
      const oldOwner = '0x0000000000000000000000000000000000000000'
      const newOwner = '0x0000000000000000000000000000000000000001'
      expect(await L1ERC1155Bridge.owner()).to.be.equal(oldOwner)
      await expect(
        L1ERC1155Bridge.transferOwnership(newOwner)
      ).to.be.revertedWith('Caller is not the owner')
    })
    it('changing gas reverts on not initialized', async () => {
      const newGas = 1
      await expect(L1ERC1155Bridge.configureGas(newGas)).to.be.revertedWith(
        'Caller is not the owner'
      )
    })
  })

  describe('L1ERC1155Bridge tests initialized', () => {
    beforeEach(async () => {
      L1ERC1155Bridge = await deployL1ERC1155Bridge()
      L2ERC1155Bridge = await deployL2ERC1155Bridge()
      L1CrossDomainMessenger = await deployL1CrossDomainMessenger()
    })

    it('should be able to initialize and change the gas', async () => {
      const magicGas = 1400000
      await L1ERC1155Bridge.initialize(
        L1CrossDomainMessenger.address,
        L2ERC1155Bridge.address
      )
      expect(await L1ERC1155Bridge.l2Bridge()).to.be.equal(
        L2ERC1155Bridge.address
      )
      expect(await L1ERC1155Bridge.messenger()).to.be.equal(
        L1CrossDomainMessenger.address
      )
      const signer: Signer = (await ethers.getSigners())[0]
      expect(await L1ERC1155Bridge.owner()).to.be.equal(
        await signer.getAddress()
      )
      expect(await L1ERC1155Bridge.depositL2Gas()).to.be.equal(magicGas)
      // now test gas change
      expect(await L1ERC1155Bridge.configureGas(magicGas + 1))
      expect(await L1ERC1155Bridge.depositL2Gas()).to.be.equal(magicGas + 1)
    })

    it('should not be able to init twice', async () => {
      const signer: Signer = (await ethers.getSigners())[1]
      await expect(
        L1ERC1155Bridge.initialize(
          L2ERC1155Bridge.address,
          L1CrossDomainMessenger.address
        )
      )
      await expect(
        L1ERC1155Bridge.connect(signer).initialize(
          L2ERC1155Bridge.address,
          L1CrossDomainMessenger.address,
          { from: await signer.getAddress() }
        )
      ).to.be.revertedWith('Initializable: contract is already initialized')
    })

    it('should not be able to init with zero address messenger', async () => {
      await expect(
        L1ERC1155Bridge.initialize(
          '0x0000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000001'
        )
      ).to.be.revertedWith('zero address not allowed')
    })
    it('should not be able to init with zero address L2ERC1155Bridge', async () => {
      await expect(
        L1ERC1155Bridge.initialize(
          '0x0000000000000000000000000000000000000001',
          '0x0000000000000000000000000000000000000000'
        )
      ).to.be.revertedWith('zero address not allowed')
    })
  })

  describe('cover registerPair', () => {
    beforeEach(async () => {
      L1ERC1155Bridge = await deployL1ERC1155Bridge()
      L2ERC1155Bridge = await deployL2ERC1155Bridge()
      L1CrossDomainMessenger = await deployL1CrossDomainMessenger()
      ERC1155 = await deployERC1155('uri')
      L2StandardERC1155 = await deployL2StandardERC11555(
        L2ERC1155Bridge.address,
        ERC1155.address,
        'uri'
      )
      L1StandardERC1155 = await deployL1StandardERC1155(
        L1ERC1155Bridge.address,
        ERC1155.address,
        'uri'
      )
      await L1ERC1155Bridge.initialize(
        L1CrossDomainMessenger.address,
        L2ERC1155Bridge.address
      )
    })
    it('can register a token pair with L1 creation', async () => {
      const l1 = 0
      await L1ERC1155Bridge.registerPair(
        ERC1155.address,
        L2StandardERC1155.address,
        'L1'
      )
      const pairInfo = await L1ERC1155Bridge.pairTokenInfo(ERC1155.address)
      expect(pairInfo.l1Contract).eq(ERC1155.address)
      expect(pairInfo.l2Contract).eq(L2StandardERC1155.address)
      expect(pairInfo.baseNetwork).eq(l1)
    })
    it('can not register a NFT twice', async () => {
      await L1ERC1155Bridge.registerPair(
        ERC1155.address,
        L2StandardERC1155.address,
        'L1'
      )
      await expect(
        L1ERC1155Bridge.registerPair(
          ERC1155.address,
          L2StandardERC1155.address,
          'L1'
        )
      ).to.be.revertedWith('L2 token address already registered')
    })
    it('can register a token with L2 creation', async () => {
      const l2 = 1
      await L1ERC1155Bridge.registerPair(
        L1StandardERC1155.address,
        ERC1155.address,
        'L2'
      )
      const pairInfo = await L1ERC1155Bridge.pairTokenInfo(
        L1StandardERC1155.address
      )
      expect(pairInfo.l1Contract).eq(L1StandardERC1155.address)
      expect(pairInfo.l2Contract).eq(ERC1155.address)
      expect(pairInfo.baseNetwork).eq(l2)
    })
    it('cant register a token with faulty base network', async () => {
      await expect(
        L1ERC1155Bridge.registerPair(ERC1155.address, ERC1155.address, 'L211')
      ).to.be.revertedWith('Invalid Network')
    })
    it('cant register a NFT with incorrect settings', async () => {
      const SecondaryERC1155 = await deployERC1155('uri')
      const IncorrectL1StandardERC1155 = await deployL1StandardERC1155(
        L1ERC1155Bridge.address,
        SecondaryERC1155.address,
        'uri'
      )
      await expect(
        L1ERC1155Bridge.registerPair(
          IncorrectL1StandardERC1155.address,
          ERC1155.address,
          'L2'
        )
      ).to.be.revertedWith('L1 contract is not compatible with L2 contract')
    })
    it('cant register if not owner', async () => {
      const signer: Signer = (await ethers.getSigners())[1]
      await expect(
        L1ERC1155Bridge.connect(signer).registerPair(
          ERC1155.address,
          ERC1155.address,
          'L2',
          {
            from: await signer.getAddress(),
          }
        )
      ).to.be.revertedWith('Caller is not the owner')
    })
  })
})
