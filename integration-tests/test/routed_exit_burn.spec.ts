import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
import { Contract, ContractFactory, BigNumber, utils, ethers } from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'

import DiscretionaryExitBurnJson from '@boba/contracts/artifacts/contracts/DiscretionaryExitBurn.sol/DiscretionaryExitBurn.json'
import L1ERC20Json from '@boba/contracts/artifacts/contracts/test-helpers/L1ERC20.sol/L1ERC20.json'
import OMGLikeTokenJson from '@boba/contracts/artifacts/contracts/test-helpers/OMGLikeToken.sol/OMGLikeToken.json'

import { OptimismEnv } from './shared/env'

describe('Standard Exit burn', async () => {
  let Factory__L1ERC20: ContractFactory
  let Factory__L2ERC20: ContractFactory
  let Factory__ExitBurn: ContractFactory

  let L1ERC20: Contract
  let L2ERC20: Contract
  let L1StandardBridge: Contract
  let ExitBurn: Contract

  let OMGLIkeToken: Contract
  let L2OMGLikeToken: Contract

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

    Factory__ExitBurn = new ContractFactory(
      DiscretionaryExitBurnJson.abi,
      DiscretionaryExitBurnJson.bytecode,
      env.l2Wallet
    )

    ExitBurn = await Factory__ExitBurn.deploy(L2StandardBridgeAddress)

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

    it('{tag:other} should not allow updating extraGasRelay for non-owner', async () => {
      const newExtraGasRelay = 500000
      await expect(
        ExitBurn.connect(env.l2Wallet_2).configureExtraGasRelay(
          newExtraGasRelay
        )
      ).to.be.revertedWith('caller is not the gasPriceOracle owner')
    })

    it('{tag:other} should allow updating extraGasRelay for owner', async () => {
      // approximate and set new extra gas to over it for tests
      const approveBobL2TX = await L2ERC20.approve(
        ExitBurn.address,
        utils.parseEther('10')
      )
      await approveBobL2TX.wait()

      const estimatedGas = await ExitBurn.estimateGas.burnAndWithdraw(
        L2ERC20.address,
        utils.parseEther('10'),
        9999999,
        ethers.utils.formatBytes32String(new Date().getTime().toString())
      )

      const newExtraGasRelay = estimatedGas.mul(2)
      const configureTx = await ExitBurn.connect(
        env.l2Wallet_4
      ).configureExtraGasRelay(newExtraGasRelay)
      await configureTx.wait()

      const updatedExtraGasRelay = await ExitBurn.extraGasRelay()
      expect(updatedExtraGasRelay).to.eq(newExtraGasRelay)
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

    it('{tag:other} should burn and withdraw erc20', async () => {
      const preBalanceExitorL1 = await L1ERC20.balanceOf(env.l1Wallet.address)
      const preBalanceExitorL2 = await L2ERC20.balanceOf(env.l2Wallet.address)

      expect(preBalanceExitorL2).to.not.eq(0)
      const exitAmount = preBalanceExitorL2
      // approve
      const approveL2ERC20TX = await L2ERC20.approve(
        ExitBurn.address,
        exitAmount
      )
      await approveL2ERC20TX.wait()

      await env.waitForXDomainTransaction(
        ExitBurn.burnAndWithdraw(
          L2ERC20.address,
          exitAmount,
          9999999,
          ethers.utils.formatBytes32String(new Date().getTime().toString())
        )
      )

      const postBalanceExitorL1 = await L1ERC20.balanceOf(env.l1Wallet.address)
      const postBalanceExitorL2 = await L2ERC20.balanceOf(env.l2Wallet.address)
      const ExitBurnContractBalance = await L2ERC20.balanceOf(ExitBurn.address)

      expect(postBalanceExitorL2).to.eq(preBalanceExitorL2.sub(exitAmount))
      expect(postBalanceExitorL1).to.eq(preBalanceExitorL1.add(exitAmount))
      expect(ExitBurnContractBalance).to.eq(0)
    })

    it('{tag:other} should fail if not enough erc20 balance', async () => {
      const preBalanceExitorL2 = await L2ERC20.balanceOf(env.l2Wallet.address)

      expect(preBalanceExitorL2).to.eq(0)
      const exitAmount = utils.parseEther('10')

      await expect(
        ExitBurn.burnAndWithdraw(
          L2ERC20.address,
          exitAmount,
          9999999,
          ethers.utils.formatBytes32String(new Date().getTime().toString())
        )
      ).to.be.revertedWith('ERC20: transfer amount exceeds balance')
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

      await env.waitForXDomainTransaction(
        ExitBurn.burnAndWithdraw(
          env.ovmEth.address,
          exitAmount,
          9999999,
          ethers.utils.formatBytes32String(new Date().getTime().toString()),
          { value: exitAmount }
        )
      )

      const postBalanceExitorL1 = await env.l1Wallet.getBalance()
      const postBalanceExitorL2 = await env.l2Wallet.getBalance()
      const ExitBurnContractBalance = await env.l2Provider.getBalance(
        ExitBurn.address
      )

      expect(postBalanceExitorL2).to.be.lt(preBalanceExitorL2.sub(exitAmount))
      const expectedGas = preBalanceExitorL2
        .sub(exitAmount)
        .sub(postBalanceExitorL2)

      // gas oracle updates the overhead and l1BaseFee,
      // so it's not correct to expect the expectedGast is small than 1000000000
      // expect(expectedGas).to.lt(BigNumber.from(1000000000))
      expect(postBalanceExitorL1).to.eq(preBalanceExitorL1.add(exitAmount))
      expect(ExitBurnContractBalance).to.eq(0)
    })
  })
})
