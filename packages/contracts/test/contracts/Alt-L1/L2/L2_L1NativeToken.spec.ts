import { expect } from '../../../setup'

/* External Imports */
import { ethers } from 'hardhat'
import { ContractFactory, Contract, Signer } from 'ethers'

describe('L2_L1NativeToken', () => {
  let signer1: Signer
  let signer2: Signer
  before(async () => {
    ;[signer1, signer2] = await ethers.getSigners()
  })

  let Factory__L2_L1NativeToken: ContractFactory
  before(async () => {
    Factory__L2_L1NativeToken = await ethers.getContractFactory(
      'L2_L1NativeToken'
    )
  })

  let L2_L1NativeToken: Contract
  beforeEach(async () => {
    L2_L1NativeToken = await Factory__L2_L1NativeToken.deploy(
      ethers.constants.AddressZero,
      ethers.constants.AddressZero,
      'TEST TOKEN',
      'TEST',
      18
    )
  })

  describe('transfer', () => {
    it('should revert', async () => {
      await expect(
        L2_L1NativeToken.transfer(await signer2.getAddress(), 100)
      ).to.be.revertedWith('ERC20: transfer amount exceeds balance')
    })
  })

  describe('mint', () => {
    it('should revert', async () => {
      await expect(
        L2_L1NativeToken.mint(await signer1.getAddress(), 100)
      ).to.be.revertedWith('Only L2 Bridge can mint and burn')
    })
  })

  describe('burn', () => {
    it('should revert', async () => {
      await expect(
        L2_L1NativeToken.burn(await signer1.getAddress(), 100)
      ).to.be.revertedWith('Only L2 Bridge can mint and burn')
    })
  })

  describe('decimals', () => {
    it('should get decimals', async () => {
      expect(await L2_L1NativeToken.decimals()).to.be.equal(18)
    })
  })

  describe('supportsInterface', () => {
    it('should support interface', async () => {
      expect(await L2_L1NativeToken.supportsInterface('0x1d1d8b63')).to.be.true
    })
  })

  describe('approve', () => {
    it('should approve', async () => {
      await L2_L1NativeToken.approve(await signer2.getAddress(), 100)
      const allowance = await L2_L1NativeToken.allowance(
        await signer1.getAddress(),
        await signer2.getAddress()
      )
      expect(allowance).to.be.equal(100)
    })
  })
})
