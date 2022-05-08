import { expect } from './setup'

/* External Imports */
import { ethers } from 'hardhat'
import { ContractFactory, Contract, Signer, BigNumber, Wallet } from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'
import { GasPriceOracleService } from '../dist/service'
import fs, { promises as fsPromise } from 'fs'
import path from 'path'
import {
  AppendSequencerBatchParams,
  encodeAppendSequencerBatch,
} from '@eth-optimism/core-utils'
import { TransactionResponse } from '@ethersproject/abstract-provider'
import { keccak256 } from 'ethers/lib/utils'

describe('gas-price-oracle', () => {
  let signer1: Signer
  let signer2: Signer
  let signer3: Signer
  // sequencerAddress
  let wallet1: Wallet
  let address1: string
  // proposerAddress
  let wallet2: Wallet
  let address2: string
  // relayerAddress
  let wallet3: Wallet
  let address3: string
  // fastRelayerAddress
  let wallet4: Wallet
  let address4: string
  // OVM_SequencerFeeVault
  let wallet5: Wallet
  let address5: string
  // BOBA_GasPriceOracle
  let wallet6: Wallet
  let address6: string
  // BOBA_billingContract
  let wallet7: Wallet
  let address7: string

  // deployer
  let wallet8: Wallet

  let gasPriceOracleService: any
  let tempGasPriceOracleService: any

  before(async () => {
    ;[signer1, signer2] = await ethers.getSigners()
    wallet1 = ethers.Wallet.createRandom().connect(ethers.provider)
    address1 = wallet1.address
    wallet2 = ethers.Wallet.createRandom().connect(ethers.provider)
    address2 = wallet2.address
    wallet3 = ethers.Wallet.createRandom().connect(ethers.provider)
    address3 = wallet3.address
    wallet4 = ethers.Wallet.createRandom().connect(ethers.provider)
    address4 = wallet4.address
    wallet5 = ethers.Wallet.createRandom().connect(ethers.provider)
    address5 = wallet5.address
    wallet6 = ethers.Wallet.createRandom().connect(ethers.provider)
    address6 = wallet6.address
    wallet7 = ethers.Wallet.createRandom().connect(ethers.provider)
    address7 = wallet7.address
    wallet8 = ethers.Wallet.createRandom().connect(ethers.provider)
    await signer1.sendTransaction({
      to: wallet8.address,
      value: ethers.utils.parseEther('20'),
    })
  })

  let Factory__GasPriceOracle: ContractFactory
  let gasPriceOracle: Contract

  let Factory__Lib_AddressManager: ContractFactory
  let Lib_AddressManager: Contract

  let Factory__StateCommitmentChain: ContractFactory
  let StateCommitmentChain: Contract

  let Factory__CanonicalTransactionChain: ContractFactory
  let CanonicalTransactionChain: Contract

  let Factory__L2BOBA: ContractFactory
  let L2BOBA: Contract

  let Factory__ChainStorageContainer: ContractFactory
  let batches: Contract
  let queue: Contract

  before(async () => {
    Factory__Lib_AddressManager = getContractFactory(
      'Lib_AddressManager',
      signer1
    )
    Lib_AddressManager = await Factory__Lib_AddressManager.deploy()
    await Lib_AddressManager.deployTransaction.wait()

    Factory__GasPriceOracle = getContractFactory('OVM_GasPriceOracle', wallet8)
    gasPriceOracle = await Factory__GasPriceOracle.deploy(wallet8.address)
    await gasPriceOracle.deployTransaction.wait()

    await Lib_AddressManager.setAddress(
      'OVM_GasPriceOracle',
      gasPriceOracle.address
    )

    Factory__StateCommitmentChain = getContractFactory(
      'StateCommitmentChain',
      signer1
    )
    StateCommitmentChain = await Factory__StateCommitmentChain.deploy(
      Lib_AddressManager.address,
      0,
      0
    )
    await StateCommitmentChain.deployTransaction.wait()

    await Lib_AddressManager.setAddress(
      'StateCommitmentChain',
      StateCommitmentChain.address
    )

    Factory__CanonicalTransactionChain = getContractFactory(
      'CanonicalTransactionChain',
      wallet8
    )
    CanonicalTransactionChain = await Factory__CanonicalTransactionChain.deploy(
      Lib_AddressManager.address,
      8_000_000,
      32,
      60_000
    )
    await CanonicalTransactionChain.deployTransaction.wait()

    await Lib_AddressManager.setAddress(
      'CanonicalTransactionChain',
      CanonicalTransactionChain.address
    )

    Factory__L2BOBA = getContractFactory('BOBA', signer1)
    L2BOBA = await Factory__L2BOBA.deploy()
    await L2BOBA.deployTransaction.wait()

    await Lib_AddressManager.setAddress('TK_L2BOBA', L2BOBA.address)

    await Lib_AddressManager.setAddress('Proxy__Boba_GasPriceOracle', address6)

    await Lib_AddressManager.setAddress('Proxy__BobaBillingContract', address7)
  })

  it('should create GasPriceOracleService', async () => {
    // Remove file if it exists
    const l2DumpsPath = path.resolve(__dirname, '../data/l2History.json')
    if (fs.existsSync(l2DumpsPath)) {
      fs.unlinkSync(l2DumpsPath)
    }
    const l1DumpsPath = path.resolve(__dirname, '../data/l1History.json')
    if (fs.existsSync(l1DumpsPath)) {
      fs.unlinkSync(l1DumpsPath)
    }
    // Initialize GasPriceOracleService
    gasPriceOracleService = new GasPriceOracleService({
      l1RpcProvider: ethers.provider,
      l2RpcProvider: ethers.provider,

      addressManagerAddress: Lib_AddressManager.address,
      gasPriceOracleAddress: gasPriceOracle.address,

      OVM_SequencerFeeVault: address5,

      gasPriceOracleOwnerWallet: wallet8,

      sequencerAddress: address1,
      proposerAddress: address2,
      relayerAddress: address3,
      fastRelayerAddress: address4,

      pollingInterval: 0,
      overheadRatio1000X: 10,
      overheadMinPercentChange: 10,
      minOverhead: 2000,
      minL1BaseFee: 0,
      maxL1BaseFee: 1,
      bobaFeeRatio100X: 800,
      bobaFeeRatioMinPercentChange: 3000,
      bobaLocalTestnetChainId: 31338,
    })

    await gasPriceOracleService.init()
  })

  it('should set history values to 0', async () => {
    expect(gasPriceOracleService.state.L1ETHBalance).to.be.eq(
      BigNumber.from('0')
    )
    expect(gasPriceOracleService.state.L1ETHCostFee).to.be.eq(
      BigNumber.from('0')
    )
    expect(gasPriceOracleService.state.L1RelayerBalance).to.be.eq(
      BigNumber.from('0')
    )
    expect(gasPriceOracleService.state.L1RelayerCostFee).to.be.eq(
      BigNumber.from('0')
    )
    expect(gasPriceOracleService.state.L2ETHCollectFee).to.be.eq(
      BigNumber.from('0')
    )
    expect(gasPriceOracleService.state.L2BOBACollectFee).to.be.eq(
      BigNumber.from('0')
    )
    expect(gasPriceOracleService.state.L2BOBABillingCollectFee).to.be.eq(
      BigNumber.from('0')
    )
  })

  it('should write history values', async () => {
    // Write two files
    await gasPriceOracleService._writeL1ETHFee()
    await gasPriceOracleService._writeL2FeeCollect()

    // Verify them
    const l2DumpsPath = path.resolve(__dirname, '../data/l2History.json')
    expect(fs.existsSync(l2DumpsPath)).to.be.true

    const l2HistoryJsonRaw = await fsPromise.readFile(l2DumpsPath)
    const l2HistoryJSON = JSON.parse(l2HistoryJsonRaw.toString())

    expect(l2HistoryJSON.L2BOBACollectFee).to.be.eq('0')
    expect(l2HistoryJSON.L2ETHCollectFee).to.be.eq('0')
    expect(l2HistoryJSON.L2BOBABillingCollectFee).to.be.eq('0')

    const l1DumpsPath = path.resolve(__dirname, '../data/l1History.json')
    expect(fs.existsSync(l1DumpsPath)).to.be.true

    const l1HistoryJsonRaw = await fsPromise.readFile(l1DumpsPath)
    const l1HistoryJSON = JSON.parse(l1HistoryJsonRaw.toString())

    expect(l1HistoryJSON.L1ETHBalance).to.be.eq('0')
    expect(l1HistoryJSON.L1ETHCostFee).to.be.eq('0')
    expect(l1HistoryJSON.L1RelayerBalance).to.be.eq('0')
    expect(l1HistoryJSON.L1RelayerCostFee).to.be.eq('0')
  })

  it('should update and store history values', async () => {
    gasPriceOracleService.state.L1ETHBalance = BigNumber.from('1')
    gasPriceOracleService.state.L1ETHCostFee = BigNumber.from('2')
    gasPriceOracleService.state.L1RelayerBalance = BigNumber.from('3')
    gasPriceOracleService.state.L1RelayerCostFee = BigNumber.from('4')
    gasPriceOracleService.state.L2BOBACollectFee = BigNumber.from('5')
    gasPriceOracleService.state.L2ETHCollectFee = BigNumber.from('6')
    gasPriceOracleService.state.L2BOBABillingCollectFee = BigNumber.from('7')

    // Write two files
    await gasPriceOracleService._writeL1ETHFee()
    await gasPriceOracleService._writeL2FeeCollect()

    // Verify them
    const l2DumpsPath = path.resolve(__dirname, '../data/l2History.json')
    expect(fs.existsSync(l2DumpsPath)).to.be.true

    const l2HistoryJsonRaw = await fsPromise.readFile(l2DumpsPath)
    const l2HistoryJSON = JSON.parse(l2HistoryJsonRaw.toString())

    expect(l2HistoryJSON.L2BOBACollectFee).to.be.eq('5')
    expect(l2HistoryJSON.L2ETHCollectFee).to.be.eq('6')
    expect(l2HistoryJSON.L2BOBABillingCollectFee).to.be.eq('7')

    const l1DumpsPath = path.resolve(__dirname, '../data/l1History.json')
    expect(fs.existsSync(l1DumpsPath)).to.be.true

    const l1HistoryJsonRaw = await fsPromise.readFile(l1DumpsPath)
    const l1HistoryJSON = JSON.parse(l1HistoryJsonRaw.toString())

    expect(l1HistoryJSON.L1ETHBalance).to.be.eq('1')
    expect(l1HistoryJSON.L1ETHCostFee).to.be.eq('2')
    expect(l1HistoryJSON.L1RelayerBalance).to.be.eq('3')
    expect(l1HistoryJSON.L1RelayerCostFee).to.be.eq('4')

    // Reset history values
    gasPriceOracleService.state.L1ETHBalance = BigNumber.from('0')
    gasPriceOracleService.state.L1ETHCostFee = BigNumber.from('0')
    gasPriceOracleService.state.L1RelayerBalance = BigNumber.from('0')
    gasPriceOracleService.state.L1RelayerCostFee = BigNumber.from('0')
    gasPriceOracleService.state.L2BOBACollectFee = BigNumber.from('0')
    gasPriceOracleService.state.L2ETHCollectFee = BigNumber.from('0')
    gasPriceOracleService.state.L2BOBABillingCollectFee = BigNumber.from('0')

    // Write two files
    await gasPriceOracleService._writeL1ETHFee()
    await gasPriceOracleService._writeL2FeeCollect()
  })

  it('should get l1 balance correctly', async () => {
    await signer1.sendTransaction({
      to: address1,
      value: ethers.utils.parseEther('1'),
    })
    await signer1.sendTransaction({
      to: address2,
      value: ethers.utils.parseEther('1'),
    })
    await signer1.sendTransaction({
      to: address3,
      value: ethers.utils.parseEther('1'),
    })
    await signer1.sendTransaction({
      to: address4,
      value: ethers.utils.parseEther('1'),
    })
    await gasPriceOracleService._getL1Balance()

    expect(gasPriceOracleService.state.L1ETHBalance).to.be.eq(
      ethers.utils.parseEther('4')
    )
    expect(gasPriceOracleService.state.L1ETHCostFee).to.be.eq(
      BigNumber.from('0')
    )
    console.log(await signer1.provider.getBalance(address1))
  })

  it('should record l1 cost correctly', async () => {
    // send some funds back
    const signer1Address = await signer1.getAddress()
    await wallet1.sendTransaction({
      to: signer1Address,
      value: ethers.utils.parseEther('0.5'),
    })
    await wallet2.sendTransaction({
      to: signer1Address,
      value: ethers.utils.parseEther('0.5'),
    })
    await wallet3.sendTransaction({
      to: signer1Address,
      value: ethers.utils.parseEther('0.5'),
    })
    await wallet4.sendTransaction({
      to: signer1Address,
      value: ethers.utils.parseEther('0.5'),
    })

    const sequencerBalance = await wallet1.getBalance()
    const proposerBalance = await wallet2.getBalance()
    const relayerBalance = await wallet3.getBalance()
    const fastRelayerBalance = await wallet4.getBalance()

    await gasPriceOracleService._getL1Balance()

    const costFee = ethers.utils
      .parseEther('4')
      .sub(
        sequencerBalance
          .add(proposerBalance)
          .add(relayerBalance)
          .add(fastRelayerBalance)
      )
    const relayerCostFee = ethers.utils
      .parseEther('2')
      .sub(relayerBalance.add(fastRelayerBalance))
    expect(costFee).to.be.equal(gasPriceOracleService.state.L1ETHCostFee)
    expect(gasPriceOracleService.state.L1ETHBalance).to.be.equal(
      sequencerBalance
        .add(proposerBalance)
        .add(relayerBalance)
        .add(fastRelayerBalance)
    )
    expect(gasPriceOracleService.state.L1RelayerBalance).to.be.equal(
      relayerBalance.add(fastRelayerBalance)
    )
    expect(gasPriceOracleService.state.L1RelayerCostFee).to.be.equal(
      relayerCostFee
    )
  })

  it('should record l1 cost correctly after adding more funds to l1 wallets', async () => {
    const preL1ETHCostFee = gasPriceOracleService.state.L1ETHCostFee
    const preL1RelayerCostFee = gasPriceOracleService.state.L1RelayerCostFee

    await signer1.sendTransaction({
      to: address1,
      value: ethers.utils.parseEther('1'),
    })
    await signer1.sendTransaction({
      to: address2,
      value: ethers.utils.parseEther('1'),
    })
    await signer1.sendTransaction({
      to: address3,
      value: ethers.utils.parseEther('1'),
    })
    await signer1.sendTransaction({
      to: address4,
      value: ethers.utils.parseEther('1'),
    })

    const postSequencerBalance = await wallet1.getBalance()
    const postProposerBalance = await wallet2.getBalance()
    const postRelayerBalance = await wallet3.getBalance()
    const postFastRelayerBalance = await wallet4.getBalance()

    // Update L1ETHBalance and keep L1ETHCostFee
    // Update L1RelayerBalance and keep L1RelayerCostFee
    await gasPriceOracleService._getL1Balance()
    expect(gasPriceOracleService.state.L1ETHBalance).to.be.equal(
      postSequencerBalance
        .add(postProposerBalance)
        .add(postRelayerBalance)
        .add(postFastRelayerBalance)
    )
    expect(preL1ETHCostFee).to.be.eq(gasPriceOracleService.state.L1ETHCostFee)

    expect(gasPriceOracleService.state.L1RelayerBalance).to.be.equal(
      postRelayerBalance.add(postFastRelayerBalance)
    )
    expect(preL1RelayerCostFee).to.be.eq(
      gasPriceOracleService.state.L1RelayerCostFee
    )
  })

  it('should get l2 revenue correctly', async () => {
    await signer1.sendTransaction({
      to: address5,
      value: ethers.utils.parseEther('1'),
    })
    await signer1.sendTransaction({
      to: address6,
      value: ethers.utils.parseEther('1'),
    })
    await signer1.sendTransaction({
      to: address7,
      value: ethers.utils.parseEther('1'),
    })
    await L2BOBA.transfer(address6, ethers.utils.parseEther('1'))
    await L2BOBA.transfer(address7, ethers.utils.parseEther('1'))

    await gasPriceOracleService._getL2GasCost()

    expect(gasPriceOracleService.state.L2ETHCollectFee).to.be.eq(
      ethers.utils.parseEther('1')
    )
    expect(gasPriceOracleService.state.L2ETHVaultBalance).to.be.eq(
      ethers.utils.parseEther('1')
    )
    expect(gasPriceOracleService.state.L2BOBACollectFee).to.be.eq(
      ethers.utils.parseEther('1')
    )
    expect(gasPriceOracleService.state.L2BOBAVaultBalance).to.be.eq(
      ethers.utils.parseEther('1')
    )
    expect(gasPriceOracleService.state.L2BOBABillingBalance).to.be.eq(
      ethers.utils.parseEther('1')
    )
    expect(gasPriceOracleService.state.L2BOBABillingCollectFee).to.be.eq(
      ethers.utils.parseEther('1')
    )
  })

  it('should record l2 revenue correctly after withdrawing fees', async () => {
    const preL2ETHCollectFee = gasPriceOracleService.state.L2ETHCollectFee
    const preL2BOBACollectFee = gasPriceOracleService.state.L2BOBACollectFee
    const preL2BOBABillingCollectFee =
      gasPriceOracleService.state.L2BOBABillingCollectFee

    // send some funds back
    const signer1Address = await signer1.getAddress()
    await wallet5.sendTransaction({
      to: signer1Address,
      value: ethers.utils.parseEther('0.5'),
    })
    await L2BOBA.connect(wallet6).transfer(
      signer1Address,
      ethers.utils.parseEther('0.5')
    )
    await L2BOBA.connect(wallet7).transfer(
      signer1Address,
      ethers.utils.parseEther('0.5')
    )

    const ETHVaultBalance = await wallet5.getBalance()
    const BobaVaultBalance = await L2BOBA.balanceOf(address6)
    const BobaBillingBalance = await L2BOBA.balanceOf(address7)

    await gasPriceOracleService._getL2GasCost()

    expect(gasPriceOracleService.state.L2ETHCollectFee).to.be.equal(
      preL2ETHCollectFee
    )
    expect(gasPriceOracleService.state.L2BOBACollectFee).to.be.equal(
      preL2BOBACollectFee
    )
    expect(gasPriceOracleService.state.L2BOBABillingCollectFee).to.be.equal(
      preL2BOBABillingCollectFee
    )
    expect(gasPriceOracleService.state.L2ETHVaultBalance).to.be.equal(
      ETHVaultBalance
    )
    expect(gasPriceOracleService.state.L2BOBAVaultBalance).to.be.equal(
      BobaVaultBalance
    )
    expect(gasPriceOracleService.state.L2BOBABillingBalance).to.be.equal(
      BobaBillingBalance
    )
  })

  it('should update l1 base fee', async () => {
    // Initialize GasPriceOracleService
    tempGasPriceOracleService = new GasPriceOracleService({
      l1RpcProvider: ethers.provider,
      l2RpcProvider: ethers.provider,

      addressManagerAddress: Lib_AddressManager.address,
      gasPriceOracleAddress: gasPriceOracle.address,

      OVM_SequencerFeeVault: address5,

      gasPriceOracleOwnerWallet: wallet8,

      sequencerAddress: address1,
      proposerAddress: address2,
      relayerAddress: address3,
      fastRelayerAddress: address4,

      pollingInterval: 0,
      overheadRatio1000X: 10,
      overheadMinPercentChange: 10,
      minOverhead: 2000,
      minL1BaseFee: 1_000_000_000,
      maxL1BaseFee: 2_000_000_000,
      bobaFeeRatio100X: 800,
      bobaFeeRatioMinPercentChange: 3000,
      bobaLocalTestnetChainId: 31337,
    })

    await tempGasPriceOracleService.init()

    await gasPriceOracle.connect(wallet8).setL1BaseFee(0)
    console.log('SET L1 BASE FEE TO 0')
    await tempGasPriceOracleService._upateL1BaseFee()

    const postL1BaseFee = await gasPriceOracle.l1BaseFee()
    expect(postL1BaseFee).to.not.be.equal(BigNumber.from('0'))

    await gasPriceOracle.connect(wallet8).setL1BaseFee(0)
  })

  it('should not update l1 base fee if the gas price is higher than maxL1BaseFee', async () => {
    const preL1BaseFee = await gasPriceOracle.l1BaseFee()
    expect(preL1BaseFee).to.be.equal(ethers.utils.parseEther('0'))

    await gasPriceOracleService._upateL1BaseFee()

    const postL1BaseFee = await gasPriceOracle.l1BaseFee()
    expect(postL1BaseFee).to.be.equal(ethers.utils.parseEther('0'))
  })

  it('should not update l1 base fee if the gas price is smaller than minL1BaseFee', async () => {
    // Initialize GasPriceOracleService
    tempGasPriceOracleService = new GasPriceOracleService({
      l1RpcProvider: ethers.provider,
      l2RpcProvider: ethers.provider,

      addressManagerAddress: Lib_AddressManager.address,
      gasPriceOracleAddress: gasPriceOracle.address,

      OVM_SequencerFeeVault: address5,

      gasPriceOracleOwnerWallet: wallet8,

      sequencerAddress: address1,
      proposerAddress: address2,
      relayerAddress: address3,
      fastRelayerAddress: address4,

      pollingInterval: 0,
      overheadRatio1000X: 10,
      overheadMinPercentChange: 10,
      minOverhead: 2000,
      minL1BaseFee: 50_000_000_000,
      maxL1BaseFee: 100_000_000_000,
      bobaFeeRatio100X: 800,
      bobaFeeRatioMinPercentChange: 3000,
      bobaLocalTestnetChainId: 31337,
    })

    await tempGasPriceOracleService.init()

    const preL1BaseFee = await gasPriceOracle.l1BaseFee()
    expect(preL1BaseFee).to.be.equal(ethers.utils.parseEther('0'))

    await tempGasPriceOracleService._upateL1BaseFee()

    const postL1BaseFee = await gasPriceOracle.l1BaseFee()
    expect(postL1BaseFee).to.be.equal(ethers.utils.parseEther('0'))
  })

  it('should update price ratio', async () => {
    const Factory__Boba_GasPriceOracle = getContractFactory(
      'Boba_GasPriceOracle',
      wallet8
    )
    const Boba_GasPriceOracle = await Factory__Boba_GasPriceOracle.deploy()
    await Boba_GasPriceOracle.deployTransaction.wait()

    await Boba_GasPriceOracle.initialize(address1, address2)

    const registerBoba_GasPriceOralceTx = await Lib_AddressManager.setAddress(
      'Proxy__Boba_GasPriceOracle',
      Boba_GasPriceOracle.address
    )
    await registerBoba_GasPriceOralceTx.wait()

    // Initialize GasPriceOracleService
    tempGasPriceOracleService = new GasPriceOracleService({
      l1RpcProvider: ethers.provider,
      l2RpcProvider: ethers.provider,

      addressManagerAddress: Lib_AddressManager.address,
      gasPriceOracleAddress: gasPriceOracle.address,

      OVM_SequencerFeeVault: address5,

      gasPriceOracleOwnerWallet: wallet8,

      sequencerAddress: address1,
      proposerAddress: address2,
      relayerAddress: address3,
      fastRelayerAddress: address4,

      pollingInterval: 0,
      overheadRatio1000X: 10,
      overheadMinPercentChange: 10,
      minOverhead: 2000,
      minL1BaseFee: 50_000_000_000,
      maxL1BaseFee: 100_000_000_000,
      bobaFeeRatio100X: 100,
      bobaFeeRatioMinPercentChange: 10,
      bobaLocalTestnetChainId: 31337,
    })

    await tempGasPriceOracleService.init()

    tempGasPriceOracleService.state.ETHUSDPrice = 10
    tempGasPriceOracleService.state.BOBAUSDPrice = 1

    const prePriceRatio = await Boba_GasPriceOracle.priceRatio()

    await tempGasPriceOracleService._updatePriceRatio()

    const postPriceRatio = await Boba_GasPriceOracle.priceRatio()
    expect(postPriceRatio).to.be.equal(prePriceRatio)

    tempGasPriceOracleService.state.ETHUSDPrice = 2500
    tempGasPriceOracleService.state.BOBAUSDPrice = 1

    console.log({
      ETHUSDPrice: tempGasPriceOracleService.state.ETHUSDPrice,
      BOBAUSDPrice: tempGasPriceOracleService.state.BOBAUSDPrice,
    })

    await tempGasPriceOracleService._updatePriceRatio()

    const updatedPriceRatio = await Boba_GasPriceOracle.priceRatio()
    expect(updatedPriceRatio).to.be.equal(BigNumber.from('2500'))
  })
})
