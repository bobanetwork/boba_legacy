import {
  BigNumber,
  Contract,
  ContractFactory,
  providers,
  Wallet,
  utils,
} from 'ethers'
import { getContractFactory } from '@bobanetwork/core_contracts'
import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
chai.use(solidity)
const abiDecoder = require('web3-eth-abi')
import * as request from 'request-promise-native'

const fetch = require('node-fetch')
import hre from 'hardhat'
const cfg = hre.network.config

const gasOverride = {
  /*gasLimit: 3000000*/
}
const local_provider = new providers.JsonRpcProvider(cfg['url'])

const deployerPK = hre.network.config.accounts[0]
const deployerWallet = new Wallet(deployerPK, local_provider)

let BOBAL2Address
let BobaTuringCreditAddress

import BobaTuringCreditJson from "../../../packages/contracts/artifacts/contracts/L2/predeploys/BobaTuringCredit.sol/BobaTuringCredit.json";
import HelloTuringJson from '../artifacts/contracts/HelloTuring.sol/HelloTuring.json'
import TuringHelperJson from '../artifacts/contracts/TuringHelper.sol/TuringHelper.json'
import L2GovernanceERC20Json from '../../../packages/boba/contracts/artifacts/contracts/standards/L2GovernanceERC20.sol/L2GovernanceERC20.json'

let Factory__Random: ContractFactory
let random: Contract
let Factory__Helper: ContractFactory
let helper: Contract
let turingCredit: Contract
let L2BOBAToken: Contract
let addressesBOBA

describe('Turing 256 Bit Random Number', () => {
  before(async () => {
    Factory__Helper = new ContractFactory(
      TuringHelperJson.abi,
      TuringHelperJson.bytecode,
      deployerWallet
    )

    helper = await Factory__Helper.deploy(gasOverride)
    console.log('    Helper contract deployed at', helper.address)

    Factory__Random = new ContractFactory(
      HelloTuringJson.abi,
      HelloTuringJson.bytecode,
      deployerWallet
    )

    random = await Factory__Random.deploy(helper.address, gasOverride)
    console.log('    Test contract deployed at', random.address)

    // whitelist your 'random' contract in the helper
    const tr1 = await helper.addPermittedCaller(random.address)
    const res1 = await tr1.wait()
    console.log(
      '    addingPermittedCaller to TuringHelper',
      res1.events[0].data
    )

    if (hre.network.name === 'boba_rinkeby') {
      BOBAL2Address = '0xF5B97a4860c1D81A1e915C40EcCB5E4a5E6b8309'
      BobaTuringCreditAddress = '0x208c3CE906cd85362bd29467819d3AcbE5FC1614'
    } else if (hre.network.name === 'boba_mainnet') {
      BOBAL2Address = '0xa18bF3994C0Cc6E3b63ac420308E5383f53120D7'
      BobaTuringCreditAddress = '0xF8D2f1b0292C0Eeef80D8F47661A9DaCDB4b23bf'
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

    const bobaBalance = await L2BOBAToken.balanceOf(deployerWallet.address)
    console.log('    BOBA Balance in your account', bobaBalance.toString())

    // prepare to register/fund your Turing Helper
    turingCredit = new ContractFactory(
      BobaTuringCreditJson.abi,
      BobaTuringCreditJson.bytecode,
      deployerWallet
    ).attach(BobaTuringCreditAddress);
  })

  it('contract should be whitelisted', async () => {
    const tr2 = await helper.checkPermittedCaller(random.address, gasOverride)
    const res2 = await tr2.wait()
    const rawData = res2.events[0].data
    const result = parseInt(rawData.slice(-64), 16)
    expect(result).to.equal(1)
    console.log(
      '    Test contract whitelisted in TuringHelper (1 = yes)?',
      result
    )
  })

  it('Should register and fund your Turing helper contract in turingCredit', async () => {
    const depositAmount = utils.parseEther('0.20')

    const approveTx = await L2BOBAToken.approve(
      turingCredit.address,
      depositAmount
    )
    await approveTx.wait()

    const depositTx = await turingCredit.addBalanceTo(
      depositAmount,
      helper.address
    )
    await depositTx.wait()
  })

  it('should get the number 42', async () => {
    const tr = await random.get42(gasOverride)
    const res = await tr.wait()
    expect(res).to.be.ok
    const rawData = res.events[0].data
    const numberHexString = rawData.slice(-64)
    const result = parseInt(numberHexString, 16)
    console.log('    Turing 42 =', result)
  })

  it('should get a 256 bit random number', async () => {
    const tr = await random.getRandom(gasOverride)
    const res = await tr.wait()
    expect(res).to.be.ok
    const rawData = res.events[0].data
    const numberHexString = '0x' + rawData.slice(-64)
    const result = BigInt(numberHexString)
    console.log('    Turing VRF 256 =', result)
  })

  it('should get a 256 bit random number', async () => {
    const tr = await random.getRandom(gasOverride)
    const res = await tr.wait()
    expect(res).to.be.ok
    const rawData = res.events[0].data
    const numberHexString = '0x' + rawData.slice(-64)
    const result = BigInt(numberHexString)
    console.log('    Turing VRF 256 =', result)
  })
})
