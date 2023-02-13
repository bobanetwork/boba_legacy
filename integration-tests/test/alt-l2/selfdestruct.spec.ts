import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
const expect = chai.expect

import { BigNumber, Contract, ContractFactory, utils, Wallet } from 'ethers'
import { predeploys, getContractFactory } from '@eth-optimism/contracts'

import SelfDestructTestJson from '../../artifacts/contracts/TestSelfDestruct.sol/TestSelfDestruct.json'
import Create2DeployerJson from '../../artifacts/contracts/TestSelfDestruct.sol/Create2Deployer.json'
import SSTORETestJson from '../../artifacts/contracts/TestSelfDestruct.sol/TestDeleteSlot.json'

import { OptimismEnv } from './shared/env'

describe('Self Destruct Tests', async () => {
  let env: OptimismEnv

  let SelfDestructTest: Contract

  let Factory__Create2Deployer: ContractFactory
  let Create2Deployer: Contract

  let Boba_GasPriceOracle: Contract
  let secondaryFeeToken: Contract

  const supplyAmount = utils.parseEther('1')

  let balanceSelfDestructContractPre: BigNumber
  let balanceSelfDestructContractPost: BigNumber
  let balanceReceiverPre: BigNumber
  let balanceReceiverPost: BigNumber
  let secondaryFeeTokenBalancePre: BigNumber
  let secondaryFeeTokenBalancePost: BigNumber
  let SelfDestructTestAddress: string

  before(async () => {
    env = await OptimismEnv.new()

    Factory__Create2Deployer = new ContractFactory(
      Create2DeployerJson.abi,
      Create2DeployerJson.bytecode,
      env.l2Wallet
    )

    Create2Deployer = await Factory__Create2Deployer.deploy()
    await Create2Deployer.deployTransaction.wait()

    await Create2Deployer.deploy()
    SelfDestructTestAddress = await Create2Deployer.t()

    SelfDestructTest = new Contract(
      SelfDestructTestAddress,
      SelfDestructTestJson.abi,
      env.l2Wallet
    )

    Boba_GasPriceOracle = getContractFactory('Boba_GasPriceOracle')
      .attach(predeploys.Proxy__Boba_GasPriceOracle)
      .connect(env.l2Wallet)

    secondaryFeeToken = getContractFactory('L2_L1NativeToken')
      .attach(predeploys.L2_L1NativeToken)
      .connect(env.l2Wallet)
  })

  describe('When funds are added', async () => {
    before(async () => {
      // supply the contract with some funds
      await env.l2Wallet.sendTransaction({
        to: SelfDestructTest.address,
        value: supplyAmount,
      })
    })

    it('{tag:other} should send funds to the contract', async () => {
      balanceSelfDestructContractPre = await env.l2Provider.getBalance(
        SelfDestructTest.address
      )
      expect(balanceSelfDestructContractPre).to.be.eq(supplyAmount)
    })

    describe('When the contract is self destructed', async () => {
      before(async () => {
        balanceReceiverPre = await env.l2Provider.getBalance(
          env.l2Wallet_2.address
        )
        await SelfDestructTest.suicideMethod(env.l2Wallet_2.address)
      })

      it('{tag:other} should send all contract funds to receiver', async () => {
        balanceSelfDestructContractPost = await env.l2Provider.getBalance(
          SelfDestructTest.address
        )
        balanceReceiverPost = await env.l2Provider.getBalance(
          env.l2Wallet_2.address
        )

        expect(balanceSelfDestructContractPost).to.be.eq(0)
        expect(balanceReceiverPost).to.be.eq(
          balanceReceiverPre.add(supplyAmount)
        )
      })

      describe('When the contract is re-created on same address', async () => {
        before(async () => {
          await Create2Deployer.deploy()
        })

        it('{tag:other} should not have funds to send', async () => {
          const SelfDestructTestAddressReCreated = await Create2Deployer.t()
          expect(SelfDestructTestAddressReCreated).to.be.eq(
            SelfDestructTestAddress
          )
          const SelfDestructTestReCreated = new Contract(
            SelfDestructTestAddressReCreated,
            SelfDestructTestJson.abi,
            env.l2Wallet
          )

          expect(
            await env.l2Provider.getBalance(SelfDestructTestReCreated.address)
          ).to.be.eq(0)
          await SelfDestructTestReCreated.suicideMethod(env.l2Wallet_2.address)
          const balanceSelfDestructTestReCreated =
            await env.l2Provider.getBalance(SelfDestructTestReCreated.address)
          const balanceReceiverReCreatedPost = await env.l2Provider.getBalance(
            env.l2Wallet_2.address
          )

          expect(balanceSelfDestructTestReCreated).to.be.eq(0)
          expect(balanceReceiverReCreatedPost).to.be.eq(balanceReceiverPost)
        })
      })
    })
  })

  describe('Use secondary fee token as fee token', async () => {
    before(async () => {
      env = await OptimismEnv.new()

      Factory__Create2Deployer = new ContractFactory(
        Create2DeployerJson.abi,
        Create2DeployerJson.bytecode,
        env.l2Wallet
      )

      Create2Deployer = await Factory__Create2Deployer.deploy()
      await Create2Deployer.deployTransaction.wait()

      await Create2Deployer.deploy()
      SelfDestructTestAddress = await Create2Deployer.t()

      SelfDestructTest = new Contract(
        SelfDestructTestAddress,
        SelfDestructTestJson.abi,
        env.l2Wallet
      )

      await env.l2Wallet.sendTransaction({
        to: SelfDestructTest.address,
        value: supplyAmount,
      })
    })

    it('{tag:other} should send funds to the contract', async () => {
      balanceSelfDestructContractPre = await env.l2Provider.getBalance(
        SelfDestructTest.address
      )
      expect(balanceSelfDestructContractPre).to.be.eq(supplyAmount)
    })

    it('{tag:other} should use secondary fee token as fee token', async () => {
      await secondaryFeeToken.transfer(
        env.l2Wallet_2.address,
        utils.parseEther('10')
      )

      await Boba_GasPriceOracle.connect(
        env.l2Wallet_2
      ).useSecondaryFeeTokenAsFeeToken()

      const isSecondaryFeeTokenSelect =
        await Boba_GasPriceOracle.secondaryFeeTokenUsers(env.l2Wallet_2.address)
      expect(isSecondaryFeeTokenSelect).to.be.eq(true)
    })

    describe('When the contract is self destructed', async () => {
      before(async () => {
        balanceReceiverPre = await env.l2Provider.getBalance(
          env.l2Wallet_2.address
        )
        secondaryFeeTokenBalancePre = await secondaryFeeToken.balanceOf(
          env.l2Wallet_2.address
        )
        await SelfDestructTest.suicideMethod(env.l2Wallet_2.address)
      })

      it('{tag:other} should send all contract funds to receiver', async () => {
        balanceSelfDestructContractPost = await env.l2Provider.getBalance(
          SelfDestructTest.address
        )
        balanceReceiverPost = await env.l2Provider.getBalance(
          env.l2Wallet_2.address
        )
        secondaryFeeTokenBalancePost = await secondaryFeeToken.balanceOf(
          env.l2Wallet_2.address
        )
        expect(balanceSelfDestructContractPost).to.be.eq(0)
        expect(balanceReceiverPost).to.be.eq(
          balanceReceiverPre.add(supplyAmount)
        )
        expect(secondaryFeeTokenBalancePost).to.be.eq(
          secondaryFeeTokenBalancePre
        )
      })

      describe('When the contract is re-created on same address', async () => {
        before(async () => {
          await Create2Deployer.deploy()
        })

        it('{tag:other} should not have funds to send', async () => {
          const SelfDestructTestAddressReCreated = await Create2Deployer.t()
          expect(SelfDestructTestAddressReCreated).to.be.eq(
            SelfDestructTestAddress
          )
          const SelfDestructTestReCreated = new Contract(
            SelfDestructTestAddressReCreated,
            SelfDestructTestJson.abi,
            env.l2Wallet
          )

          expect(
            await env.l2Provider.getBalance(SelfDestructTestReCreated.address)
          ).to.be.eq(0)
          await SelfDestructTestReCreated.suicideMethod(env.l2Wallet_2.address)
          const balanceSelfDestructTestReCreated =
            await env.l2Provider.getBalance(SelfDestructTestReCreated.address)
          const balanceReceiverReCreatedPost = await env.l2Provider.getBalance(
            env.l2Wallet_2.address
          )
          const secondaryFeeTokenBalanceReCreatedPost =
            await secondaryFeeToken.balanceOf(env.l2Wallet_2.address)
          expect(balanceSelfDestructTestReCreated).to.be.eq(0)
          expect(balanceReceiverReCreatedPost).to.be.eq(balanceReceiverPost)
          expect(secondaryFeeTokenBalanceReCreatedPost).to.be.eq(
            secondaryFeeTokenBalancePost
          )
        })
      })
    })

    it('{tag:other} should use Boba as fee token', async () => {
      await Boba_GasPriceOracle.connect(env.l2Wallet_2).useBobaAsFeeToken()

      const isSecondaryFeeTokenSelect =
        await Boba_GasPriceOracle.secondaryFeeTokenUsers(env.l2Wallet_2.address)
      expect(isSecondaryFeeTokenSelect).to.be.eq(false)
    })
  })
})

