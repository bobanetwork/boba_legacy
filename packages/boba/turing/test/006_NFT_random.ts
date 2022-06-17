import { BigNumber, Contract, ContractFactory, providers, Wallet, utils } from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'
import { ethers } from 'hardhat'
import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
chai.use(solidity)
const abiDecoder = require('web3-eth-abi')
import * as request from 'request-promise-native'

import hre from 'hardhat'
const cfg = hre.network.config

const gasOverride = { /*gasLimit: 3000000*/ }

import ERC721Json from "../artifacts/contracts/ERC721min.sol/ERC721min.json"
import TuringHelperJson from '@boba/turing-hybrid-compute/artifacts/contracts/TuringHelper.sol/TuringHelper.json'
import L2GovernanceERC20Json from '@boba/contracts/artifacts/contracts/standards/L2GovernanceERC20.sol/L2GovernanceERC20.json'

let Factory__ERC721: ContractFactory
let erc721: Contract
let Factory__Helper: ContractFactory
let helper: Contract
let turingCredit: Contract
let L2BOBAToken: Contract
let addressesBOBA

const local_provider = new providers.JsonRpcProvider(cfg['url'])

const deployerPK = hre.network.config.accounts[0]
const deployerWallet = new Wallet(deployerPK, local_provider)

//console.log("network:",hre.network.name === 'boba_rinkeby')

var BOBAL2Address
var BobaTuringCreditAddress

describe("Turing NFT Random 256", function () {

  before(async () => {
    
    // Deploy your Turing Helper
    Factory__Helper = new ContractFactory(
      (TuringHelperJson.abi),
      (TuringHelperJson.bytecode),
      deployerWallet)
    
    helper = await Factory__Helper.deploy(gasOverride)
    console.log("    Turing Helper contract deployed at", helper.address)

    // Deploy your NFT contract
    Factory__ERC721 = new ContractFactory(
      (ERC721Json.abi),
      (ERC721Json.bytecode),
      deployerWallet)
    
    erc721 = await Factory__ERC721.deploy(
      "RandomERC721",
      "RER",
      helper.address, 
      gasOverride)
    console.log("    ERC721 contract deployed at", erc721.address)

    // white list your ERC721 contract in your helper
    // this is for your own security, so that only your contract can call your helper
    const tr1 = await helper.addPermittedCaller(erc721.address)
    const res1 = await tr1.wait()
    console.log("    adding your ERC721 as PermittedCaller to TuringHelper", res1.events[0].data)

    if(hre.network.name === 'boba_rinkeby') {
      BOBAL2Address = '0xF5B97a4860c1D81A1e915C40EcCB5E4a5E6b8309'
      BobaTuringCreditAddress = '0x208c3CE906cd85362bd29467819d3AcbE5FC1614'
    }
    else if(hre.network.name === 'boba_mainnet') {
      BOBAL2Address = '0xa18bF3994C0Cc6E3b63ac420308E5383f53120D7'
      BobaTuringCreditAddress = '0xF8D2f1b0292C0Eeef80D8F47661A9DaCDB4b23bf'
    } 
    else {
      const result = await request.get({ uri: 'http://127.0.0.1:8080/boba-addr.json' })
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
    console.log("    BOBA Balance in your account", bobaBalance.toString())

    // prepare to register/fund your Turing Helper 
    turingCredit = getContractFactory(
      'BobaTuringCredit',
      deployerWallet
    ).attach(BobaTuringCreditAddress)

  })

  it("Your ERC721 contract should be whitelisted", async () => {
    const tr2 = await helper.checkPermittedCaller(erc721.address, gasOverride)
    const res2 = await tr2.wait()
    const rawData = res2.events[0].data
    const result = parseInt(rawData.slice(-64), 16)
    expect(result).to.equal(1)
    console.log("    ERC721 contract whitelisted in TuringHelper (1 = yes)?", result)
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

  it("should mint an NFT with random attributes", async () => {
    let tr = await erc721.mint(deployerWallet.address, 42, gasOverride)
    const res = await tr.wait()
    expect(res).to.be.ok
    //console.log("    Turing Random =",res)
    const rawData = res.events[2].data
    const numberHexString = rawData.slice(-196, -128)
    let result = BigInt(numberHexString)
    console.log("    256 bit random number as a BigInt =",result)
    const numberHexStringA = '0x'+ rawData.slice(-128, -64)
    let resultA = parseInt(numberHexStringA, 16)
    const numberHexStringB = '0x'+ rawData.slice(-64)
    let resultB = parseInt(numberHexStringB, 16)
    let att_a = 'blue'
    if(resultA > 128) att_a = 'green'
    let att_b = 'pirate'
    if(resultB > 128) att_b = 'punk'
    console.log("    Minted an NFT with Attribute A =",resultA, "and Attribute B =", resultB)
    console.log("    Minted a", att_b, "with a", att_a, "hat")
  })

})

