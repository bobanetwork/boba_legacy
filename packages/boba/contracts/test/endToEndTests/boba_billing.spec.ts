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
let l2FeeWallet: string
const exitFee = utils.parseEther('1')

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

    l2FeeWallet = signerAddress

    L2Boba = await (
      await ethers.getContractFactory('L1ERC20')
    ).deploy(initialSupply, tokenName, tokenSymbol, 18)

    const billingContract = await ethers.getContractFactory('L2BillingContract')
    L2BillingContract = await billingContract.deploy()
    await L2BillingContract.deployed()
    await L2BillingContract.initialize(L2Boba.address, l2FeeWallet, exitFee)
  })

  describe('Initialization', async () => {
    it('should revert when initialize with invalid params', async () =>{
      const billingContract = await ethers.getContractFactory('L2BillingContract')
      const l2BillingContract = await billingContract.deploy()
      await l2BillingContract.deployed()
      await expect(l2BillingContract.
        initialize('0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000')
        ).to.be.revertedWith('Fee token address cannot be zero')
    })

    it('should have correct address', async () => {
      const feeTokenAddress = await L2BillingContract.feeTokenAddress()
      expect(feeTokenAddress).to.eq(L2Boba.address)
    })

    it('should have correct treasury address', async () => {
      const foundAddress = await L2BillingContract.l2FeeWallet()
      expect(foundAddress).to.eq(l2FeeWallet)
    })

    it('should have correct owner address set', async () => {
      const owner = await L2BillingContract.owner()
      expect(owner).to.eq(signerAddress)
    })

    it('should have correct exit fee', async () => {
      const fee = await L2BillingContract.exitFee()
      expect(fee).to.eq(exitFee)
    })

    it('should not initialize twice', async () => {
      await expect(
        L2BillingContract.initialize(L2Boba.address, l2FeeWallet, exitFee)
      ).to.be.revertedWith('Contract has been initialized')
    })
  })

  describe('Collect fee', async () => {
    it('should revert when having insufficient balance', async () => {
      await L2Boba.connect(signer2).approve(L2BillingContract.address, exitFee)
      await expect(
        L2BillingContract.connect(signer2).collectFee()
      ).to.be.revertedWith('ERC20: transfer amount exceeds balance')
    })

    it('should collect fee successfully', async () => {
      await L2Boba.connect(signer).transfer(signer2Address, exitFee)

      const balanceBefore = await L2Boba.balanceOf(L2BillingContract.address)
      await L2Boba.connect(signer2).approve(L2BillingContract.address, exitFee)
      await L2BillingContract.connect(signer2).collectFee()
      const balanceAfter = await L2Boba.balanceOf(L2BillingContract.address)

      expect(balanceAfter.sub(balanceBefore)).to.eq(exitFee)
    })

    it('should not withdaw fee if balance is too low', async () => {
      await expect(L2BillingContract.withdraw()).to.be.revertedWith(
        'Balance is too low'
      )
    })

    it('should withdraw fee successfully', async () => {
      await L2Boba.connect(signer).transfer(
        L2BillingContract.address,
        ethers.utils.parseEther('150')
      )

      const L2BillingContractBalanace = await L2Boba.balanceOf(
        L2BillingContract.address
      )

      const balanceBefore = await L2Boba.balanceOf(signerAddress)
      await L2BillingContract.connect(signer).withdraw()
      const balanceAfter = await L2Boba.balanceOf(signerAddress)
      expect(balanceBefore).to.eq(balanceAfter.sub(L2BillingContractBalanace))
    })
  })
})
