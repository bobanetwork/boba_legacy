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

const tgt_1 = "0x2546bcd3c84621e976d8185a91a922ae77ecec30" // HH #16
const src_1 = "0x1cbd3b2770909d4e10f157cabc84c7264073c9ec"

//const OVM_L1CrossDomainMessenger_addr = "0x68B1D87F95878fE05B998F19b66F4baba5De1aed"
//const Proxy__OVM_L1CrossDomainMessenger_addr = "0x59b670e9fA9D0A427751Af201D676719a970857b"

const Proxy__OVM_L1CrossDomainMessenger_addr = "0xc6e7DF5E7b4f2A278906862b61205850344D4e7d"

describe("Uninstall Portals", function () {

  before(async () => {

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
      deployerWallet
    )
  })

  it("should unregister Portals from AddressManager", async() => {
    let tx1 = await AddressManager.setAddress("L1_BobaPortal", "0x0000000000000000000000000000000000000000")
    expect(await tx1.wait()).to.be.ok

    let tx2 = await AddressManager.setAddress("L2_BobaPortal", "0x0000000000000000000000000000000000000000")
    expect(await tx2.wait()).to.be.ok
  })

  it("should remove Optimism hooks", async() => {
    let tx1 = await L1_XDM.SetPortal("0x0000000000000000000000000000000000000000")
    expect (await tx1.wait()).to.be.ok

    let tx2 = await L2_XDM.SetPortal("0x0000000000000000000000000000000000000000")
    expect (await tx2.wait()).to.be.ok
  })
})
