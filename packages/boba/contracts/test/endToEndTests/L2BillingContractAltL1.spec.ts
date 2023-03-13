import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
import { ethers } from 'hardhat'
import { Contract, Signer, utils } from 'ethers'

let L2BillingContract: Contract
let l2FeeWallet: string
const exitFee = utils.parseEther('1')

let signer: Signer
let signer2: Signer
let signerAddress: string

describe('L2BillingContractAltL1 Tests', async () => {
  before(async () => {
    signer = (await ethers.getSigners())[0]
    signer2 = (await ethers.getSigners())[1]
    signerAddress = await signer.getAddress()

    l2FeeWallet = signerAddress

    const billingContract = await ethers.getContractFactory(
      'L2BillingContractAltL1'
    )
    L2BillingContract = await billingContract.deploy()
    await L2BillingContract.deployed()
    await L2BillingContract.initialize(
      '0x4200000000000000000000000000000000000006',
      l2FeeWallet,
      exitFee
    )
  })

  describe('Initialization', async () => {
    it('should revert when initialize with invalid params', async () => {
      const billingContract = await ethers.getContractFactory(
        'L2BillingContractAltL1'
      )
      const l2BillingContract = await billingContract.deploy()
      await l2BillingContract.deployed()
      await expect(
        l2BillingContract.initialize(
          '0x0000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000'
        )
      ).to.be.revertedWith('Fee token address cannot be zero')
    })

    it('should have correct address', async () => {
      const feeTokenAddress = await L2BillingContract.feeTokenAddress()
      expect(feeTokenAddress).to.eq(
        '0x4200000000000000000000000000000000000006'
      )
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
        L2BillingContract.initialize(
          '0x4200000000000000000000000000000000000006',
          l2FeeWallet,
          exitFee
        )
      ).to.be.revertedWith('Contract has been initialized')
    })
  })

  describe('Collect fee', async () => {
    it('should revert when sending insufficient balance', async () => {
      await expect(
        L2BillingContract.connect(signer2).collectFee()
      ).to.be.revertedWith('exit fee does not match')
    })

    it('should collect fee successfully', async () => {
      const balanceBefore = await signer.provider.getBalance(
        L2BillingContract.address
      )
      await L2BillingContract.connect(signer2).collectFee({ value: exitFee })
      const balanceAfter = await signer.provider.getBalance(
        L2BillingContract.address
      )

      expect(balanceAfter.sub(balanceBefore)).to.eq(exitFee)
    })

    it('should not withdaw fee if balance is too low', async () => {
      await expect(L2BillingContract.withdraw()).to.be.revertedWith(
        'Balance is too low'
      )
    })

    it('should withdraw fee successfully', async () => {
      await signer.sendTransaction({
        to: L2BillingContract.address,
        value: ethers.utils.parseEther('15'),
      })

      const L2BillingContractBalanace = await signer.provider.getBalance(
        L2BillingContract.address
      )

      const blockNumber = await signer.provider.getBlockNumber()
      const block = await signer.provider.getBlock(blockNumber)
      const gasPrice = await signer.provider.getGasPrice()
      const gasFee = block.gasUsed.mul(gasPrice)

      const balanceBefore = await signer.provider.getBalance(signerAddress)
      await L2BillingContract.connect(signer2).withdraw()
      const balanceAfter = await signer.provider.getBalance(signerAddress)
      expect(balanceBefore).to.eq(balanceAfter.sub(L2BillingContractBalanace))
    })
  })
})
