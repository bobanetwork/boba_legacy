import {Contract, ContractFactory, providers, Wallet, utils, Signer} from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'
import { ethers, artifacts } from 'hardhat'
import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
chai.use(solidity)
import hre from 'hardhat'
const cfg = hre.network.config

const gasOverride =  { /*gasLimit: 3000000*/ }

import L1StandardERC721Json from '@boba/contracts/artifacts/contracts/standards/L1StandardERC721.sol/L1StandardERC721.json'
//@eth-optimism\contracts\artifacts\contracts\L2\messaging\L2CrossDomainMessenger.sol\L2CrossDomainMessenger.json"
import L2CrossDomainMessenger from '@eth-optimism/contracts/artifacts/contracts/L2/messaging/L2CrossDomainMessenger.sol/L2CrossDomainMessenger.json'
import ERC721Json from "../artifacts/contracts/NFTMonsterV2.sol/NFTMonsterV2.json"
import L2BridgeMessengerMockJson from "../artifacts/contracts/L2BridgeMockMessenger.sol/L2BridgeMockMessenger.json"
import TuringHelperJson from "../artifacts/contracts/TuringHelper.sol/TuringHelper.json"
import L2GovernanceERC20Json from '@boba/contracts/artifacts/contracts/standards/L2GovernanceERC20.sol/L2GovernanceERC20.json'
import L2NFTBridgeJson from '@boba/contracts/artifacts/contracts/bridges/L2NFTBridge.sol/L2NFTBridge.json'
import * as assert from "assert";

import {
  smockit,
  MockContract,
  smoddit,
  ModifiableContract,
} from '@eth-optimism/smock'

let Factory__ERC721: ContractFactory
let Factory__Helper: ContractFactory
let Factory__L1ERC721: ContractFactory
let Factory__L2NFTBridge: ContractFactory

let erc721: Contract
let L1erc721: Contract
let L2NFTBridgeContract: Contract;
let helper: Contract
let turingCredit: Contract
let L2BOBAToken: Contract
let addressesBOBA

const local_provider = new providers.JsonRpcProvider(cfg['url'])
const counterPartProvider = new providers.JsonRpcProvider(cfg['bridgeCounterpartUrl']) // for testing the bridging

const BOBAL2Address = '0xF5B97a4860c1D81A1e915C40EcCB5E4a5E6b8309'
const BobaTuringCreditRinkebyAddress = '0x208c3CE906cd85362bd29467819d3AcbE5FC1614'
const testPrivateKey = process.env.PRIVATE_KEY ?? '0x___________'
const testWallet = new Wallet(testPrivateKey, local_provider)
const testWalletCounterPart = new Wallet(testPrivateKey, counterPartProvider)

const mintingPrice = ethers.utils.parseEther("0.0000000001")

// convenience method for readability
const oldConsole = console.log
console.log = (message?: any, ...optionalParams: any[]) => oldConsole(`--> ${message}`, optionalParams)

