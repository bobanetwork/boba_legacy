import { expect } from '../../../setup'

/* External Imports */
import { ethers } from 'hardhat'
import { ContractFactory, Contract, Signer } from 'ethers'

describe('L2_BOBA', () => {
  let signer1: Signer
  let signer2: Signer
  before(async () => {
    ;[signer1, signer2] = await ethers.getSigners()
  })

  let Factory__L2_BOBA: ContractFactory
  before(async () => {
    Factory__L2_BOBA = await ethers.getContractFactory('L2_BOBA')
  })

  let L2_BOBA: Contract
  beforeEach(async () => {
    L2_BOBA = await Factory__L2_BOBA.deploy(ethers.constants.AddressZero)
  })

  describe('transfer', () => {
    it('should revert', async () => {
      await expect(
        L2_BOBA.transfer(await signer2.getAddress(), 100)
      ).to.be.revertedWith(
        'L2_BOBA: transfer is disabled pending further community discussion.'
      )
    })
  })

  describe('approve', () => {
    it('should revert', async () => {
      await expect(
        L2_BOBA.approve(await signer2.getAddress(), 100)
      ).to.be.revertedWith(
        'L2_BOBA: approve is disabled pending further community discussion.'
      )
    })
  })

  describe('transferFrom', () => {
    it('should revert', async () => {
      await expect(
        L2_BOBA.transferFrom(
          await signer1.getAddress(),
          await signer2.getAddress(),
          100
        )
      ).to.be.revertedWith(
        'L2_BOBA: transferFrom is disabled pending further community discussion.'
      )
    })
  })

  describe('increaseAllowance', () => {
    it('should revert', async () => {
      await expect(
        L2_BOBA.increaseAllowance(await signer2.getAddress(), 100)
      ).to.be.revertedWith(
        'L2_BOBA: increaseAllowance is disabled pending further community discussion.'
      )
    })
  })

  describe('decreaseAllowance', () => {
    it('should revert', async () => {
      await expect(
        L2_BOBA.decreaseAllowance(await signer2.getAddress(), 100)
      ).to.be.revertedWith(
        'L2_BOBA: decreaseAllowance is disabled pending further community discussion.'
      )
    })
  })

  describe('transferOwnership', () => {
    it('should transfer ownsership', async () => {
      await L2_BOBA.transferOwnership(await signer2.getAddress())
      expect(await L2_BOBA.owner()).to.equal(await signer2.getAddress())
    })
  })

  describe('addWhitelistBridge', () => {
    it('should add signer1 to the whitelist bridge', async () => {
      const signer1Address = await signer1.getAddress()
      const tx = await L2_BOBA.addWhitelistBridge(signer1Address)
      const receipt = await tx.wait()
      const [addWhitelistBridgeEvent] = receipt.events

      expect(await L2_BOBA.whitelistBridges(signer1Address)).to.equal(true)
      expect(addWhitelistBridgeEvent.event).to.be.eq('AddWhitelistBridge')
    })
  })

  describe('revokeWhitelistBridge', () => {
    it('should revoke signer1 from the whitelist bridge', async () => {
      const signer1Address = await signer1.getAddress()
      const tx = await L2_BOBA.revokeWhitelistBridge(signer1Address)
      const receipt = await tx.wait()
      const [revokeWhitelistBridgeEvent] = receipt.events

      expect(await L2_BOBA.whitelistBridges(signer1Address)).to.equal(false)
      expect(revokeWhitelistBridgeEvent.event).to.be.eq('RevokeWhitelistBridge')
    })
  })

  describe('pause', async () => {
    it('should pause the contract', async () => {
      const tx = await L2_BOBA.pause()
      const receipt = await tx.wait()
      const [pauseEvent] = receipt.events

      expect(await L2_BOBA.paused()).to.equal(true)
      expect(pauseEvent.event).to.be.eq('Paused')
    })

    it('should not be able to mint tokens', async () => {
      const signer1Address = await signer1.getAddress()
      await L2_BOBA.addWhitelistBridge(signer1Address)
      await L2_BOBA.pause()

      await expect(
        L2_BOBA.connect(signer1).mint(signer1Address, 100)
      ).to.be.revertedWith('Pausable: paused')
    })

    it('should not be able to burn tokens', async () => {
      const signer1Address = await signer1.getAddress()
      await L2_BOBA.addWhitelistBridge(signer1Address)
      await L2_BOBA.pause()

      await expect(
        L2_BOBA.connect(signer1).burn(signer1Address, 0)
      ).to.be.revertedWith('Pausable: paused')
    })
  })

  describe('unpause', async () => {
    it('should unpause the contract', async () => {
      await L2_BOBA.pause()
      const tx = await L2_BOBA.unpause()
      const receipt = await tx.wait()
      const [pauseEvent] = receipt.events

      expect(await L2_BOBA.paused()).to.equal(false)
      expect(pauseEvent.event).to.be.eq('Unpaused')
    })

    it('should be able to mint tokens', async () => {
      const signer1Address = await signer1.getAddress()
      await L2_BOBA.addWhitelistBridge(signer1Address)
      await L2_BOBA.pause()
      await L2_BOBA.unpause()

      await L2_BOBA.connect(signer1).mint(signer1Address, 100)
      expect(await L2_BOBA.balanceOf(signer1Address)).to.equal(100)
    })

    it('should be able to burn tokens', async () => {
      const signer1Address = await signer1.getAddress()
      await L2_BOBA.addWhitelistBridge(signer1Address)
      await L2_BOBA.pause()
      await L2_BOBA.unpause()

      await L2_BOBA.connect(signer1).mint(signer1Address, 100)
      await L2_BOBA.connect(signer1).burn(signer1Address, 100)

      expect(await L2_BOBA.balanceOf(signer1Address)).to.equal(0)
    })
  })
})
