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
  let L2SecondaryFeeToken: Contract

  let Factory__Boba_GasPriceOracle: ContractFactory
  let Boba_GasPriceOracle: Contract

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

    L2SecondaryFeeToken = await Factory__L2BOBA.deploy()
    await L2SecondaryFeeToken.deployTransaction.wait()

    await Lib_AddressManager.setAddress('TK_L2BOBA', L2BOBA.address)

    await Lib_AddressManager.setAddress(
      'L2_L1NativeToken',
      L2SecondaryFeeToken.address
    )

    Factory__Boba_GasPriceOracle = getContractFactory(
      'Boba_GasPriceOracle',
      wallet8
    )
    Boba_GasPriceOracle = await Factory__Boba_GasPriceOracle.deploy()
    await Boba_GasPriceOracle.deployTransaction.wait()

    await Boba_GasPriceOracle.initialize(address6, L2SecondaryFeeToken.address)
    await Boba_GasPriceOracle.updateDecimals(2)
    await Boba_GasPriceOracle.updateMinPriceRatio(1)
    await Boba_GasPriceOracle.updateMaxPriceRatio(500)
    await Boba_GasPriceOracle.updatePriceRatio(120, 100)

    await Lib_AddressManager.setAddress(
      'Proxy__Boba_GasPriceOracle',
      Boba_GasPriceOracle.address
    )

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
      l1TokenId: 'moonbeam',
    })

    await gasPriceOracleService.init()

    gasPriceOracleService.state.BOBAUSDPrice = 1
  })

  it('should set history values to 0', async () => {
    expect(gasPriceOracleService.state.L1SecondaryFeeTokenBalance).to.be.eq(
      BigNumber.from('0')
    )
    expect(gasPriceOracleService.state.L1SecondaryFeeTokenCostFee).to.be.eq(
      BigNumber.from('0')
    )
    expect(gasPriceOracleService.state.L1RelayerBalance).to.be.eq(
      BigNumber.from('0')
    )
    expect(gasPriceOracleService.state.L1RelayerCostFee).to.be.eq(
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
    expect(l2HistoryJSON.L2BOBABillingCollectFee).to.be.eq('0')

    const l1DumpsPath = path.resolve(__dirname, '../data/l1History.json')
    expect(fs.existsSync(l1DumpsPath)).to.be.true

    const l1HistoryJsonRaw = await fsPromise.readFile(l1DumpsPath)
    const l1HistoryJSON = JSON.parse(l1HistoryJsonRaw.toString())

    expect(l1HistoryJSON.L1SecondaryFeeTokenBalance).to.be.eq('0')
    expect(l1HistoryJSON.L1SecondaryFeeTokenCostFee).to.be.eq('0')
    expect(l1HistoryJSON.L1RelayerBalance).to.be.eq('0')
    expect(l1HistoryJSON.L1RelayerCostFee).to.be.eq('0')
  })

  it('should update and store history values', async () => {
    gasPriceOracleService.state.L1SecondaryFeeTokenBalance = BigNumber.from('1')
    gasPriceOracleService.state.L1SecondaryFeeTokenCostFee = BigNumber.from('2')
    gasPriceOracleService.state.L1RelayerBalance = BigNumber.from('3')
    gasPriceOracleService.state.L1RelayerCostFee = BigNumber.from('4')
    gasPriceOracleService.state.L2BOBACollectFee = BigNumber.from('6')
    gasPriceOracleService.state.L2BOBABillingCollectFee = BigNumber.from('7')

    // Write two files
    await gasPriceOracleService._writeL1ETHFee()
    await gasPriceOracleService._writeL2FeeCollect()

    // Verify them
    const l2DumpsPath = path.resolve(__dirname, '../data/l2History.json')
    expect(fs.existsSync(l2DumpsPath)).to.be.true

    const l2HistoryJsonRaw = await fsPromise.readFile(l2DumpsPath)
    const l2HistoryJSON = JSON.parse(l2HistoryJsonRaw.toString())

    expect(l2HistoryJSON.L2BOBACollectFee).to.be.eq('6')
    expect(l2HistoryJSON.L2BOBABillingCollectFee).to.be.eq('7')

    const l1DumpsPath = path.resolve(__dirname, '../data/l1History.json')
    expect(fs.existsSync(l1DumpsPath)).to.be.true

    const l1HistoryJsonRaw = await fsPromise.readFile(l1DumpsPath)
    const l1HistoryJSON = JSON.parse(l1HistoryJsonRaw.toString())

    expect(l1HistoryJSON.L1SecondaryFeeTokenBalance).to.be.eq('1')
    expect(l1HistoryJSON.L1SecondaryFeeTokenCostFee).to.be.eq('2')
    expect(l1HistoryJSON.L1RelayerBalance).to.be.eq('3')
    expect(l1HistoryJSON.L1RelayerCostFee).to.be.eq('4')

    // Reset history values
    gasPriceOracleService.state.L1SecondaryFeeTokenBalance = BigNumber.from('0')
    gasPriceOracleService.state.L1SecondaryFeeTokenCostFee = BigNumber.from('0')
    gasPriceOracleService.state.L1RelayerBalance = BigNumber.from('0')
    gasPriceOracleService.state.L1RelayerCostFee = BigNumber.from('0')
    gasPriceOracleService.state.L2BOBACollectFee = BigNumber.from('0')
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

    expect(gasPriceOracleService.state.L1SecondaryFeeTokenBalance).to.be.eq(
      ethers.utils.parseEther('4')
    )
    expect(gasPriceOracleService.state.L1SecondaryFeeTokenCostFee).to.be.eq(
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
    expect(costFee).to.be.equal(
      gasPriceOracleService.state.L1SecondaryFeeTokenCostFee
    )
    expect(gasPriceOracleService.state.L1SecondaryFeeTokenBalance).to.be.equal(
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
    const preL1SecondaryFeeTokenCostFee =
      gasPriceOracleService.state.L1SecondaryFeeTokenCostFee
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

    // Update L1SecondaryFeeTokenBalance and keep L1SecondaryFeeTokenCostFee
    // Update L1RelayerBalance and keep L1RelayerCostFee
    await gasPriceOracleService._getL1Balance()
    expect(gasPriceOracleService.state.L1SecondaryFeeTokenBalance).to.be.equal(
      postSequencerBalance
        .add(postProposerBalance)
        .add(postRelayerBalance)
        .add(postFastRelayerBalance)
    )
    expect(preL1SecondaryFeeTokenCostFee).to.be.eq(
      gasPriceOracleService.state.L1SecondaryFeeTokenCostFee
    )

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
    await L2SecondaryFeeToken.transfer(address6, ethers.utils.parseEther('1'))
    await L2SecondaryFeeToken.transfer(address7, ethers.utils.parseEther('1'))

    await gasPriceOracleService._getL2GasCost()

    expect(gasPriceOracleService.state.L2BOBACollectFee).to.be.eq(
      ethers.utils.parseEther('1')
    )
    expect(gasPriceOracleService.state.L2BOBAVaultBalance).to.be.eq(
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
    const preL2BOBACollectFee = gasPriceOracleService.state.L2BOBACollectFee
    const preL2BOBABillingCollectFee =
      gasPriceOracleService.state.L2BOBABillingCollectFee

    // send some funds back
    const signer1Address = await signer1.getAddress()
    await wallet5.sendTransaction({
      to: signer1Address,
      value: ethers.utils.parseEther('0.5'),
    })
    await signer1.sendTransaction({
      to: wallet5.address,
      value: ethers.utils.parseEther('0.5'),
    })
    await L2SecondaryFeeToken.connect(wallet6).transfer(
      signer1Address,
      ethers.utils.parseEther('0.5')
    )
    await L2SecondaryFeeToken.connect(wallet7).transfer(
      signer1Address,
      ethers.utils.parseEther('0.5')
    )

    const L2BOBAVaultBalance = await wallet5.getBalance()
    const L2BOBABillingBalance = await wallet5.provider.getBalance(address7)

    await gasPriceOracleService._getL2GasCost()

    expect(gasPriceOracleService.state.L2BOBACollectFee).to.be.equal(
      preL2BOBACollectFee
    )
    expect(gasPriceOracleService.state.L2BOBABillingCollectFee).to.be.equal(
      preL2BOBABillingCollectFee
    )
    expect(gasPriceOracleService.state.L2BOBAVaultBalance).to.be.equal(
      L2BOBAVaultBalance
    )
    expect(gasPriceOracleService.state.L2BOBABillingBalance).to.be.equal(
      L2BOBABillingBalance
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
      l1TokenId: 'moonbeam',
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
      l1TokenId: 'moonbeam',
    })

    await tempGasPriceOracleService.init()

    const preL1BaseFee = await gasPriceOracle.l1BaseFee()
    expect(preL1BaseFee).to.be.equal(ethers.utils.parseEther('0'))

    await tempGasPriceOracleService._upateL1BaseFee()

    const postL1BaseFee = await gasPriceOracle.l1BaseFee()
    expect(postL1BaseFee).to.be.equal(ethers.utils.parseEther('0'))
  })

  it('should get Boba and l1 native token prices', async () => {
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
      bobaFeeRatio100X: 120,
      bobaFeeRatioMinPercentChange: 3000,
      bobaLocalTestnetChainId: 31337,
      l1TokenId: 'moonbeam',
    })

    await tempGasPriceOracleService.init()

    const BobaPrice = await tempGasPriceOracleService._getTokenPrice(
      'boba-network'
    )
    const l1NativeTokenPrice = await tempGasPriceOracleService._getTokenPrice(
      tempGasPriceOracleService.options.l1TokenId
    )
    expect(BobaPrice).not.to.be.equal(0)
    expect(l1NativeTokenPrice).not.to.be.equal(0)

    await tempGasPriceOracleService._updatePriceRatio()

    const decimals = (await Boba_GasPriceOracle.decimals()).toNumber()
    const marketPriceRatio = await Boba_GasPriceOracle.marketPriceRatio()
    const priceRatio = await Boba_GasPriceOracle.priceRatio()

    const calculatedMarketPriceRatio = Math.round(
      (BobaPrice / l1NativeTokenPrice) * 10 ** decimals
    )
    const calculatedPriceRatio = Math.round(
      ((BobaPrice / l1NativeTokenPrice) *
        10 ** decimals *
        tempGasPriceOracleService.options.bobaFeeRatio100X) /
        100
    )
    expect(marketPriceRatio.toNumber()).to.be.eq(calculatedMarketPriceRatio)
    expect(priceRatio.toNumber()).to.be.eq(calculatedPriceRatio)
  })

})