describe("Turing bridgeable NFT Random 256", function () {

  before(async () => {

    // Deploy your Turing Helper
    Factory__Helper = new ContractFactory(
      (TuringHelperJson.abi),
      (TuringHelperJson.bytecode),
      testWallet)

    helper = await Factory__Helper.deploy()
    console.log("Turing Helper contract deployed at", helper.address)

    // Deploy your NFT contract
    Factory__ERC721 = new ContractFactory(
      (ERC721Json.abi),
      (ERC721Json.bytecode),
      testWallet)

    erc721 = await Factory__ERC721.deploy(
      "TuringMonster",
      "BOO",
      100,
      ['0x4B45C30b8c4fAEC1c8eAaD5398F8b8e91BFbac15'],
      helper.address,
      gasOverride)

    await erc721.startTrading(); // make NFT tradeable

    console.log("ERC721 contract deployed at", erc721.address)

    // white list your ERC721 contract in your helper
    // this is for your own security, so that only your contract can call your helper
    const tr1 = await helper.addPermittedCaller(erc721.address)
    const res1 = await tr1.wait()
    console.log("adding your ERC721 as PermittedCaller to TuringHelper", res1.events[0].data)

    L2BOBAToken = new Contract(
      BOBAL2Address,
      L2GovernanceERC20Json.abi,
      testWallet
    )

    turingCredit = getContractFactory(
      'BobaTuringCredit',
      testWallet
    ).attach(BobaTuringCreditRinkebyAddress)


    Factory__L2NFTBridge = new ContractFactory(
      L2NFTBridgeJson.abi,
      L2NFTBridgeJson.bytecode,
      testWallet,
    )

    /*L2NFTBridgeContract = new Contract(
      L2_BRIDGE_PROXY,
      L2NFTBridgeJson.abi,
      testWallet,
    )*/

    /*L2NFTBridgeContract = await upgrades.deployProxy(Factory__L2NFTBridge, []);
    await L2NFTBridgeContract.deployed();*/


    const Factory__L2BridgeMock = new ContractFactory(
      L2BridgeMessengerMockJson.abi,
      L2BridgeMessengerMockJson.bytecode,
      testWallet,
    )

    const L2BridgeMockContract = await Factory__L2BridgeMock.deploy()

    /*let l2MessengerImpersonator:Signer,alice,bob;
    ;[alice, bob, l2MessengerImpersonator] = await ethers.getSigners()*/

    /*const Factory__L2CrossDomainMessenger = new ContractFactory(
      L2CrossDomainMessenger.abi,
      L2CrossDomainMessenger.bytecode,
      testWallet,
    )*/

    /*const Mock__L2CrossDomainMessenger = await smockit(
      Factory__L2CrossDomainMessenger,
      // This allows us to use an ethers override {from: Mock__L2CrossDomainMessenger.address} to mock calls
      { address: L2BridgeMockContract.address /*await l2MessengerImpersonator.getAddress()* }
    )*/

    L2NFTBridgeContract = await Factory__L2NFTBridge.deploy(
      gasOverride,
    )

    L2NFTBridgeContract.initialize(
      L2BridgeMockContract.address, '0x1234123412341234123412341234123412341234', // NOTE: Using a dummy L1 bridge address for testing
    )

    console.log('Deployed L2 NFT bridge')

    Factory__L1ERC721 = new ContractFactory(
      (L1StandardERC721Json.abi),
      (L1StandardERC721Json.bytecode),
      testWalletCounterPart)

    L1erc721 = await Factory__L1ERC721.deploy(
      L2NFTBridgeContract.address,
      erc721.address,
      "TuringMonster",
      "BOO",
      gasOverride)

    console.log('Deployed ERC721 counterpart on L1.')

    const txRegister = await L2NFTBridgeContract.registerNFTPair(
      L1erc721.address,
      erc721.address,
      "L2", // baseNetwork
    )
    const txRegisterConf = await txRegister.wait()

    console.log('Registered NFT pair in bridge on L2.')
  })

  it('Should register and fund your Turing helper contract in turingCredit', async () => {

    const depositAmount = utils.parseEther('0.1')

    const bobaBalance = await L2BOBAToken.balanceOf(testWallet.address)
    console.log("BOBA Balance in your account", bobaBalance.toString())

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
    console.log("ERC721 contract whitelisted in TuringHelper (1 = yes)?", result)
  })

  it("should mint an NFT with random attributes", async () => {
    //let tr = await erc721.mint(testWallet.address, 42, gasOverride)
    let tr = await erc721.mint(1, {...gasOverride, value: mintingPrice})
    let res = await tr.wait()
    expect(res).to.be.ok
    console.log("Turing NFT =",res)
  })

  it("should mint an NFT with random attributes", async () => {
    //let tr = await erc721.mint(testWallet.address, 43, gasOverride)
    let tr = await erc721.mint(1, {...gasOverride, value: mintingPrice})
    let res = await tr.wait()
    expect(res).to.be.ok
    console.log("Turing NFT =",res)
  })

  it("should mint an NFT with random attributes", async () => {
    //let tr = await erc721.mint(testWallet.address, 44, gasOverride)
    let tr = await erc721.mint(1, {...gasOverride, value: mintingPrice})
    let res = await tr.wait()
    expect(res).to.be.ok
    console.log("Turing NFT =",res)
  })

  it("should get onchain metadata", async () => {
    const event = (await erc721.queryFilter(erc721.filters.MintedNFT()))[0]
    const tokenId = event.args[0]
    console.log("TokenId: ", tokenId)

    let uri = await erc721.tokenURI(tokenId, gasOverride)
    const decodedMetadata = JSON.parse(Buffer.from(uri.substring(uri.indexOf(',')+1), 'base64').toString())
    console.log("Decoded metadata = ", decodedMetadata)

    expect(decodedMetadata['name']).to.be.not.null;
    expect(decodedMetadata['description']).to.be.not.null;
    expect(decodedMetadata['attributes']).to.be.not.null;
    expect(decodedMetadata['attributes']?.length).to.greaterThan(0)
    expect(decodedMetadata['image_data']).to.be.not.null;
    expect(decodedMetadata['image_data']).to.contain('svg');
  })

  it("bridge NFT to L1", async () => {
    const event = (await erc721.queryFilter(erc721.filters.MintedNFT()))[0]
    const tokenId = event.args[0]

    const approveTx = await erc721.approve(L2NFTBridgeContract.address, tokenId)
    await approveTx.wait()

    console.log(`Approved NFT to bridge, nftL2 ${erc721.address}, bridgeL2 ${L2NFTBridgeContract.address}`)

    const tx = await L2NFTBridgeContract.withdraw(
      erc721.address,
      tokenId,
      0, //9999999, // l2 gas
      '0x1111111111111111111111111111111111111111111111111111111111111111', //ethers.utils.formatBytes32String(new Date().getTime().toString()),
    )
    await tx.wait();

    console.log("NFT bridged to L1: ", tx)

    // 7 days waiting period bc. of optimistic roll-up
  })



})

