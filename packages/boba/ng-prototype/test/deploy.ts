import { BigNumber, Contract, ContractFactory, providers, Wallet } from 'ethers'
import { ethers } from 'hardhat'
import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
chai.use(solidity)
const abiDecoder = require('web3-eth-abi')

const fetch = require('node-fetch')
import hre from 'hardhat'
const cfg = hre.network.config
const gasOverride = {} // Can specify e.g. {gasPrice:0, gasLimit:999999} if needed

import L1_BobaPortal_json from "../artifacts/contracts/L1_BobaPortal.sol/L1_BobaPortal.json"
import L1_EthPool_json from "../artifacts/contracts/L1_EthPool.sol/L1_EthPool.json"

import L2_BobaPortal_json from "../artifacts/contracts/L2_BobaPortal.sol/L2_BobaPortal.json"
import L2_EthPool_json from "../artifacts/contracts/L2_EthPool.sol/L2_EthPool.json"

import OVM_ETH_json from "../../../contracts/artifacts/contracts/L2/predeploys/OVM_ETH.sol/OVM_ETH.json"
import L1_XDM_json from "../../../contracts/artifacts/contracts/L1/messaging/L1CrossDomainMessenger.sol/L1CrossDomainMessenger.json"
import L2_XDM_json from "../../../contracts/artifacts/contracts/L2/messaging/L2CrossDomainMessenger.sol/L2CrossDomainMessenger.json"
import L1_LP_json from "../../../boba/contracts/artifacts/contracts/LP/L1LiquidityPool.sol/L1LiquidityPool.json"
import AddressManager_json from "../../../contracts/artifacts/contracts/libraries/resolver/Lib_AddressManager.sol/Lib_AddressManager.json"

let Factory__L1_BobaPortal: ContractFactory
let portal_1: Contract
let Factory__L2_BobaPortal: ContractFactory
let portal_2: Contract

let Factory__L1_EthPool: ContractFactory
let ethpool_1: Contract
let Factory__L2_EthPool: ContractFactory
let ethpool_2: Contract

let oETH:Contract
let L1_XDM:Contract
let L2_XDM:Contract
let AddressManager:Contract

let boba_LP1:Contract

const l1_provider = new providers.JsonRpcProvider(cfg['url'])
const l2_provider = new providers.JsonRpcProvider("http://127.0.0.1:8545")

// Key for Hardhat test account #13 (0x1cbd3b2770909d4e10f157cabc84c7264073c9ec)
const testPrivateKey = '0x47c99abed3324a2707c28affff1267e45918ec8c3f20b8aa892e8b065d2942dd'
const testWallet = new Wallet(testPrivateKey, l1_provider)

const testWallet2 = new Wallet(testPrivateKey, l2_provider)

const deployerWallet = new Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', l1_provider) // '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'

describe("Portal Deployment", function () {

  before(async () => {
    AddressManager = new Contract(
      "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      AddressManager_json.abi,
      deployerWallet
    )
    const Proxy__OVM_L1CrossDomainMessenger_addr = await AddressManager.getAddress("Proxy__OVM_L1CrossDomainMessenger")
    const Proxy__OVM_L1CrossDomainMessengerFast_addr = await AddressManager.getAddress("Proxy__OVM_L1CrossDomainMessengerFast")

    Factory__L1_BobaPortal = new ContractFactory(
      L1_BobaPortal_json.abi,
      L1_BobaPortal_json.bytecode,
      testWallet
    )
    let deployAt = l1_provider.getBlockNumber();
    let deployAt2 = l2_provider.getBlockNumber();

    portal_1 = await Factory__L1_BobaPortal.deploy(
      Proxy__OVM_L1CrossDomainMessenger_addr,
      Proxy__OVM_L1CrossDomainMessengerFast_addr,
      deployAt2,
      { value: ethers.utils.parseEther("10")}
    )
    console.log("    L1 Portal contract deployed as", portal_1.address)

    Factory__L2_BobaPortal = new ContractFactory(
      L2_BobaPortal_json.abi,
      L2_BobaPortal_json.bytecode,
      testWallet2
    )
    portal_2 = await Factory__L2_BobaPortal.deploy(deployAt, gasOverride)
    console.log("    L2 Portal contract deployed as", portal_2.address)

    oETH = new Contract(
      "0x4200000000000000000000000000000000000006",
      OVM_ETH_json.abi,
      testWallet2
    )

    L1_XDM = new Contract(
      Proxy__OVM_L1CrossDomainMessenger_addr,
      L1_XDM_json.abi,
      testWallet
    )
    L2_XDM = new Contract(
      "0x4200000000000000000000000000000000000007",
      L2_XDM_json.abi,
      testWallet2
    )

  })

  it("should register Portals with AddressManager", async() => {
    let tx1 = await AddressManager.setAddress("L1_BobaPortal", portal_1.address)
    expect(await tx1.wait()).to.be.ok

    let tx2 = await AddressManager.setAddress("L2_BobaPortal", portal_2.address)
    expect(await tx2.wait()).to.be.ok
  })
})

describe("EthPool Deployment", function () {

  before(async () => {
    Factory__L1_EthPool = new ContractFactory(
      L1_EthPool_json.abi,
      L1_EthPool_json.bytecode,
      testWallet
    )

    ethpool_1 = await Factory__L1_EthPool.deploy(gasOverride)
    console.log("    L1 ETH Pool contract deployed as", ethpool_1.address)

    Factory__L2_EthPool = new ContractFactory(
      L2_EthPool_json.abi,
      L2_EthPool_json.bytecode,
      testWallet2
    )
    ethpool_2 = await Factory__L2_EthPool.deploy( { value: ethers.utils.parseEther("1")})
    console.log("    L2 ETH Pool contract deployed as", ethpool_2.address,)
  })

  it("should initialize L1 pool", async() => {
    let t = await ethpool_1.Initialize(portal_1.address,ethpool_2.address)
    expect (await t.wait()).to.be.ok
  })
  it("should initialize L2 pool", async() => {
    let t = await ethpool_2.Initialize(portal_2.address,ethpool_1.address)
    expect (await t.wait()).to.be.ok
  })

  it("should register Pools with AddressManager", async() => {
    let tx1 = await AddressManager.setAddress("L1_EthPool", ethpool_1.address)
    expect(await tx1.wait()).to.be.ok

    let tx2 = await AddressManager.setAddress("L2_EthPool", ethpool_2.address)
    expect(await tx2.wait()).to.be.ok
  })
})

describe("Activate the contracts", function () {
  // Deprecated, remove once everythings's using AddressManager lookups.
  it("should save addr list", async () => {
    let jj = {}
    jj['L1_BobaPortal'] = portal_1.address
    jj['L2_BobaPortal'] = portal_2.address
    jj['L1_EthPool'] = ethpool_1.address
    jj['L2_EthPool'] = ethpool_2.address

    let fs = require('fs')
    console.log(JSON.stringify(jj))
    fs.writeFile("artifacts/addr.json", JSON.stringify(jj), function(err) { if (err) throw err; })
  })

  it("should intercept L1->L2 optimism traffic", async() => {
    let t = await L1_XDM.SetPortal(portal_1.address)
    expect (await t.wait()).to.be.ok
  })

  it("should intercept L2->L1 optimism traffic", async() => {
    let t = await L2_XDM.SetPortal(portal_2.address)
    expect (await t.wait()).to.be.ok
  })
})
