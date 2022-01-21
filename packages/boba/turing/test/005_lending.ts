import { BigNumber, Contract, ContractFactory, providers, Wallet } from 'ethers'
import { ethers } from 'hardhat'
import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
chai.use(solidity)
const abiDecoder = require('web3-eth-abi')

import hre from 'hardhat'
const cfg = hre.network.config
var urlStr

const gasOverride =  {
  gasLimit: 3000000
}

const helperPredeploy = '0x4200000000000000000000000000000000000022'
import Lending from "../artifacts/contracts/Lending.sol/Lending.json"
import TuringHelper from "../artifacts/contracts/TuringHelper.sol/TuringHelper.json"

let Factory__Lending: ContractFactory
let lending: Contract
let Factory__Helper: ContractFactory
let helper: Contract

const local_provider = new providers.JsonRpcProvider(cfg['url'])

// Key for autofunded L2 Hardhat test account
const testPrivateKey = '0x47c99abed3324a2707c28affff1267e45918ec8c3f20b8aa892e8b065d2942dd'
const testWallet = new Wallet(testPrivateKey, local_provider)

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
            
    Factory__Lending = new ContractFactory(
      (Lending.abi),
      (Lending.bytecode),
      testWallet)
    
    lending = await Factory__Lending.deploy(
      helperPredeploy,
      gasOverride
    )

    console.log("    Lending contract deployed as", lending.address)
  })

  it("should return the helper address", async () => {
    let helperAddress = await lending.helperAddr()
    expect(helperAddress).to.equal(helperPredeploy)
  })

  it("should get the current Bitcoin - USD price", async () => {
    const tr = await lending.getCurrentQuote(urlStr, "BTC/USD", gasOverride)
    const res = await tr.wait()
    expect(res).to.be.ok
    //console.log("res",res)
    let rawData = res.events[2].data //the event returns 
    rawData = rawData.slice(2,)

    let numberHexString = rawData.slice(128,192)
    let result = parseInt(numberHexString, 16)
    console.log("     Bitcoin to usd price is",result/100)

    numberHexString = rawData.slice(192,256)
    result = parseInt(numberHexString, 16)
    console.log("     timestamp",result)
  })

})

