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

let Factory__Lending: ContractFactory
let lending: Contract
let Factory__Helper: ContractFactory
let helper: Contract
let turingCredit: Contract
let L2BOBAToken: Contract
let addressesBOBA

import LendingJson from "../artifacts/contracts/Lending.sol/Lending.json"
import TuringHelperJson from "../artifacts/contracts/TuringHelper.sol/TuringHelper.json"
import L2GovernanceERC20Json from '@boba/contracts/artifacts/contracts/standards/L2GovernanceERC20.sol/L2GovernanceERC20.json'

//takes a string of hex values and coverts those to ASCII
function convertHexToASCII(hexString) {
    let stringOut = ''
    let tempAsciiCode
    hexString.match(/.{1,2}/g).map( (i) => {
      tempAsciiCode = parseInt(i, 16)
      stringOut = stringOut + String.fromCharCode(tempAsciiCode)
    })
    return stringOut.substring(1)
}

describe("Pull Bitcoin - USD quote", function () {

    before(async () => {

    urlStr = 'https://i9iznmo33e.execute-api.us-east-1.amazonaws.com/quote'
    console.log("    URL set to", urlStr)
    
    Factory__Helper = new ContractFactory(
      (TuringHelperJson.abi),
      (TuringHelperJson.bytecode),
      deployerWallet)
    
    helper = await Factory__Helper.deploy()
    console.log("    Helper contract deployed as", helper.address)

    Factory__Lending = new ContractFactory(
      (LendingJson.abi),
      (LendingJson.bytecode),
      deployerWallet)
    
    lending = await Factory__Lending.deploy(
      helper.address,
      gasOverride
    )

    console.log("    Lending contract deployed as", lending.address)
    
    // whitelist the new 'lending' contract in the helper
    const tr1 = await helper.addPermittedCaller(lending.address)
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
    const tr2 = await helper.checkPermittedCaller(lending.address, gasOverride)
    const res2 = await tr2.wait()
    const rawData = res2.events[0].data
    const result = parseInt(rawData.slice(-64), 16)
    expect(result).to.equal(1)
    console.log("    Test contract whitelisted in TuringHelper (1 = yes)?", result)
  })

  it("should return the helper address", async () => {
    let helperAddress = await lending.helperAddr()
    expect(helperAddress).to.equal(helper.address)
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
  it("should get the current Bitcoin - USD price", async () => {
    //await lending.estimateGas.getCurrentQuote(urlStr, "BTC/USD", gasOverride)
    const tr = await lending.getCurrentQuote(urlStr, "BTC/USD", gasOverride)
    const res = await tr.wait()
    expect(res).to.be.ok
    //console.log("res",res)
    let rawData = res.events[2].data //the event returns 
    rawData = rawData.slice(2,)

    let numberHexString = rawData.slice(128,192)
    let result = parseInt(numberHexString, 16)
    console.log("    Bitcoin to USD price is",result/100)

    numberHexString = rawData.slice(192,256)
    result = parseInt(numberHexString, 16)
    console.log("    timestamp",result)
  })

})

