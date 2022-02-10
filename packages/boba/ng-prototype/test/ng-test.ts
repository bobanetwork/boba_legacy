import { BigNumber, Contract, ContractFactory, providers, Wallet } from 'ethers'
import { ethers } from 'hardhat'
import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
chai.use(solidity)
const abiDecoder = require('web3-eth-abi')

const fetch = require('node-fetch')
import hre from 'hardhat'
const cfg = hre.network.config
const hPort = 1234 // Port for local HTTP server
var urlStr
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

let portal_1: Contract
let portal_2: Contract

let ethpool_1: Contract
let ethpool_2: Contract

let oETH:Contract
let L1_XDM:Contract
let L2_XDM:Contract
let AddressManager:Contract

let boba_LP1:Contract

const local_provider = new providers.JsonRpcProvider(cfg['url'])
const l2_provider = new providers.JsonRpcProvider("http://127.0.0.1:8545")


// Key for Hardhat test account #13 (0x1cbd3b2770909d4e10f157cabc84c7264073c9ec)
const testPrivateKey = '0x47c99abed3324a2707c28affff1267e45918ec8c3f20b8aa892e8b065d2942dd'
const testWallet = new Wallet(testPrivateKey, local_provider)

const testWallet2 = new Wallet(testPrivateKey, l2_provider)

const tgt_1 = "0x2546bcd3c84621e976d8185a91a922ae77ecec30" // HH #16
const src_1 = "0x1cbd3b2770909d4e10f157cabc84c7264073c9ec"

//const OVM_L1CrossDomainMessenger_addr = "0x68B1D87F95878fE05B998F19b66F4baba5De1aed"
//const Proxy__OVM_L1CrossDomainMessenger_addr = "0x59b670e9fA9D0A427751Af201D676719a970857b"

const Proxy__OVM_L1CrossDomainMessenger_addr = "0xc6e7DF5E7b4f2A278906862b61205850344D4e7d"

describe("Portal Tests", function () {

  before(async () => {
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
    AddressManager = new Contract(
      "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      AddressManager_json.abi,
      testWallet
    )

    portal_1 = new Contract(
      await AddressManager.getAddress("L1_BobaPortal"),
      L1_BobaPortal_json.abi,
      testWallet
    )
    console.log("L1_BobaPortal is at", portal_1.address)

    portal_2 = new Contract(
      await AddressManager.getAddress("L2_BobaPortal"),
      L2_BobaPortal_json.abi,
      testWallet2
    )
    console.log("L2_BobaPortal is at", portal_2.address)

    ethpool_1 = new Contract(
      await AddressManager.getAddress("L1_EthPool"),
      L1_EthPool_json.abi,
      testWallet
    )
    console.log("L1_EthPool is at", ethpool_1.address)

    ethpool_2 = new Contract(
      await AddressManager.getAddress("L2_EthPool"),
      L2_EthPool_json.abi,
      testWallet2
    )
    console.log("L2_EthPool is at", ethpool_2.address)
  })

  it("should not be locked", async () => {
    let is_active = portal_1.IsActive(gasOverride)
    expect(await is_active).to.be.true
  })

  it("should SysPay", async () => {
    let t = await portal_1.SysMsg(tgt_1, "0x", {value:123456} );
    //console.log(t)
    let r = await t.wait()
    //console.log("sys R", r)
    console.log("sys gas", r.gasUsed.toString())
    expect(r).to.be.ok
  })

  it("should have a balance", async() => {
    let bal = await local_provider.getBalance(portal_1.address)
    console.log("bal", bal.toString())
    expect(bal.valueOf()).to.equal(ethers.utils.parseEther("10.000000000000123456"))
  })

  it("should relay a user message", async () => {
    let t = await portal_1.UserRelayDown(tgt_1, 555555, src_1,  "0x",{value:123456} );
    //console.log(t)
    let r = await t.wait()
    //console.log("user R", r)
    console.log("user gas", r.gasUsed.toString())
    expect(r).to.be.ok
  })

  it("should have a larger balance", async() => {
    let bal = await local_provider.getBalance(portal_1.address)
    console.log("bal", bal.toString())
    expect(bal.valueOf()).to.equal(ethers.utils.parseEther("10.000000000000246912"))
  })

  it("should have valid sequence count", async() => {
    expect(await portal_1.GetSeq()).to.equal(2)
  })

  it.skip("should tunnelMsg", async () => { // Can't tunnel to StandardBridge (msgNonce)
//    let t = await portal_1.TunnelMsg("0xf64b5f4400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000");
    let t = await portal_1.TunnelMsg("0x000000000000000000000000e7f1725e7734ce288f8367e1bb143e90bb3f0512000000000000000000000000998abeb3e57409262ae5b751f60747921b33613e000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000140000000000000000000000000000000000000000000000000000000000000064bd2d1cab0000000000000000000000007d55869ef8e9771e67793538698cc2fba86c953900000000000000000000000000000000000000000000000006f049bd515071c8000000000000000000000000420000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000");
    let r = await t.wait()
    console.log(r.gasUsed.toString())
    expect(r).to.be.ok
  })

  it.skip("should approve L2 oETH", async() => {
    let t = await oETH.approve(portal_2.address, ethers.utils.parseEther("99999"))
    expect (await t.wait()).to.be.ok
    let t2 = await oETH.approve(ethpool_2.address, ethers.utils.parseEther("99999"))
    expect (await t2.wait()).to.be.ok
  })

  it("should relay a user message from L2",  async () => {
    let t = await portal_2.UserRelayUp(src_1, tgt_1,  "0x", {value: 5551212} );
    //console.log(t)
    let r = await t.wait()
    //console.log("user R", r)
    console.log("user gas", r.gasUsed.toString())
    expect(r).to.be.ok
  })

  it.skip("should emulate Optimism withdrawal", async() => {
     let t = await portal_2.withdraw(
      '0x4200000000000000000000000000000000000006',
      8675309,
      1,
      "0x65656565",
      {value: 8675309}
     )
    let r = await t.wait()
    console.log("gas", r.gasUsed.toString())
    expect(r).to.be.ok
  })
})

describe("EthPool Tests", function () {

  before(async () => {
  })

  it("should fall back to a Traditional onramp", async() => {
    let t = await ethpool_1.clientDepositL1(543210, "0x0000000000000000000000000000000000000000", {value: 543210})
    //console.log("onramp t", t)
    let r = await t.wait()
    console.log("GasUsed:", r.gasUsed.toString())
    expect(r).to.be.ok
  })

  it("should allow L1 staking", async() => {
    let t = await ethpool_1.addLiquidity(2111222111, "0x0000000000000000000000000000000000000000", {value: 2111222111})
    //console.log("onramp t", t)
    let r = await t.wait()
    console.log("GasUsed:", r.gasUsed.toString())
    expect(r).to.be.ok
  })

  it("should recognize L1 liquidity on L2", async() => {
    let t = await ethpool_2.LiquidityAdded(testWallet.address, 2111222111)
    expect(await t.wait()).to.be.ok
  })

  it("should PaySwap", async() => {
    let t = await ethpool_2.PaySwap(tgt_1, 333, 0, {value: 333})
    expect(await t.wait()).to.be.ok
  })

  it("should clentDepositL2", async() => {
    let t = await ethpool_2.clientDepositL2(5000, "0x4200000000000000000000000000000000000006", {value: 5000, gasLimit:8000000})
    expect(await t.wait()).to.be.ok
  })
})

