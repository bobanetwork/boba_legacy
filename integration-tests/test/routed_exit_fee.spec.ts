import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
import { Contract, ContractFactory, BigNumber, utils, ethers } from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'

import DiscretionaryExitFeeJson from '@boba/contracts/artifacts/contracts/DiscretionaryExitFee.sol/DiscretionaryExitFee.json'
import L1ERC20Json from '@boba/contracts/artifacts/contracts/test-helpers/L1ERC20.sol/L1ERC20.json'
import OMGLikeTokenJson from '@boba/contracts/artifacts/contracts/test-helpers/OMGLikeToken.sol/OMGLikeToken.json'
import L2BillingContractJson from '@boba/contracts/artifacts/contracts/L2BillingContract.sol/L2BillingContract.json'
import L2GovernanceERC20Json from '@boba/contracts/artifacts/contracts/standards/L2GovernanceERC20.sol/L2GovernanceERC20.json'

import { OptimismEnv } from './shared/env'

describe('Standard Exit Fee', async () => {
  let Factory__L1ERC20: ContractFactory
  let Factory__L2ERC20: ContractFactory
  let Factory__ExitFeeContract: ContractFactory

  let L1ERC20: Contract
  let L2ERC20: Contract
  let L1StandardBridge: Contract
  let ExitFeeContract: Contract

  let OMGLIkeToken: Contract
  let L2OMGLikeToken: Contract

  let L2BOBAToken: Contract
  let BOBABillingContract: Contract

  let env: OptimismEnv

  const initialSupply = utils.parseEther('10000000000')
  const tokenName = 'JLKN'
  const tokenSymbol = 'JLKN'

  before(async () => {
    env = await OptimismEnv.new()

    Factory__L1ERC20 = new ContractFactory(
      L1ERC20Json.abi,
      L1ERC20Json.bytecode,
      env.l1Wallet
    )

    const Factory__OMGLikeToken = new ContractFactory(
      OMGLikeTokenJson.abi,
      OMGLikeTokenJson.bytecode,
      env.l1Wallet
    )

    const L1StandardBridgeAddress = await env.addressesBASE
      .Proxy__L1StandardBridge

    L1StandardBridge = getContractFactory(
      'L1StandardBridge',
      env.l1Wallet
    ).attach(L1StandardBridgeAddress)

    const L2StandardBridgeAddress = await L1StandardBridge.l2TokenBridge()

    Factory__ExitFeeContract = new ContractFactory(
      DiscretionaryExitFeeJson.abi,
      DiscretionaryExitFeeJson.bytecode,
      env.l2Wallet
    )

    ExitFeeContract = await Factory__ExitFeeContract.deploy(
      L2StandardBridgeAddress
    )

    await ExitFeeContract.configureBillingContractAddress(
      env.addressesBOBA.Proxy__BobaBillingContract
    )

    //we deploy a new erc20, so tests won't fail on a rerun on the same contracts
    L1ERC20 = await Factory__L1ERC20.deploy(
      initialSupply,
      tokenName,
      tokenSymbol,
      18
    )
    await L1ERC20.deployTransaction.wait()

    OMGLIkeToken = await Factory__OMGLikeToken.deploy()
    await OMGLIkeToken.deployTransaction.wait()

    Factory__L2ERC20 = getContractFactory('L2StandardERC20', env.l2Wallet)

    L2ERC20 = await Factory__L2ERC20.deploy(
      L2StandardBridgeAddress,
      L1ERC20.address,
      tokenName,
      tokenSymbol,
      18
    )
    await L2ERC20.deployTransaction.wait()

    L2OMGLikeToken = await Factory__L2ERC20.deploy(
      L2StandardBridgeAddress,
      OMGLIkeToken.address,
      'OMG',
      'OMG',
      18
    )
    await L2OMGLikeToken.deployTransaction.wait()

    L2BOBAToken = new Contract(
      env.addressesBOBA.TOKENS.BOBA.L2,
      L2GovernanceERC20Json.abi,
      env.l2Wallet
    )

    BOBABillingContract = new Contract(
      env.addressesBOBA.Proxy__BobaBillingContract,
      L2BillingContractJson.abi,
      env.l2Wallet
    )
  })

  describe('Relay config priviledges', async () => {
    before(async () => {
      // deposit tokens to l2
      const depositL2ERC20Amount = utils.parseEther('10000')
      const approveL1ERC20TX = await L1ERC20.approve(
        L1StandardBridge.address,
        depositL2ERC20Amount
      )
      await approveL1ERC20TX.wait()

      await env.waitForXDomainTransaction(
        L1StandardBridge.depositERC20(
          L1ERC20.address,
          L2ERC20.address,
          depositL2ERC20Amount,
          9999999,
          ethers.utils.formatBytes32String(new Date().getTime().toString())
        )
      )
    })

    it('{tag:other} should not allow updating exit fee for non-owner', async () => {
      const nexExitFee = ethers.utils.parseEther('120')
      await expect(
        BOBABillingContract.connect(env.l2Wallet_2).updateExitFee(nexExitFee)
      ).to.be.revertedWith('Caller is not the owner')
    })

    it('{tag:other} should allow updating exit fee for owner', async () => {
      const exitFeeBefore = await BOBABillingContract.exitFee()
      const newExitFee = exitFeeBefore.mul(2)
      const configureTx = await BOBABillingContract.connect(
        env.l2Wallet
      ).updateExitFee(newExitFee)
      await configureTx.wait()

      const updatedExitFee = await BOBABillingContract.exitFee()
      expect(newExitFee).to.eq(updatedExitFee)
    })
  })

  describe('ERC20 withdraw', async () => {
    before(async () => {
      // deposit tokens to l2
      const depositL2ERC20Amount = utils.parseEther('10000')
      const approveL1ERC20TX = await L1ERC20.approve(
        L1StandardBridge.address,
        depositL2ERC20Amount
      )
      await approveL1ERC20TX.wait()

      await env.waitForXDomainTransaction(
        L1StandardBridge.depositERC20(
          L1ERC20.address,
          L2ERC20.address,
          depositL2ERC20Amount,
          9999999,
          ethers.utils.formatBytes32String(new Date().getTime().toString())
        )
      )
    })

    it('{tag:other} should pay exit fee and withdraw erc20', async () => {
      const preBalanceExitorL1 = await L1ERC20.balanceOf(env.l1Wallet.address)
      const preBalanceExitorL2 = await L2ERC20.balanceOf(env.l2Wallet.address)

      expect(preBalanceExitorL2).to.not.eq(0)
      const exitAmount = preBalanceExitorL2
      // approve
      const approveL2ERC20TX = await L2ERC20.approve(
        ExitFeeContract.address,
        exitAmount
      )
      await approveL2ERC20TX.wait()

      // Approve BOBA
      const exitFee = await BOBABillingContract.exitFee()
      const approveBOBATX = await L2BOBAToken.connect(env.l2Wallet).approve(
        ExitFeeContract.address,
        exitFee
      )
      await approveBOBATX.wait()

      const preBobaBalanceBillingContract = await L2BOBAToken.balanceOf(
        BOBABillingContract.address
      )
      const preBobaBalance = await L2BOBAToken.balanceOf(env.l2Wallet.address)

      await env.waitForXDomainTransaction(
        ExitFeeContract.payAndWithdraw(
          L2ERC20.address,
          exitAmount,
          9999999,
          ethers.utils.formatBytes32String(new Date().getTime().toString())
        )
      )

      const postBalanceExitorL1 = await L1ERC20.balanceOf(env.l1Wallet.address)
      const postBalanceExitorL2 = await L2ERC20.balanceOf(env.l2Wallet.address)
      const ExitFeeContractBalance = await L2ERC20.balanceOf(
        ExitFeeContract.address
      )
      const postBobaBalanceBillingContract = await L2BOBAToken.balanceOf(
        BOBABillingContract.address
      )
      const postBobaBalance = await L2BOBAToken.balanceOf(env.l2Wallet.address)

      expect(postBalanceExitorL2).to.eq(preBalanceExitorL2.sub(exitAmount))
      expect(postBalanceExitorL1).to.eq(preBalanceExitorL1.add(exitAmount))
      expect(ExitFeeContractBalance).to.eq(0)
      expect(postBobaBalanceBillingContract).to.eq(
        preBobaBalanceBillingContract.add(exitFee)
      )
      expect(postBobaBalance).to.eq(preBobaBalance.sub(exitFee))
    })

    it('{tag:other} should fail if not enough erc20 balance', async () => {
      const preBalanceExitorL2 = await L2ERC20.balanceOf(env.l2Wallet.address)

      expect(preBalanceExitorL2).to.eq(0)
      const exitAmount = utils.parseEther('10')

      // Approve BOBA
      const exitFee = await BOBABillingContract.exitFee()
      const approveBOBATX = await L2BOBAToken.connect(env.l2Wallet).approve(
        ExitFeeContract.address,
        exitFee
      )
      await approveBOBATX.wait()

      await expect(
        ExitFeeContract.payAndWithdraw(
          L2ERC20.address,
          exitAmount,
          9999999,
          ethers.utils.formatBytes32String(new Date().getTime().toString())
        )
      ).to.be.revertedWith('ERC20: transfer amount exceeds balance')
    })

    it('{tag:other} should fail if not enough Boba balance', async () => {
      const exitAmount = utils.parseEther('10')

      const newWallet = ethers.Wallet.createRandom().connect(env.l2Provider)
      await env.l2Wallet.sendTransaction({
        to: newWallet.address,
        value: ethers.utils.parseEther('1'),
      })

      await expect(
        ExitFeeContract.payAndWithdraw(
          L2ERC20.address,
          exitAmount,
          9999999,
          ethers.utils.formatBytes32String(new Date().getTime().toString())
        )
      ).to.be.revertedWith(
        'execution reverted: ERC20: transfer amount exceeds balance'
      )
    })

    it('{tag:other} should fail if not approving Boba', async () => {
      const exitAmount = utils.parseEther('10')

      // Approve BOBA
      const approveBOBATX = await L2BOBAToken.connect(env.l2Wallet).approve(
        ExitFeeContract.address,
        0
      )
      await approveBOBATX.wait()

      await expect(
        ExitFeeContract.payAndWithdraw(
          L2ERC20.address,
          exitAmount,
          9999999,
          ethers.utils.formatBytes32String(new Date().getTime().toString())
        )
      ).to.be.revertedWith(
        'execution reverted: ERC20: transfer amount exceeds allowance'
      )
    })
  })

  describe('Eth withdraw', async () => {
    before(async () => {
      // deposit eth to l2
      const addLiquidityAmount = utils.parseEther('100')

      const deposit = L1StandardBridge.depositETH(
        9999999,
        utils.formatBytes32String(new Date().getTime().toString()),
        { value: addLiquidityAmount }
      )
      await env.waitForXDomainTransaction(deposit)
    })

    it('{tag:other} should burn and withdraw ovm_eth', async () => {
      const preBalanceExitorL1 = await env.l1Wallet.getBalance()
      const preBalanceExitorL2 = await env.l2Wallet.getBalance()

      expect(preBalanceExitorL2).to.not.eq(0)
      const exitAmount = utils.parseEther('10')

      // Approve BOBA
      const exitFee = await BOBABillingContract.exitFee()
      const approveBOBATX = await L2BOBAToken.connect(env.l2Wallet).approve(
        ExitFeeContract.address,
        exitFee
      )
      await approveBOBATX.wait()

      const preBobaBalanceBillingContract = await L2BOBAToken.balanceOf(
        BOBABillingContract.address
      )
      const preBobaBalance = await L2BOBAToken.balanceOf(env.l2Wallet.address)

      await env.waitForXDomainTransaction(
        ExitFeeContract.payAndWithdraw(
          env.ovmEth.address,
          exitAmount,
          9999999,
          ethers.utils.formatBytes32String(new Date().getTime().toString()),
          { value: exitAmount }
        )
      )

      const postBalanceExitorL1 = await env.l1Wallet.getBalance()
      const postBalanceExitorL2 = await env.l2Wallet.getBalance()
      const ExitFeeContractBalance = await env.l2Provider.getBalance(
        ExitFeeContract.address
      )
      const postBobaBalanceBillingContract = await L2BOBAToken.balanceOf(
        BOBABillingContract.address
      )
      const postBobaBalance = await L2BOBAToken.balanceOf(env.l2Wallet.address)

      expect(postBalanceExitorL2).to.be.lt(preBalanceExitorL2.sub(exitAmount))
      expect(postBalanceExitorL1).to.eq(preBalanceExitorL1.add(exitAmount))
      expect(ExitFeeContractBalance).to.eq(0)
      expect(postBobaBalanceBillingContract).to.eq(
        preBobaBalanceBillingContract.add(exitFee)
      )
      expect(postBobaBalance).to.eq(preBobaBalance.sub(exitFee))
    })
  })

  describe('Configuration tests', async () => {
    it('{tag:other} should not allow to configure billing contract address for non-owner', async () => {
      await expect(
        ExitFeeContract.connect(env.l2Wallet_2).configureBillingContractAddress(
          env.addressesBOBA.Proxy__BobaBillingContract
        )
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('{tag:other} should not allow to configure billing contract address to zero address', async () => {
      await expect(
        ExitFeeContract.connect(env.l2Wallet).configureBillingContractAddress(
          ethers.constants.AddressZero
        )
      ).to.be.revertedWith('Billing contract address cannot be zero')
    })
  })
})
