import {Contract, ContractFactory, providers, Wallet, utils} from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'
import { ethers } from 'hardhat'
import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
chai.use(solidity)
import hre from 'hardhat'
import L1StandardERC721Json from '@boba/contracts/artifacts/contracts/standards/L1StandardERC721.sol/L1StandardERC721.json'
import ERC721Json from "../artifacts/contracts/NFTMonsterV2.sol/NFTMonsterV2.json"
import L2BridgeMessengerMockJson from "../artifacts/contracts/L2BridgeMockMessenger.sol/L2BridgeMockMessenger.json"
import TuringHelperJson from "../artifacts/contracts/TuringHelper.sol/TuringHelper.json"
import L2GovernanceERC20Json from '@boba/contracts/artifacts/contracts/standards/L2GovernanceERC20.sol/L2GovernanceERC20.json'
import L2NFTBridgeJson from '@boba/contracts/artifacts/contracts/bridges/L2NFTBridge.sol/L2NFTBridge.json'

const cfg = hre.network.config

const gasOverride =  { /*gasLimit: 3000000*/ }


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
const testPrivateKeyNonOwner = process.env.PRIVATE_KEY_2 ?? '0x___________'
const testWallet = new Wallet(testPrivateKey, local_provider)
const testWalletNonOwner = new Wallet(testPrivateKeyNonOwner, local_provider)
const testWalletCounterPart = new Wallet(testPrivateKey, counterPartProvider)

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
      5,
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
      L2NFTBridgeJson.abi, // L2NFTBridgeJson.abi,
      L2NFTBridgeJson.bytecode, // L2NFTBridgeJson.bytecode,
      testWallet,
    )

    const Factory__L2BridgeMock = new ContractFactory(
      L2BridgeMessengerMockJson.abi,
      L2BridgeMessengerMockJson.bytecode,
      testWallet,
    )

    const L2BridgeMockContract = await Factory__L2BridgeMock.deploy()

    L2NFTBridgeContract = await Factory__L2NFTBridge.deploy(
      gasOverride,
    )

    const txInit = await L2NFTBridgeContract.initialize(
      L2BridgeMockContract.address, '0x1234123412341234123412341234123412341234', // NOTE: Using a dummy L1 bridge address for testing
    )
    await txInit.wait()

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

  it("should mint 3 NFTs with random attributes", async () => {
    //let tr = await erc721.mint(testWallet.address, 42, gasOverride)
    const mintingPrice = await erc721.PRICE();
    const amountNFTsToMint: number = 3
    console.log(`Trying to mint ${amountNFTsToMint} NFTs for ${ethers.utils.formatEther(mintingPrice)} ETH each.`)
    let tr = await erc721.mint(amountNFTsToMint, {gasLimit: 1000000, value: mintingPrice * amountNFTsToMint})
    let res = await tr.wait()
    expect(res).to.be.ok

    const mintedEvents = await erc721.queryFilter(erc721.filters.MintedNFT())
    expect(mintedEvents.length >= 3, "Expected at least 3 minting events.")
    const tokenIDs = [mintedEvents[0]?.args[0], mintedEvents[1]?.args[0], mintedEvents[2]?.args[0]]
    // very very low probability that all three combinations are linearly assigned when using random tokenIDs
    expect(Math.abs(tokenIDs[0] - tokenIDs[1]) > 1
      || Math.abs(tokenIDs[1] - tokenIDs[2]) > 1
      || Math.abs(tokenIDs[2] - tokenIDs[0]) > 1, "TokenIDs don't seem to be assigned randomly.")

    console.log("Turing NFT =",res)

    console.log(`Trying to mint 1 NFTs for ${ethers.utils.formatEther(mintingPrice)} ETH each, should fail as max mint per wallet reached.`)
    let trFail = await erc721.mint(1, {gasLimit: 1000000, value: mintingPrice})
    let resFail = trFail.wait()
    expect(resFail, "Max mint should be 3 NFTs per wallet").to.be.reverted


    console.log(`Trying to mint 2 NFTs with another wallet.`)
    const erc721DifferentSigner = erc721.connect(testWalletNonOwner)
    const difWalletAmount: number = 2
    let trDif = await erc721DifferentSigner.mint(difWalletAmount, {gasLimit: 1000000, value: mintingPrice * difWalletAmount})
    let resDif = await trDif.wait()
    expect(resDif).to.be.ok

    console.log(`Trying to mint 1 NFTs for ${ethers.utils.formatEther(mintingPrice)} ETH each, should fail as max supply reached.`)
    let trFail2 = await erc721DifferentSigner.mint(1, {gasLimit: 1000000, value: mintingPrice})
    let resFail2 = trFail2.wait()
    expect(resFail2, "Max supply overflow").to.be.reverted

    const bobaBalance = await L2BOBAToken.balanceOf(testWallet.address)
    console.log("BOBA Balance in your account", bobaBalance.toString())
  })

  it("should get onchain metadata", async () => {
    const event = (await erc721.queryFilter(erc721.filters.MintedNFT()))[0]
    const tokenId = event.args[0]
    console.log("TokenId: ", tokenId)

    let uri = await erc721.tokenURI(tokenId, gasOverride)
    const jsonStr = Buffer.from(uri.substring(uri.indexOf(',')+1), 'base64').toString()
    const decodedMetadata = JSON.parse(jsonStr)
    console.log("Decoded metadata = ", jsonStr)

    expect(decodedMetadata['name']).to.be.not.null;
    expect(decodedMetadata['description']).to.be.not.null;
    expect(decodedMetadata['attributes']).to.be.not.null;
    expect(decodedMetadata['attributes']?.length).to.greaterThan(0)
    expect(decodedMetadata['image_data']).to.be.not.null;
    expect(decodedMetadata['image_data']).to.contain('svg');
  })

  it("should return bridgeExtraData", async () => {
    const events = (await erc721.queryFilter(erc721.filters.MintedNFT()))
    const tokenId_1 = events[0].args[0]
    const tokenId_2 = events[1].args[0]

    const bridgeExtraData_1 = await erc721.bridgeExtraData(tokenId_1)
    console.log("Bridge Extra Data 1: ", bridgeExtraData_1)
    const bridgeExtraData_2 = await erc721.bridgeExtraData(tokenId_2)
    console.log("Bridge Extra Data 2: ", bridgeExtraData_2)

    const decoded_1 = utils.defaultAbiCoder.decode(['uint256'], bridgeExtraData_1)
    const decoded_2 = utils.defaultAbiCoder.decode(['uint256'], bridgeExtraData_2)

    expect(bridgeExtraData_2).to.be.not.equal(bridgeExtraData_1)
    expect(decoded_1).to.be.not.equal(decoded_2)
  })

  it("should support bridgeExtraData interface", async () => {
    const extraDataInterface = '0x9b9284f9'
    expect(await erc721.supportsInterface(extraDataInterface)).to.equal(true)
  })

  it("should have different metadata", async () => {

    // DebugURI
    /*const eventsDebug = (await erc721.queryFilter(erc721.filters.DebugURI()))
    for (let e of eventsDebug) {
      console.log("DEBUG-EVENTS: ", e.args)
    }*/

    const events = (await erc721.queryFilter(erc721.filters.MintedNFT()))
    const tokenId_1 = events[0].args[0]
    const tokenId_2 = events[1].args[0]
    console.log("TokenIds to compare: ", tokenId_1, tokenId_2)

    let uri1 = await erc721.tokenURI(tokenId_1, gasOverride)
    let uri2 = await erc721.tokenURI(tokenId_2, gasOverride)
    const decodedMetadata1 = JSON.parse(Buffer.from(uri1.substring(uri1.indexOf(',')+1), 'base64').toString())
    const decodedMetadata2 = JSON.parse(Buffer.from(uri2.substring(uri2.indexOf(',')+1), 'base64').toString())
    console.log("Decoded metadata for uri1 = ", decodedMetadata1)

    // console.log("GENOME: ", decodedMetadata1['attributes'][3].genome, decodedMetadata2['attributes'][3].genome)

    expect(decodedMetadata1['name']).to.be.not.null;
    expect(decodedMetadata1['description']).to.be.not.null;
    expect(decodedMetadata1['attributes']).to.be.not.null;
    expect(decodedMetadata1['attributes']?.length).to.greaterThan(0)
    expect(decodedMetadata1['image_data']).to.be.not.null;
    expect(decodedMetadata1['image_data']).to.contain('svg');
    expect(decodedMetadata2['name']).to.be.not.null;
    expect(decodedMetadata2['description']).to.be.not.null;
    expect(decodedMetadata2['attributes']).to.be.not.null;
    expect(decodedMetadata2['attributes']?.length).to.greaterThan(0)
    expect(decodedMetadata2['image_data']).to.be.not.null;
    expect(decodedMetadata2['image_data']).to.contain('svg');

    expect(decodedMetadata1['attributes'][0].value).to.be.not.equal(decodedMetadata2['attributes'][0].value, "Metadata EYE equals previous mint")
    expect(decodedMetadata1['attributes'][1].value).to.be.not.equal(decodedMetadata2['attributes'][1].value, "Metadata BODY equals previous mint")
    expect(decodedMetadata1['attributes'][2].value).to.be.not.equal(decodedMetadata2['attributes'][2].value, "Metadata EXTRA equals previous mint")
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

