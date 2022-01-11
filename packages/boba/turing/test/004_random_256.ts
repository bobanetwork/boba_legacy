import { BigNumber, Contract, ContractFactory, providers, Wallet } from 'ethers'
import { ethers } from 'hardhat'
import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
chai.use(solidity)
const abiDecoder = require('web3-eth-abi')

const fetch = require('node-fetch')
import hre from 'hardhat'
const cfg = hre.network.config

const gasOverride =  {
  gasLimit: 3000000 //3,000,000
}

import HelloTuringJson from "../artifacts/contracts/HelloTuring.sol/HelloTuring.json"
import TuringHelper from "../artifacts/contracts/TuringHelper.sol/TuringHelper.json"

let Factory__Hello: ContractFactory
let hello: Contract
let Factory__Helper: ContractFactory
let helper: Contract

const local_provider = new providers.JsonRpcProvider(cfg['url'])

// Key for Hardhat test account #13 (0x1cbd3b2770909d4e10f157cabc84c7264073c9ec)
const testPrivateKey = '0x47c99abed3324a2707c28affff1267e45918ec8c3f20b8aa892e8b065d2942dd'
const testWallet = new Wallet(testPrivateKey, local_provider)

describe("Turing VRF", function () {

  before(async () => {

    Factory__Helper = new ContractFactory(
      (TuringHelper.abi),
      (TuringHelper.bytecode),
      testWallet)

    helper = await Factory__Helper.deploy(gasOverride)
    console.log("    Helper contract deployed at", helper.address, "on", "L2")
    
    Factory__Hello = new ContractFactory(
      (HelloTuringJson.abi),
      (HelloTuringJson.bytecode),
      testWallet)
    
    hello = await Factory__Hello.deploy(helper.address, gasOverride)
    console.log("    Test contract deployed at", hello.address)
  })

  it("should get the number 42", async () => {
    let tr = await hello.get42()
    const res = await tr.wait()
    expect(res).to.be.ok
    const rawData = res.events[0].data
    const numberHexString = rawData.slice(-64)
    let result = parseInt(numberHexString, 16)
    console.log("    Turing 42 =",result)
  })

  it("should get a length 64 VRF", async () => {
    let tr = await hello.getRandom()
    const res = await tr.wait()
    expect(res).to.be.ok
    const rawData = res.events[0].data
    const numberHexString = rawData.slice(-64)
    let result = parseInt(numberHexString, 16)
    console.log("    Turing VRF 64 =",result)
  })

  it("should get a length 64 VRF", async () => {
    let tr = await hello.getRandom()
    const res = await tr.wait()
    expect(res).to.be.ok
    const rawData = res.events[0].data
    const numberHexString = rawData.slice(-64)
    let result = parseInt(numberHexString, 16)
    console.log("    Turing VRF 64 =",result)
  })

})

