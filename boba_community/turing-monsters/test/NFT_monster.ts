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

const gasOverride =  { /*gasLimit: 3000000*/ }

import ERC721Json from "../artifacts/contracts/ERC721min.sol/ERC721min.json"
import TuringHelperJson from "../artifacts/contracts/TuringHelper.sol/TuringHelper.json"
import L2GovernanceERC20Json from '@boba/contracts/artifacts/contracts/standards/L2GovernanceERC20.sol/L2GovernanceERC20.json'

let Factory__ERC721: ContractFactory
let erc721: Contract
let Factory__Helper: ContractFactory
let helper: Contract
let turingCredit: Contract
let L2BOBAToken: Contract
let addressesBOBA

const local_provider = new providers.JsonRpcProvider(cfg['url'])

// Rinkeby
const BOBAL2Address = '0xF5B97a4860c1D81A1e915C40EcCB5E4a5E6b8309'
const BobaTuringCreditRinkebyAddress = '0x208c3CE906cd85362bd29467819d3AcbE5FC1614'

// Mainnet-Test
// const BOBAL2Address = '0x58597818d1B85EF96383884951E846e9D6D03956'
// const BobaTuringCreditRinkebyAddress = '0xE654ba86Ea0B59a6836f86Ec806bfC9449D0aD0A'

const testPrivateKey = '0x___'
const testWallet = new Wallet(testPrivateKey, local_provider)

describe("Turing NFT Random 256", function () {

  before(async () => {
    
    // Deploy your Turing Helper
    Factory__Helper = new ContractFactory(
      (TuringHelperJson.abi),
      (TuringHelperJson.bytecode),
      testWallet)
    
    helper = await Factory__Helper.deploy()
    console.log("    Turing Helper contract deployed at", helper.address)

    // Deploy your NFT contract
    Factory__ERC721 = new ContractFactory(
      (ERC721Json.abi),
      (ERC721Json.bytecode),
      testWallet)
    
    erc721 = await Factory__ERC721.deploy(
      "TuringMonster",
      "BOO",
      helper.address, 
      gasOverride)

    console.log("    ERC721 contract deployed at", erc721.address)

    // white list your ERC721 contract in your helper
    // this is for your own security, so that only your contract can call your helper
    const tr1 = await helper.addPermittedCaller(erc721.address)
    const res1 = await tr1.wait()
    console.log("    adding your ERC721 as PermittedCaller to TuringHelper", res1.events[0].data)

    L2BOBAToken = new Contract(
      BOBAL2Address,
      L2GovernanceERC20Json.abi,
      testWallet
    )

    turingCredit = getContractFactory(
      'BobaTuringCredit',
      testWallet
    ).attach(BobaTuringCreditRinkebyAddress)

  })

  it('Should register and fund your Turing helper contract in turingCredit', async () => {

    const depositAmount = utils.parseEther('0.1')

    const bobaBalance = await L2BOBAToken.balanceOf(testWallet.address)
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

  })

  it("Your ERC721 contract should be whitelisted", async () => {
    const tr2 = await helper.checkPermittedCaller(erc721.address, gasOverride)
    const res2 = await tr2.wait()
    const rawData = res2.events[0].data
    const result = parseInt(rawData.slice(-64), 16)
    expect(result).to.equal(1)
    console.log("    ERC721 contract whitelisted in TuringHelper (1 = yes)?", result)
  })

  it("should mint an NFT with random attributes", async () => {
    let tr = await erc721.mint(testWallet.address, 42, gasOverride)
    let res = await tr.wait()
    expect(res).to.be.ok
    console.log("    Turing NFT =",res)
  })

  it("should mint an NFT with random attributes", async () => {
    let tr = await erc721.mint(testWallet.address, 43, gasOverride)
    let res = await tr.wait()
    expect(res).to.be.ok
    console.log("    Turing NFT =",res)
  })

  it("should mint an NFT with random attributes", async () => {
    let tr = await erc721.mint(testWallet.address, 44, gasOverride)
    let res = await tr.wait()
    expect(res).to.be.ok
    console.log("    Turing NFT =",res)
  })

  it("should get an svg", async () => {
    let uri = await erc721.tokenURI(42, gasOverride)
    console.log("    Turing URI =",uri)
  })

})

