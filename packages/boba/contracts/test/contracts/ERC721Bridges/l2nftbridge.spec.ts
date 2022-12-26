/* External Imports */
import { ethers } from 'hardhat'
import { Signer, Contract } from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'
import { expect } from '../../setup'

let L1NFTBridge: Contract
let L2NFTBridge: Contract
let L1CrossDomainMessenger: Contract
let L2CrossDomainMessenger: Contract
let L1StandardERC721: Contract
let L2StandardERC721: Contract
let ERC721: Contract
const deployNFT = async (name, symbol): Promise<Contract> => {
  return (await ethers.getContractFactory('ERC721')).deploy(name, symbol)
}
// eslint-disable-next-line prettier/prettier
const deployL2StandardERC721 = async (l2Bridge, l1Contract, name, symbol, baseTokenUri): Promise<Contract> => {
  // eslint-disable-next-line prettier/prettier
  return (await ethers.getContractFactory('L2StandardERC721')).deploy(l2Bridge, l1Contract, name, symbol, baseTokenUri)
}
// eslint-disable-next-line prettier/prettier
const deployL1StandardERC721 = async (l1Bridge, l2Contract, name, symbol, baseTokenUri): Promise<Contract> => {
  // eslint-disable-next-line prettier/prettier
  return (await ethers.getContractFactory('L1StandardERC721')).deploy(l1Bridge, l2Contract, name, symbol, baseTokenUri)
}
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
const deployL2CrossDomainMessenger = async (
  l1CrossDomainMessenger
): Promise<Contract> => {
  const signer: Signer = (await ethers.getSigners())[0]
  return (
    await getContractFactory('L2CrossDomainMessenger').connect(signer)
  ).deploy(l1CrossDomainMessenger)
}

