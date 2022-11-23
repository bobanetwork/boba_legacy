// https://github.com/bobanetwork/boba/blob/develop/packages/boba/turing/test/005_lending.ts

import {
  BigNumber,
  Contract,
  ContractFactory,
  providers,
  Wallet,
  utils,
} from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'
import { ethers, upgrades } from 'hardhat'
import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'

chai.use(solidity)
const abiDecoder = require('web3-eth-abi')
import * as request from 'request-promise-native'

const fetch = require('node-fetch')
import hre from 'hardhat'

const cfg = hre.network.config
const hPort = 1235 // Port for local HTTP server
let urlStr

const gasOverride = { gasLimit: 11_000_000 }
const local_provider = new providers.JsonRpcProvider(cfg['url'])

const deployerPK = hre.network.config.accounts[0]
const otherWalletPK = hre.network.config.accounts[1]
const deployerWallet = new Wallet(deployerPK, local_provider)
const otherWallet = new Wallet(otherWalletPK, local_provider)

let BOBAL2Address
let BobaTuringCreditAddress
let WETHAddress
let RouterAddress

let Factory__BobaTuringCredit: ContractFactory
let Factory__ERC20Mock: ContractFactory
let erc20Mock: Contract
let Factory__HybridComputeHelperFactory: ContractFactory
let hcFactory: Contract
let Factory__HybridComputeHelper: ContractFactory
let HybridComputeHelper: Contract
let turingCredit: Contract
let L2BOBAToken: Contract
let addressesBOBA

import HybridComputeHelperFactoryJson from '../artifacts/contracts/HybridComputeHelperFactory.sol/HybridComputeHelperFactory.json'
import HybridComputeHelperJson from '../artifacts/contracts/TuringHelper.sol/TuringHelper.json'
import BobaTuringCreditJson from '../../../../../packages/contracts/artifacts/contracts/L2/predeploys/BobaTuringCredit.sol/BobaTuringCredit.json'
import L2GovernanceERC20Json from '../../../../../packages/contracts/artifacts/contracts/standards/L2GovernanceERC20.sol/L2GovernanceERC20.json'

