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
})
