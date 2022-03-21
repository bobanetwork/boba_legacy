import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
import { ethers } from 'hardhat'
import {
  Contract,
  Signer,
  BigNumber,
  utils,
  BigNumberish,
  ContractFactory,
} from 'ethers'

let L2Boba: Contract
let L2BillingContract: Contract
let treasuryAddress: string
const transactionFee = utils.parseEther('1')

let signer: Signer
let signer2: Signer
let signerAddress: string
let signer2Address: string

const initialSupply = utils.parseEther('10000000000')
const tokenName = 'BOBA'
const tokenSymbol = 'BOBA'

describe('L2 Billing Contract', async () => {
  before(async () => {
    signer = (await ethers.getSigners())[0]
    signer2 = (await ethers.getSigners())[1]
    signerAddress = await signer.getAddress()
    signer2Address = await signer2.getAddress()

    treasuryAddress = signerAddress

    L2Boba = await (
      await ethers.getContractFactory('L1ERC20')
    ).deploy(initialSupply, tokenName, tokenSymbol, 18)

    const billingContract = await ethers.getContractFactory('L2BillingContract')
    L2BillingContract = await billingContract.deploy(
      L2Boba.address,
      treasuryAddress,
      transactionFee
    )
    await L2BillingContract.deployed()
  })

  describe('Initialization', async () => {
    it('should have correct address', async () => {
      const feeTokenAddress = await L2BillingContract.feeTokenAddress()
      expect(feeTokenAddress).to.eq(L2Boba.address)
    })

    it('should have correct treasury address', async () => {
      const foundAddress = await L2BillingContract.treasuryAddress()
      expect(foundAddress).to.eq(treasuryAddress)
    })

    it('should have correct owner address set', async () => {
      const owner = await L2BillingContract.owner()
      expect(owner).to.eq(signerAddress)
    })

    it('should have correct transaction fee', async () => {
      const fee = await L2BillingContract.transactionFee()
      expect(fee).to.eq(transactionFee)
    })
  })

  describe('Collect fee', async () => {
    it('should fail when address is incorrect', async () => {
      await expect(
        L2BillingContract.collectFeeFrom(
          '0x0000000000000000000000000000000000000000'
        )
      ).to.be.revertedWith('account cannot be zero')
    })

    it('should revert when having insufficient balance', async () => {
      await L2Boba.connect(signer2).approve(
        L2BillingContract.address,
        transactionFee
      )
      await expect(
        L2BillingContract.connect(signer2).collectFeeFrom(signer2Address)
      ).to.be.revertedWith('ERC20: transfer amount exceeds balance')
    })

    it('should collect fee from an address successfully', async () => {
      await L2Boba.connect(signer).transfer(signer2Address, transactionFee)

      const balanceBefore = await L2Boba.balanceOf(treasuryAddress)
      await L2Boba.connect(signer2).approve(
        L2BillingContract.address,
        transactionFee
      )
      await L2BillingContract.connect(signer2).collectFeeFrom(signer2Address)
      const balanceAfter = await L2Boba.balanceOf(treasuryAddress)

      expect(balanceAfter.sub(balanceBefore)).to.eq(transactionFee)
    })

    it('should collect fee successfully', async () => {
      await L2Boba.connect(signer).transfer(signer2Address, transactionFee)

      const balanceBefore = await L2Boba.balanceOf(treasuryAddress)
      await L2Boba.connect(signer2).approve(
        L2BillingContract.address,
        transactionFee
      )
      await L2BillingContract.connect(signer2).collectFee()
      const balanceAfter = await L2Boba.balanceOf(treasuryAddress)

      expect(balanceAfter.sub(balanceBefore)).to.eq(transactionFee)
    })
  })
})