describe('SSTORE tests', async () => {
  let env: OptimismEnv

  let SSTORETest: Contract
  let Factory__SSTORETest: ContractFactory

  let Boba_GasPriceOracle: Contract
  let secondaryFeeToken: Contract

  const supplyAmount = utils.parseEther('1')

  let balanceReceiverPre: BigNumber
  let balanceReceiverPost: BigNumber
  let secondaryFeeTokenBalancePre: BigNumber
  let secondaryFeeTokenBalancePost: BigNumber

  before(async () => {
    env = await OptimismEnv.new()

    Factory__SSTORETest = new ContractFactory(
      SSTORETestJson.abi,
      SSTORETestJson.bytecode,
      env.l2Wallet
    )

    SSTORETest = await Factory__SSTORETest.deploy()
    await SSTORETest.deployTransaction.wait()

    Boba_GasPriceOracle = getContractFactory('Boba_GasPriceOracle')
      .attach(predeploys.Proxy__Boba_GasPriceOracle)
      .connect(env.l2Wallet)

    secondaryFeeToken = getContractFactory('L2_L1NativeToken')
      .attach(predeploys.L2_L1NativeToken)
      .connect(env.l2Wallet)

    // Should set variables
    await SSTORETest.setInt(100)
    await SSTORETest.setArray([1, 2, 3, 4, 5])

    const storedInt = await SSTORETest.testInt()
    const storedArray = await SSTORETest.testArray(2)

    expect(storedInt).to.be.equal(BigNumber.from('100'))
    expect(storedArray).to.be.equal(BigNumber.from('3'))
  })

  it('{tag:other} should delete testInt slot storage', async () => {
    balanceReceiverPre = await env.l2Provider.getBalance(env.l2Wallet_2.address)
    secondaryFeeTokenBalancePre = await secondaryFeeToken.balanceOf(
      env.l2Wallet_2.address
    )

    await SSTORETest.connect(env.l2Wallet_2).deleteIntSlot()
    const testInt = await SSTORETest.testInt()

    balanceReceiverPost = await env.l2Provider.getBalance(
      env.l2Wallet_2.address
    )
    secondaryFeeTokenBalancePost = await secondaryFeeToken.balanceOf(
      env.l2Wallet_2.address
    )
    const blockNumber = await env.l2Provider.getBlockNumber()
    const block = await env.l2Provider.getBlock(blockNumber)
    const gasPrice = await env.l2Provider.getGasPrice()
    const gasFee = block.gasUsed.mul(gasPrice)

    expect(balanceReceiverPost).to.be.eq(balanceReceiverPre.sub(gasFee))
    expect(secondaryFeeTokenBalancePre).to.be.eq(secondaryFeeTokenBalancePost)
    expect(testInt).to.be.eq(BigNumber.from('0'))
  })

  it('{tag:other} should delete testArray slot storage', async () => {
    balanceReceiverPre = await env.l2Provider.getBalance(env.l2Wallet_2.address)
    secondaryFeeTokenBalancePre = await secondaryFeeToken.balanceOf(
      env.l2Wallet_2.address
    )

    await SSTORETest.connect(env.l2Wallet_2).deleteArraySlot(2)
    const storedArray = await SSTORETest.testArray(2)

    balanceReceiverPost = await env.l2Provider.getBalance(
      env.l2Wallet_2.address
    )
    secondaryFeeTokenBalancePost = await secondaryFeeToken.balanceOf(
      env.l2Wallet_2.address
    )
    const blockNumber = await env.l2Provider.getBlockNumber()
    const block = await env.l2Provider.getBlock(blockNumber)
    const gasPrice = await env.l2Provider.getGasPrice()
    const gasFee = block.gasUsed.mul(gasPrice)

    expect(balanceReceiverPost).to.be.eq(balanceReceiverPre.sub(gasFee))
    expect(secondaryFeeTokenBalancePre).to.be.eq(secondaryFeeTokenBalancePost)
    expect(storedArray).to.be.eq(BigNumber.from('0'))
  })

  describe('Use secondary fee token as fee token', async () => {
    before(async () => {
      env = await OptimismEnv.new()

      Factory__SSTORETest = new ContractFactory(
        SSTORETestJson.abi,
        SSTORETestJson.bytecode,
        env.l2Wallet
      )

      SSTORETest = await Factory__SSTORETest.deploy()
      await SSTORETest.deployTransaction.wait()

      Boba_GasPriceOracle = getContractFactory('Boba_GasPriceOracle')
        .attach(predeploys.Proxy__Boba_GasPriceOracle)
        .connect(env.l2Wallet)

      secondaryFeeToken = getContractFactory('L2_L1NativeToken')
        .attach(predeploys.L2_L1NativeToken)
        .connect(env.l2Wallet)

      // Should set variables
      await SSTORETest.setInt(100)
      await SSTORETest.setArray([1, 2, 3, 4, 5])

      const storedInt = await SSTORETest.testInt()
      const storedArray = await SSTORETest.testArray(2)

      expect(storedInt).to.be.equal(BigNumber.from('100'))
      expect(storedArray).to.be.equal(BigNumber.from('3'))
    })

    it('{tag:other} should use secondary fee token as fee token', async () => {
      await secondaryFeeToken.transfer(
        env.l2Wallet_2.address,
        utils.parseEther('10')
      )

      await Boba_GasPriceOracle.connect(
        env.l2Wallet_2
      ).useSecondaryFeeTokenAsFeeToken()

      const isSecondaryFeeTokenSelect =
        await Boba_GasPriceOracle.secondaryFeeTokenUsers(env.l2Wallet_2.address)
      expect(isSecondaryFeeTokenSelect).to.be.eq(true)
    })

    it('{tag:other} should delete testInt slot storage', async () => {
      balanceReceiverPre = await env.l2Provider.getBalance(
        env.l2Wallet_2.address
      )
      secondaryFeeTokenBalancePre = await secondaryFeeToken.balanceOf(
        env.l2Wallet_2.address
      )

      await SSTORETest.connect(env.l2Wallet_2).deleteIntSlot()
      const testInt = await SSTORETest.testInt()

      balanceReceiverPost = await env.l2Provider.getBalance(
        env.l2Wallet_2.address
      )
      secondaryFeeTokenBalancePost = await secondaryFeeToken.balanceOf(
        env.l2Wallet_2.address
      )
      const blockNumber = await env.l2Provider.getBlockNumber()
      const block = await env.l2Provider.getBlock(blockNumber)
      const gasPrice = await env.l2Provider.getGasPrice()
      const priceRatio = await Boba_GasPriceOracle.priceRatio()
      const priceRatioDecimals = await Boba_GasPriceOracle.decimals()
      const priceRatioDivisor = BigNumber.from(10).pow(priceRatioDecimals)
      const gasFee = block.gasUsed
        .mul(gasPrice)
        .mul(priceRatio)
        .div(priceRatioDivisor)

      expect(balanceReceiverPost).to.be.eq(balanceReceiverPre)
      expect(secondaryFeeTokenBalancePre).to.be.eq(
        secondaryFeeTokenBalancePost.add(gasFee)
      )
      expect(testInt).to.be.eq(BigNumber.from('0'))
    })

    it('{tag:other} should delete testArray slot storage', async () => {
      balanceReceiverPre = await env.l2Provider.getBalance(
        env.l2Wallet_2.address
      )
      secondaryFeeTokenBalancePre = await secondaryFeeToken.balanceOf(
        env.l2Wallet_2.address
      )

      await SSTORETest.connect(env.l2Wallet_2).deleteArraySlot(2)
      const storedArray = await SSTORETest.testArray(2)

      balanceReceiverPost = await env.l2Provider.getBalance(
        env.l2Wallet_2.address
      )
      secondaryFeeTokenBalancePost = await secondaryFeeToken.balanceOf(
        env.l2Wallet_2.address
      )
      const blockNumber = await env.l2Provider.getBlockNumber()
      const block = await env.l2Provider.getBlock(blockNumber)
      const gasPrice = await env.l2Provider.getGasPrice()
      const priceRatio = await Boba_GasPriceOracle.priceRatio()
      const priceRatioDecimals = await Boba_GasPriceOracle.decimals()
      const priceRatioDivisor = BigNumber.from(10).pow(priceRatioDecimals)
      const gasFee = block.gasUsed
        .mul(gasPrice)
        .mul(priceRatio)
        .div(priceRatioDivisor)

      expect(balanceReceiverPost).to.be.eq(balanceReceiverPre)
      expect(secondaryFeeTokenBalancePre).to.be.eq(
        secondaryFeeTokenBalancePost.add(gasFee)
      )
      expect(storedArray).to.be.eq(BigNumber.from('0'))
    })

    it('{tag:other} should use Boba as fee token', async () => {
      await Boba_GasPriceOracle.connect(env.l2Wallet_2).useBobaAsFeeToken()

      const isSecondaryFeeTokenSelect =
        await Boba_GasPriceOracle.secondaryFeeTokenUsers(env.l2Wallet_2.address)
      expect(isSecondaryFeeTokenSelect).to.be.eq(false)
    })
  })
})
