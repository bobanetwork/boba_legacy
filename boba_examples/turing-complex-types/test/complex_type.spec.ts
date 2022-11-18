// https://github.com/bobanetwork/boba/blob/develop/packages/boba/turing/test/005_lending.ts

import {
  Contract,
  ContractFactory,
  providers,
  Wallet,
  utils,
} from 'ethers'
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

const gasOverride = { gasLimit: 3000000 }
const local_provider = new providers.JsonRpcProvider(cfg['url'])

const deployerPK = hre.network.config.accounts[0]
const deployerWallet = new Wallet(deployerPK, local_provider)

let BOBAL2Address
let BobaTuringCreditAddress

let Factory__BobaTuringCredit: ContractFactory
let Factory__ComplexType: ContractFactory
let complex: Contract
let Factory__TuringHelper: ContractFactory
let turingHelper: Contract
let turingCredit: Contract
let L2BOBAToken: Contract
let addressesBOBA

import ComplexType from '../artifacts/contracts/ComplexType.sol/ComplexType.json'
import TuringHelperJson from '../artifacts/contracts/TuringHelper.sol/TuringHelper.json'
import L2GovernanceERC20Json from '../../../packages/contracts/artifacts/contracts/standards/L2GovernanceERC20.sol/L2GovernanceERC20.json'
import BobaTuringCreditJson from '../../../packages/contracts/artifacts/contracts/L2/predeploys/BobaTuringCredit.sol/BobaTuringCredit.json'


describe('Return complex types', function () {
  before(async () => {
    Factory__TuringHelper = new ContractFactory(
      TuringHelperJson.abi,
      TuringHelperJson.bytecode,
      deployerWallet
    )

    turingHelper = await Factory__TuringHelper.deploy(gasOverride)
    console.log('Helper contract deployed as', turingHelper.address)

    Factory__ComplexType = new ContractFactory(
      ComplexType.abi,
      ComplexType.bytecode,
      deployerWallet
    )

    complex = await Factory__ComplexType.deploy(
      turingHelper.address,
      "your_aws_api-gateway/lambda",
      gasOverride
    )

    console.log('Contract deployed on', complex.address)

    // whitelist the new 'lending' contract in the helper
    const tr1 = await turingHelper.addPermittedCaller(complex.address)
    const res1 = await tr1.wait()
    console.log('addingPermittedCaller to TuringHelper', res1.events[0].data)

    if (hre.network.name === 'boba_goerli') {
      BOBAL2Address = '0xF5B97a4860c1D81A1e915C40EcCB5E4a5E6b8309'
      BobaTuringCreditAddress = '0x208c3CE906cd85362bd29467819d3AcbE5FC1614'
    } else if (hre.network.name === 'boba_mainnet') {
      BOBAL2Address = '0x_________________'
      BobaTuringCreditAddress = '0x___________________'
    } else {
      const result = await request.get({
        uri: 'http://127.0.0.1:8080/boba-addr.json',
      })
      addressesBOBA = JSON.parse(result)
      BOBAL2Address = addressesBOBA.TOKENS.BOBA.L2
      BobaTuringCreditAddress = addressesBOBA.BobaTuringCredit
    }

    L2BOBAToken = new Contract(
      BOBAL2Address,
      L2GovernanceERC20Json.abi,
      deployerWallet
    )

    // prepare to register/fund your Turing Helper
    Factory__BobaTuringCredit = new ContractFactory(
      BobaTuringCreditJson.abi,
      BobaTuringCreditJson.bytecode,
      deployerWallet
    )

    turingCredit = await Factory__BobaTuringCredit.attach(
      BobaTuringCreditAddress
    )
  })

  it('contract should be whitelisted', async () => {
    const tr2 = await turingHelper.checkPermittedCaller(
      complex.address,
      gasOverride
    )
    const res2 = await tr2.wait()
    const rawData = res2.events[0].data
    const result = parseInt(rawData.slice(-64), 16)
    expect(result).to.equal(1)
    console.log(
      'Test contract whitelisted in TuringHelper (1 = yes)?',
      result
    )
  })

  it('Should register and fund your Turing helper contract in turingCredit', async () => {
    const depositAmount = utils.parseEther('0.10')

    const approveTx = await L2BOBAToken.approve(
      turingCredit.address,
      depositAmount
    )
    await approveTx.wait()

    const depositTx = await turingCredit.addBalanceTo(
      depositAmount,
      turingHelper.address
    )
    await depositTx.wait()
  })

  it('should return the helper address', async () => {
    const helperAddress = await complex.turingHelper()
    expect(helperAddress).to.equal(turingHelper.address)
  })

  it('should call Turing function', async () => {
    await complex.estimateGas.loadData(deployerWallet.address, "testID", gasOverride)
    console.log('Estimated gas')
    const tr = await complex.loadData(deployerWallet.address, "testID", gasOverride)
    console.log('Transaction sent')
    const res = await tr.wait()
    console.log('TX confirmation: ', res)
    expect(res).to.be.ok
  })
})
