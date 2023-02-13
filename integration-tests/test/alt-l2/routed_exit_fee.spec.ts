import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
import { Contract, ContractFactory, BigNumber, utils, ethers } from 'ethers'
import { getContractFactory, predeploys } from '@eth-optimism/contracts'

import DiscretionaryExitFeeJson from '@boba/contracts/artifacts/contracts/DiscretionaryExitFee.sol/DiscretionaryExitFee.json'
import L1ERC20Json from '@boba/contracts/artifacts/contracts/test-helpers/L1ERC20.sol/L1ERC20.json'
import OMGLikeTokenJson from '@boba/contracts/artifacts/contracts/test-helpers/OMGLikeToken.sol/OMGLikeToken.json'
import L2BillingContractJson from '@boba/contracts/artifacts/contracts/L2BillingContract.sol/L2BillingContract.json'

import { OptimismEnv } from './shared/env'
import { approveERC20 } from './shared/utils'

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

  let L1BOBAToken: Contract
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

    L1BOBAToken = new Contract(
      env.addressesBOBA.TOKENS.BOBA.L1,
      L1ERC20Json.abi,
      env.l1Wallet
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

      const restoreExitFeeTx = await BOBABillingContract.connect(
        env.l2Wallet
      ).updateExitFee(exitFeeBefore)
      await restoreExitFeeTx.wait()

      const restoredExitFee = await BOBABillingContract.exitFee()
      expect(exitFeeBefore).to.eq(restoredExitFee)
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

      const exitFee = await BOBABillingContract.exitFee()
      const preBobaBalanceBillingContract = await env.l2Provider.getBalance(
        BOBABillingContract.address
      )
      const preBobaBalance = await env.l2Wallet.getBalance()

      await env.waitForXDomainTransaction(
        ExitFeeContract.payAndWithdraw(
          L2ERC20.address,
          exitAmount,
          9999999,
          ethers.utils.formatBytes32String(new Date().getTime().toString()),
          { value: exitFee }
        )
      )

      const latestBlock = await env.l2Provider.getBlock('latest')
      const gasPrice = await env.l2Provider.getGasPrice()
      const gasFee = latestBlock.gasUsed.mul(gasPrice)

      const postBalanceExitorL1 = await L1ERC20.balanceOf(env.l1Wallet.address)
      const postBalanceExitorL2 = await L2ERC20.balanceOf(env.l2Wallet.address)
      const ExitFeeContractBalance = await L2ERC20.balanceOf(
        ExitFeeContract.address
      )
      const postBobaBalanceBillingContract = await env.l2Provider.getBalance(
        BOBABillingContract.address
      )
      const postBobaBalance = await env.l2Wallet.getBalance()

      expect(postBalanceExitorL2).to.eq(preBalanceExitorL2.sub(exitAmount))
      expect(postBalanceExitorL1).to.eq(preBalanceExitorL1.add(exitAmount))
      expect(ExitFeeContractBalance).to.eq(0)
      expect(postBobaBalanceBillingContract).to.eq(
        preBobaBalanceBillingContract.add(exitFee)
      )
      expect(postBobaBalance).to.eq(preBobaBalance.sub(exitFee).sub(gasFee))
    })

    it('{tag:other} should fail if not enough Boba balance', async () => {
      const preBalanceExitorL2 = await L2ERC20.balanceOf(env.l2Wallet.address)

      expect(preBalanceExitorL2).to.eq(0)
      const exitAmount = utils.parseEther('10')

      const exitFee = await BOBABillingContract.exitFee()
      await expect(
        ExitFeeContract.payAndWithdraw(
          L2ERC20.address,
          exitAmount,
          9999999,
          ethers.utils.formatBytes32String(new Date().getTime().toString()),
          { value: exitFee.sub(BigNumber.from('1')) }
        )
      ).to.be.revertedWith('execution reverted: Insufficient Boba amount')
    })
  })

  describe('Boba withdraw', async () => {
    before(async () => {
      // deposit eth to l2
      const addLiquidityAmount = utils.parseEther('200')

      await approveERC20(
        L1BOBAToken,
        L1StandardBridge.address,
        addLiquidityAmount
      )
      await env.waitForXDomainTransaction(
        L1StandardBridge.depositERC20(
          L1BOBAToken.address,
          predeploys.L2_BOBA,
          addLiquidityAmount,
          9999999,
          utils.formatBytes32String(new Date().getTime().toString())
        )
      )
    })

    it('{tag:other} should burn and withdraw Boba', async () => {
      const preBalanceExitorL1 = await L1BOBAToken.balanceOf(
        env.l1Wallet.address
      )
      const preBalanceExitorL2 = await env.l2Wallet.getBalance()

      expect(preBalanceExitorL2).to.not.eq(0)
      const exitAmount = utils.parseEther('10')

      const exitFee = await BOBABillingContract.exitFee()

      const preBobaBalanceBillingContract = await env.l2Provider.getBalance(
        BOBABillingContract.address
      )
      const preBobaBalance = await env.l2Wallet.getBalance()

      await env.waitForXDomainTransaction(
        ExitFeeContract.payAndWithdraw(
          predeploys.L2_BOBA,
          exitAmount,
          9999999,
          ethers.utils.formatBytes32String(new Date().getTime().toString()),
          { value: exitFee.add(exitAmount) }
        )
      )

      const latestBlock = await env.l2Provider.getBlock('latest')
      const gasPrice = await env.l2Provider.getGasPrice()
      const gasFee = latestBlock.gasUsed.mul(gasPrice)

      const postBalanceExitorL1 = await L1BOBAToken.balanceOf(
        env.l1Wallet.address
      )
      const postBalanceExitorL2 = await env.l2Wallet.getBalance()
      const ExitFeeContractBalance = await env.l2Provider.getBalance(
        ExitFeeContract.address
      )
      const postBobaBalanceBillingContract = await env.l2Provider.getBalance(
        BOBABillingContract.address
      )
      const postBobaBalance = await env.l2Wallet.getBalance()

      expect(postBalanceExitorL2).to.be.lt(preBalanceExitorL2.sub(exitAmount))
      expect(postBalanceExitorL1).to.eq(preBalanceExitorL1.add(exitAmount))
      expect(ExitFeeContractBalance).to.eq(0)
      expect(postBobaBalanceBillingContract).to.eq(
        preBobaBalanceBillingContract.add(exitFee)
      )
      expect(postBobaBalance).to.eq(
        preBobaBalance.sub(exitFee.add(gasFee).add(exitAmount))
      )
    })

    it('{tag:other} should fail if not enough Boba balance', async () => {
      const exitAmount = utils.parseEther('10')

      const exitFee = await BOBABillingContract.exitFee()
      await expect(
        ExitFeeContract.payAndWithdraw(
          predeploys.L2_BOBA,
          exitAmount,
          9999999,
          ethers.utils.formatBytes32String(new Date().getTime().toString()),
          { value: exitFee.sub(BigNumber.from('1')) }
        )
      ).to.be.revertedWith('execution reverted: Insufficient Boba amount')

      await expect(
        ExitFeeContract.payAndWithdraw(
          predeploys.L2_BOBA,
          exitAmount,
          9999999,
          ethers.utils.formatBytes32String(new Date().getTime().toString()),
          { value: exitFee }
        )
      ).to.be.revertedWith(
        'execution reverted: Either Amount Incorrect or Token Address Incorrect'
      )
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
