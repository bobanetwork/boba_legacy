import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
import { ethers } from 'hardhat'
import { Contract } from 'ethers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

describe('WBOBA9', () => {
  let signer: SignerWithAddress
  let otherSigner: SignerWithAddress

  before(async () => {
    ;[signer, otherSigner] = await ethers.getSigners()
  })

  let WBOBA9: Contract
  beforeEach(async () => {
    WBOBA9 = await (await ethers.getContractFactory('WBOBA9')).deploy()
  })

  describe('deposit', () => {
    it('should create WBOBA with fallback function', async () => {
      await expect(
        signer.sendTransaction({
          to: WBOBA9.address,
          value: 200,
        })
      ).to.not.be.reverted

      expect(await WBOBA9.balanceOf(signer.address)).to.be.equal(200)
    })

    it('should create WBOBA with deposit function', async () => {
      await expect(WBOBA9.deposit({ value: 100 })).to.not.be.reverted

      expect(await WBOBA9.balanceOf(signer.address)).to.be.equal(100)
    })
  })

  describe('withdraw', () => {
    it('should revert when withdraw amount is bigger than balance', async () => {
      await expect(WBOBA9.withdraw(10000)).to.be.reverted
    })

    it('should withdraw to eth', async () => {
      await WBOBA9.deposit({ value: 100 })
      await expect(WBOBA9.withdraw(50)).to.not.be.reverted
      expect(await WBOBA9.balanceOf(signer.address)).to.be.equal(50)
    })
  })

  describe('totalSupply', () => {
    it('should return the totalSupply', async () => {
      await expect(WBOBA9.totalSupply()).to.not.be.reverted
    })
  })

  describe('transfer', () => {
    it('should revert when sending more than deposited', async () => {
      await WBOBA9.deposit({ value: 100 })
      await expect(WBOBA9.transfer(otherSigner.address, 500)).to.be.reverted
    })

    it('should transfer WBOBA to an other address', async () => {
      await WBOBA9.deposit({ value: 100 })
      await expect(WBOBA9.transfer(otherSigner.address, 50)).to.not.be.reverted

      expect(await WBOBA9.balanceOf(signer.address)).to.be.equal(50)

      expect(await WBOBA9.balanceOf(otherSigner.address)).to.be.equal(50)
    })
  })

  describe('transferFrom', () => {
    it('should revert when there is no allowance', async () => {
      await WBOBA9.deposit({ value: 100 })
      await expect(
        WBOBA9.connect(otherSigner).transferFrom(
          signer.address,
          otherSigner.address,
          50
        )
      ).to.be.reverted
    })

    it('should transfer WBOBA to an other address when there is approvement', async () => {
      await WBOBA9.deposit({ value: 100 })
      await WBOBA9.approve(otherSigner.address, 50)
      await expect(
        WBOBA9.connect(otherSigner).transferFrom(
          signer.address,
          otherSigner.address,
          50
        )
      ).to.not.be.reverted
    })
  })
})
