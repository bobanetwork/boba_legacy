import { BigNumber, Contract, ContractFactory, providers, Wallet, utils } from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'
import { ethers } from 'hardhat'
import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
chai.use(solidity)
const abiDecoder = require('web3-eth-abi')
import * as request from 'request-promise-native'

const fetch = require('node-fetch')
import hre from 'hardhat'
const cfg = hre.network.config
const hPort = 1235 // Port for local HTTP server
var urlStr

const gasOverride =  { gasLimit: 3000000 }
const local_provider = new providers.JsonRpcProvider(cfg['url'])

const deployerPK = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
const deployerWallet = new Wallet(deployerPK, local_provider)

import HelloTuringJson from "../artifacts/contracts/HelloTuring.sol/HelloTuring.json"
import TuringHelperJson from "../artifacts/contracts/TuringHelper.sol/TuringHelper.json"
import L2GovernanceERC20Json from '@boba/contracts/artifacts/contracts/standards/L2GovernanceERC20.sol/L2GovernanceERC20.json'

let Factory__Random: ContractFactory
let random: Contract
let Factory__Helper: ContractFactory
let helper: Contract
let turingCredit: Contract
let L2BOBAToken: Contract
let addressesBOBA

describe("Turing 256 Bit Random Number", function () {

  before(async () => {
    
    Factory__Helper = new ContractFactory(
      (TuringHelperJson.abi),
      (TuringHelperJson.bytecode),
      deployerWallet)
    
    helper = await Factory__Helper.deploy()
    console.log("    Helper contract deployed at", helper.address)

    Factory__Random = new ContractFactory(
      (HelloTuringJson.abi),
      (HelloTuringJson.bytecode),
      deployerWallet)
    
    random = await Factory__Random.deploy(helper.address, gasOverride)
    console.log("    Test contract deployed at", random.address)

    // whitelist your 'random' contract in the helper
    const tr1 = await helper.addPermittedCaller(random.address)
    const res1 = await tr1.wait()
    console.log("    addingPermittedCaller to TuringHelper", res1.events[0].data)

    const result = await request.get({ uri: 'http://127.0.0.1:8080/boba-addr.json' })
    addressesBOBA = JSON.parse(result)

    L2BOBAToken = new Contract(
      addressesBOBA.TOKENS.BOBA.L2,
      L2GovernanceERC20Json.abi,
      deployerWallet
    )

    // prepare to register/fund your Turing Helper 
    turingCredit = getContractFactory(
      'BobaTuringCredit',
      deployerWallet
    ).attach(addressesBOBA.BobaTuringCredit)

  })

  it("contract should be whitelisted", async () => {
    const tr2 = await helper.checkPermittedCaller(random.address, gasOverride)
    const res2 = await tr2.wait()
    const rawData = res2.events[0].data
    const result = parseInt(rawData.slice(-64), 16)
    expect(result).to.equal(1)
    console.log("    Test contract whitelisted in TuringHelper (1 = yes)?", result)
  })

  it('Should register and fund your Turing helper contract in turingCredit', async () => {

    const depositAmount = utils.parseEther('10')

    const preBalance = await turingCredit.prepaidBalance(helper.address)
    console.log("    Credit Prebalance", preBalance.toString())

    const bobaBalance = await L2BOBAToken.balanceOf(deployerWallet.address)
    console.log("    BOBA Balance in your account", bobaBalance.toString())

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

    const postBalance = await turingCredit.prepaidBalance(
      helper.address
    )

    expect(postBalance).to.be.deep.eq(preBalance.add(depositAmount))
  })

  it("should get the number 42", async () => {
    let tr = await random.get42()
    const res = await tr.wait()
    expect(res).to.be.ok
    const rawData = res.events[0].data
    const numberHexString = rawData.slice(-64)
    let result = parseInt(numberHexString, 16)
    console.log("    Turing 42 =",result)
  })

  it("should get a 256 bit random number", async () => {
    let tr = await random.getRandom()
    const res = await tr.wait()
    expect(res).to.be.ok
    const rawData = res.events[0].data
    const numberHexString = '0x'+ rawData.slice(-64)
    let result = BigInt(numberHexString)
    console.log("    Turing VRF 256 =",result)
  })

  it("should get a 256 bit random number", async () => {
    let tr = await random.getRandom()
    const res = await tr.wait()
    expect(res).to.be.ok
    const rawData = res.events[0].data
    const numberHexString = '0x'+ rawData.slice(-64)
    let result = BigInt(numberHexString)
    console.log("    Turing VRF 256 =",result)
  })

})

