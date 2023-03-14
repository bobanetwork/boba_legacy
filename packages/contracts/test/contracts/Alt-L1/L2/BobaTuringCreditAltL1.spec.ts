import { expect } from '../../../setup'
import { deploy } from '../../../helpers'

/* External Imports */
import { ethers } from 'hardhat'
import { Contract, Signer } from 'ethers'

describe('BobaTuringCreditAltL1', () => {
  let signer1: Signer
  let signer2: Signer
  let BobaTuringCredit: Contract
  before(async () => {
    ;[signer1, signer2] = await ethers.getSigners()
    BobaTuringCredit = await deploy('BobaTuringCreditAltL1', {
      args: [ethers.utils.parseEther('0.01')],
    })
  })

  describe('turingPrice', () => {
    it('should get turing price', async () => {
      expect(await BobaTuringCredit.turingPrice()).to.be.eq(
        ethers.utils.parseEther('0.01')
      )
    })

    it('should update turing price', async () => {
      const turingPrice = ethers.utils.parseEther('1')
      await BobaTuringCredit.updateTuringPrice(turingPrice)
      expect(await BobaTuringCredit.turingPrice()).to.be.eq(turingPrice)
    })
  })

  describe('ownership', async () => {
    it('should get owner address', async () => {
      expect(await BobaTuringCredit.owner()).to.be.eq(
        ethers.constants.AddressZero
      )
    })

    it('should transfer ownership', async () => {
      await BobaTuringCredit.transferOwnership(await signer2.getAddress())
      expect(await BobaTuringCredit.owner()).to.be.eq(
        await signer2.getAddress()
      )
      await BobaTuringCredit.connect(signer2).transferOwnership(
        await signer1.getAddress()
      )
    })
  })

  describe('turingToken', async () => {
    it('should get turing token', async () => {
      expect(await BobaTuringCredit.turingToken()).to.be.eq(
        ethers.constants.AddressZero
      )
    })

    it('should set turing token', async () => {
      await BobaTuringCredit.updateTuringToken(await signer2.getAddress())
      expect(await BobaTuringCredit.turingToken()).to.be.eq(
        await signer2.getAddress()
      )
    })
  })

  describe('addBalanceTo', async () => {
    it('should revert', async () => {
      const deposit = ethers.utils.parseEther('1')
      await expect(
        BobaTuringCredit.addBalanceTo(deposit, BobaTuringCredit.address, {
          value: deposit,
        })
      ).to.be.revertedWith('Invalid Helper Contract')
    })
  })

  describe('withdrawRevenue', async () => {
    it('should revert', async () => {
      const deposit = ethers.utils.parseEther('1')
      await expect(
        BobaTuringCredit.withdrawRevenue(deposit)
      ).to.be.revertedWith('Invalid Amount')
    })
  })
})
