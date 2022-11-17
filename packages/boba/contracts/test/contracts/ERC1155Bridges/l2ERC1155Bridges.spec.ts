/* External Imports */
import { ethers } from 'hardhat'
import { Signer, Contract } from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'
import { expect } from '../../setup'

let L1ERC1155Bridge: Contract
let L2ERC1155Bridge: Contract
let L1CrossDomainMessenger: Contract
let L2CrossDomainMessenger: Contract
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
const deployL2CrossDomainMessenger = async (
  l1CrossDomainMessenger
): Promise<Contract> => {
  const signer: Signer = (await ethers.getSigners())[0]
  return (
    await getContractFactory('L2CrossDomainMessenger').connect(signer)
  ).deploy(l1CrossDomainMessenger)
}

describe('L2ERC1155Bridge Tests', () => {
  describe('L2ERC1155Bridge ownership', () => {
    beforeEach(async () => {
      L1ERC1155Bridge = await deployL1ERC1155Bridge()
      L2ERC1155Bridge = await deployL2ERC1155Bridge()
      L1CrossDomainMessenger = await deployL1CrossDomainMessenger()
      L2CrossDomainMessenger = await deployL2CrossDomainMessenger(
        L1CrossDomainMessenger.address
      )
      await L2ERC1155Bridge.initialize(
        L2CrossDomainMessenger.address,
        L2ERC1155Bridge.address
      )
    })
    it('should NOT be able to change the owner', async () => {
      const oldOwner = (await ethers.getSigners())[0]
      const newOwner = (await ethers.getSigners())[1]
      expect(await L2ERC1155Bridge.owner()).to.be.equal(oldOwner.address)
      await expect(
        L2ERC1155Bridge.connect(newOwner).transferOwnership(newOwner.address)
      ).to.be.revertedWith('Caller is not the owner')
    })
    it('changing gas reverts on not initialized', async () => {
      const newGas = 1
      await expect(
        L2ERC1155Bridge.connect((await ethers.getSigners())[1]).configureGas(
          newGas
        )
      ).to.be.revertedWith('Caller is not the owner')
    })
  })

  describe('L2ERC1155Bridge tests initialized', () => {
    beforeEach(async () => {
      L1ERC1155Bridge = await deployL1ERC1155Bridge()
      L2ERC1155Bridge = await deployL2ERC1155Bridge()
      L1CrossDomainMessenger = await deployL1CrossDomainMessenger()
      L2CrossDomainMessenger = await deployL2CrossDomainMessenger(
        L1CrossDomainMessenger.address
      )
    })

    it('should be able to initialize and change the gas', async () => {
      const magicGas = 100000
      await L2ERC1155Bridge.initialize(
        L2CrossDomainMessenger.address,
        L1ERC1155Bridge.address
      )
      expect(await L2ERC1155Bridge.l1Bridge()).to.be.equal(
        L1ERC1155Bridge.address
      )
      expect(await L2ERC1155Bridge.messenger()).to.be.equal(
        L2CrossDomainMessenger.address
      )
      const signer: Signer = (await ethers.getSigners())[0]
      expect(await L2ERC1155Bridge.owner()).to.be.equal(
        await signer.getAddress()
      )
      expect(await L2ERC1155Bridge.exitL1Gas()).to.be.equal(magicGas)
      // now test gas change
      expect(await L2ERC1155Bridge.configureGas(magicGas + 1))
      expect(await L2ERC1155Bridge.exitL1Gas()).to.be.equal(magicGas + 1)
    })

    it('should not be able to init twice', async () => {
      await expect(
        L2ERC1155Bridge.initialize(
          L2CrossDomainMessenger.address,
          L2ERC1155Bridge.address
        )
      )
      await expect(
        L2ERC1155Bridge.initialize(
          L2CrossDomainMessenger.address,
          L2ERC1155Bridge.address
        )
      ).to.be.revertedWith('Initializable: contract is already initialized')
    })

    it('should not be able to init with zero address messenger', async () => {
      await expect(
        L2ERC1155Bridge.initialize(
          '0x0000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000001'
        )
      ).to.be.revertedWith('zero address not allowed')
    })
    it('should not be able to init with zero address L2ERC1155Bridge', async () => {
      await expect(
        L2ERC1155Bridge.initialize(
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
      L2CrossDomainMessenger = await deployL2CrossDomainMessenger(
        L1CrossDomainMessenger.address
      )
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
      await L2ERC1155Bridge.initialize(
        L2CrossDomainMessenger.address,
        L2ERC1155Bridge.address
      )
    })
    it('can register a token with L1 creation', async () => {
      const l1 = 0
      await L2ERC1155Bridge.registerPair(
        ERC1155.address,
        L2StandardERC1155.address,
        'L1'
      )
      const pairTokenInfo = await L2ERC1155Bridge.pairTokenInfo(
        L2StandardERC1155.address
      )
      expect(pairTokenInfo.l1Contract).eq(ERC1155.address)
      expect(pairTokenInfo.l2Contract).eq(L2StandardERC1155.address)
      expect(pairTokenInfo.baseNetwork).eq(l1)
    })
    it('can not register a token twice', async () => {
      await L2ERC1155Bridge.registerPair(
        ERC1155.address,
        L2StandardERC1155.address,
        'L1'
      )
      await expect(
        L2ERC1155Bridge.registerPair(
          ERC1155.address,
          L2StandardERC1155.address,
          'L1'
        )
      ).to.be.revertedWith('L1 token address already registered')
    })
    it('can register a token with L2 creation', async () => {
      const l2 = 1
      await L2ERC1155Bridge.registerPair(
        L1StandardERC1155.address,
        ERC1155.address,
        'L2'
      )
      const pairTokenInfo = await L2ERC1155Bridge.pairTokenInfo(ERC1155.address)
      expect(pairTokenInfo.l1Contract).eq(L1StandardERC1155.address)
      expect(pairTokenInfo.l2Contract).eq(ERC1155.address)
      expect(pairTokenInfo.baseNetwork).eq(l2)
    })
    it('cant register a token with faulty base network', async () => {
      await expect(
        L2ERC1155Bridge.registerPair(ERC1155.address, ERC1155.address, 'L211')
      ).to.be.revertedWith('Invalid Network')
    })
    it('cant register if not owner', async () => {
      const signer: Signer = (await ethers.getSigners())[1]
      await expect(
        L2ERC1155Bridge.connect(signer).registerPair(
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