describe('L2NFTBridge Tests', () => {
  describe('L2NFTBridge ownership', () => {
    beforeEach(async () => {
      L1NFTBridge = await deployL1NFTBridge()
      L2NFTBridge = await deployL2NFTBridge()
      L1CrossDomainMessenger = await deployL1CrossDomainMessenger()
      L2CrossDomainMessenger = await deployL2CrossDomainMessenger(
        L1CrossDomainMessenger.address
      )
      await L2NFTBridge.initialize(
        L2CrossDomainMessenger.address,
        L2NFTBridge.address
      )
    })
    it('should NOT be able to change the owner', async () => {
      const oldOwner = (await ethers.getSigners())[0]
      const newOwner = (await ethers.getSigners())[1]
      expect(await L2NFTBridge.owner()).to.be.equal(oldOwner.address)
      await expect(
        L2NFTBridge.connect(newOwner).transferOwnership(newOwner.address)
      ).to.be.revertedWith('Caller is not the owner')
    })
    it('changing gas reverts on not initialized', async () => {
      const newGas = 1
      await expect(
        L2NFTBridge.connect((await ethers.getSigners())[1]).configureGas(newGas)
      ).to.be.revertedWith('Caller is not the owner')
    })
  })

  describe('L2NFTBridge tests initialized', () => {
    beforeEach(async () => {
      L1NFTBridge = await deployL1NFTBridge()
      L2NFTBridge = await deployL2NFTBridge()
      L1CrossDomainMessenger = await deployL1CrossDomainMessenger()
      L2CrossDomainMessenger = await deployL2CrossDomainMessenger(
        L1CrossDomainMessenger.address
      )
    })

    it('should be able to initialize and change the gas', async () => {
      const magicGas = 100000
      await L2NFTBridge.initialize(
        L2CrossDomainMessenger.address,
        L1NFTBridge.address
      )
      expect(await L2NFTBridge.l1NFTBridge()).to.be.equal(L1NFTBridge.address)
      expect(await L2NFTBridge.messenger()).to.be.equal(
        L2CrossDomainMessenger.address
      )
      const signer: Signer = (await ethers.getSigners())[0]
      expect(await L2NFTBridge.owner()).to.be.equal(await signer.getAddress())
      expect(await L2NFTBridge.exitL1Gas()).to.be.equal(magicGas)
      // now test gas change
      expect(await L2NFTBridge.configureGas(magicGas + 1))
      expect(await L2NFTBridge.exitL1Gas()).to.be.equal(magicGas + 1)
    })

    it('should not be able to init twice', async () => {
      await expect(
        L2NFTBridge.initialize(
          L2CrossDomainMessenger.address,
          L2NFTBridge.address
        )
      )
      await expect(
        L2NFTBridge.initialize(
          L2CrossDomainMessenger.address,
          L2NFTBridge.address
        )
      ).to.be.revertedWith('Initializable: contract is already initialized')
    })

    it('should not be able to init with zero address messenger', async () => {
      await expect(
        L2NFTBridge.initialize(
          '0x0000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000001'
        )
      ).to.be.revertedWith('zero address not allowed')
    })
    it('should not be able to init with zero address l2NFTbridge', async () => {
      await expect(
        L2NFTBridge.initialize(
          '0x0000000000000000000000000000000000000001',
          '0x0000000000000000000000000000000000000000'
        )
      ).to.be.revertedWith('zero address not allowed')
    })
  })

  describe('cover registerNFTPair', () => {
    beforeEach(async () => {
      L1NFTBridge = await deployL1NFTBridge()
      L2NFTBridge = await deployL2NFTBridge()
      L1CrossDomainMessenger = await deployL1CrossDomainMessenger()
      L2CrossDomainMessenger = await deployL2CrossDomainMessenger(
        L1CrossDomainMessenger.address
      )
      ERC721 = await deployNFT('name', 'symbol')
      L2StandardERC721 = await deployL2StandardERC721(
        L2NFTBridge.address,
        ERC721.address,
        'name',
        'symbol',
        'baseTokenUri'
      )
      L1StandardERC721 = await deployL1StandardERC721(
        L1NFTBridge.address,
        ERC721.address,
        'name',
        'symbol',
        'baseTokenUri'
      )
      await L2NFTBridge.initialize(
        L2CrossDomainMessenger.address,
        L2NFTBridge.address
      )
    })
    it('can register a NFT with L1 creation', async () => {
      const l1 = 0
      await L2NFTBridge.registerNFTPair(
        ERC721.address,
        L2StandardERC721.address,
        'L1'
      )
      const pairNFTInfo = await L2NFTBridge.pairNFTInfo(
        L2StandardERC721.address
      )
      expect(pairNFTInfo.l1Contract).eq(ERC721.address)
      expect(pairNFTInfo.l2Contract).eq(L2StandardERC721.address)
      expect(pairNFTInfo.baseNetwork).eq(l1)
    })
    it('can not register a NFT twice', async () => {
      await L2NFTBridge.registerNFTPair(
        ERC721.address,
        L2StandardERC721.address,
        'L1'
      )
      await expect(
        L2NFTBridge.registerNFTPair(
          ERC721.address,
          L2StandardERC721.address,
          'L1'
        )
      ).to.be.revertedWith('L1 NFT address already registered')
    })
    it('can register a NFT with L2 creation', async () => {
      const l2 = 1
      await L2NFTBridge.registerNFTPair(
        L1StandardERC721.address,
        ERC721.address,
        'L2'
      )
      const pairNFTInfo = await L2NFTBridge.pairNFTInfo(ERC721.address)
      expect(pairNFTInfo.l1Contract).eq(L1StandardERC721.address)
      expect(pairNFTInfo.l2Contract).eq(ERC721.address)
      expect(pairNFTInfo.baseNetwork).eq(l2)
    })
    it('cant register a NFT with faulty base network', async () => {
      await expect(
        L2NFTBridge.registerNFTPair(ERC721.address, ERC721.address, 'L211')
      ).to.be.revertedWith('Invalid Network')
    })
    it('cant register if not owner', async () => {
      const signer: Signer = (await ethers.getSigners())[1]
      await expect(
        L2NFTBridge.connect(signer).registerNFTPair(
          ERC721.address,
          ERC721.address,
          'L2',
          {
            from: await signer.getAddress(),
          }
        )
      ).to.be.revertedWith('Caller is not the owner')
    })
  })
})