describe('Turing Helper Factory', function () {
  before(async () => {
    if (hre.network.name === 'boba_goerli') {
      BOBAL2Address = '0x4200000000000000000000000000000000000023'
      BobaTuringCreditAddress = '0x4200000000000000000000000000000000000020'
      WETHAddress = '0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000'
      RouterAddress = '0x4df04E20cCd9a8B82634754fcB041e86c5FF085A' // todo ignored
    } else if (hre.network.name === 'boba_mainnet') {
      BOBAL2Address = '0x_________________'
      BobaTuringCreditAddress = '0xF8D2f1b0292C0Eeef80D8F47661A9DaCDB4b23bf'
      WETHAddress = '0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000'
      RouterAddress = '0x17C83E2B96ACfb5190d63F5E46d93c107eC0b514'
    } else if (hre.network.name === 'rinkeby') {
      WETHAddress = '0xc778417e063141139fce010982780140aa0cd5ab'
      RouterAddress = '0x6000eb83c2583AFD25D93cB0629D6b0a0B2F245c'
    } else {
      const result = await request.get({
        uri: 'http://127.0.0.1:8080/boba-addr.json',
      })
      addressesBOBA = JSON.parse(result)
      BOBAL2Address = addressesBOBA.TOKENS.BOBA.L2
      BobaTuringCreditAddress = addressesBOBA.BobaTuringCredit
      //WETHAddress = addressesBOBA.
    }

    L2BOBAToken = new Contract(
      BOBAL2Address,
      L2GovernanceERC20Json.abi,
      deployerWallet
    )

    turingCredit = await new ContractFactory(
      BobaTuringCreditJson.abi,
      BobaTuringCreditJson.bytecode,
      deployerWallet
    ).attach(BobaTuringCreditAddress)


    Factory__HybridComputeHelper = new ContractFactory(
      HybridComputeHelperJson.abi,
      HybridComputeHelperJson.bytecode,
      deployerWallet
    )

    Factory__HybridComputeHelperFactory = new ContractFactory(
      HybridComputeHelperFactoryJson.abi,
      HybridComputeHelperFactoryJson.bytecode,
      deployerWallet
    )

    const redeploy = true
    if (redeploy) {
      HybridComputeHelper = await upgrades.deployProxy(
        Factory__HybridComputeHelper
      )
      console.log('    Helper contract deployed as', HybridComputeHelper.address)
      const implementationHybridComputeHelper =
        await upgrades.erc1967.getImplementationAddress(
          HybridComputeHelper.address
        )
      console.log('    Implementation of Helper at', implementationHybridComputeHelper)


      hcFactory = await Factory__HybridComputeHelperFactory.deploy(
        BOBAL2Address,
        implementationHybridComputeHelper,
        BobaTuringCreditAddress,
        gasOverride
      )
    } else {
      HybridComputeHelper = Factory__HybridComputeHelper.attach(
        '0x8b3d804c5E71c20802E0bB45bf3cbbC8411f32e8'
      )
      hcFactory = Factory__HybridComputeHelperFactory.attach(
        '0x87Fa68e273943b7e1e7241375F5C6aec30D4aa59'
      )
    }

    console.log('    Factory contract deployed as', hcFactory.address)
  })

  /*it.only('should deploy new funded HybridComputeHelper via Factory (payment in ETH)', async () => {
    const minAmountBoba = parseEther('0.02')

    const implTx = await turingFactory.deployMinimalETH(
      [deployerWallet.address],
      minAmountBoba,
      { ...gasOverride, value: ethers.utils.parseEther('0.1') }
    )

    // TODO: Check if rest ETH is refunded

    const res = await implTx.wait()
    console.log('TX confirmation: ', res)
    expect(res).to.be.ok
  })*/

  let newHybridComputeHelper: Contract
  let newHybridComputeHelperOtherWallet: Contract
  it('should deploy new funded HybridComputeHelper via Factory and have proper ownership (payment in BOBA)', async () => {
    // Approva Boba before
    const bobaToDeposit = ethers.utils.parseEther('0.02')
    const approveTx = await L2BOBAToken.approve(
      hcFactory.address,
      bobaToDeposit
    )
    await approveTx.wait()
    console.log('Approved Boba tokens for funding new HybridComputeHelper')

    const implTuring = await hcFactory.turingImplementation()
    console.log("IMPLEMENTATION: ", implTuring)

    const implTx = await hcFactory.deployMinimal(
      [deployerWallet.address],
      bobaToDeposit,
      gasOverride
    )
    const res = await implTx.wait()
    console.log('TX confirmation: ', res)
    expect(res).to.be.ok

    const [, implementation] = res.events.find(
      (e) => e.event === 'HybridComputeHelperDeployed'
    ).args
    console.log('New Turing Helper at: ' + implementation)

    const preBalance = await turingCredit.prepaidBalance(implementation)
    expect(preBalance).to.be.equal(bobaToDeposit) // is funded?

    newHybridComputeHelper =
      Factory__HybridComputeHelper.attach(implementation).connect(
        deployerWallet
      )
    newHybridComputeHelperOtherWallet = newHybridComputeHelper.connect(otherWallet)
    const owner = await newHybridComputeHelper.owner()
    console.log('Owner: ', owner)
    expect(owner).to.equal(deployerWallet.address)
  })

  it('contract should be whitelisted', async () => {
    const tr2 = await newHybridComputeHelper.checkPermittedCaller(
      deployerWallet.address,
      gasOverride
    )
    const res2 = await tr2.wait()
    const rawData = res2.events[0].data
    const result = parseInt(rawData.slice(-64), 16)
    expect(result).to.equal(1)
    console.log(
      '    Test contract/wallet whitelisted in new HybridComputeHelper (1 = yes)?',
      result
    )
  })

  it('should get random number', async () => {
    await newHybridComputeHelper.estimateGas.TuringRandom(gasOverride)
    const tr = await newHybridComputeHelper.TuringRandom(gasOverride)
    const res = await tr.wait()
    expect(res).to.be.ok
    const rawData = res.events[0].data
    const numberHexString = rawData.slice(-64)
    const result = parseInt(numberHexString, 16)
    console.log('    Turing random =', result)
  })

  it('other contract/wallet should not be whitelisted', async () => {
    const tr2 = await newHybridComputeHelperOtherWallet.checkPermittedCaller(
      otherWallet.address,
      gasOverride
    )
    const res2 = await tr2.wait()
    const rawData = res2.events[0].data
    const result = parseInt(rawData.slice(-64), 16)
    expect(result).to.equal(0)
    console.log(
      '    Other contract/wallet not whitelisted in new HybridComputeHelper (0 = no)?',
      result
    )
  })

  it('should fail to get random number when not a permitted caller', async () => {
    const tr = await newHybridComputeHelperOtherWallet.TuringRandom(gasOverride)
    const res = tr.wait()
    expect(res, 'Should not be allowed to call').to.be.reverted
  })
})
