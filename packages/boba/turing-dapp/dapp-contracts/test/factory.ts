// https://github.com/bobanetwork/boba/blob/develop/packages/boba/turing/test/005_lending.ts

import {BigNumber, Contract, ContractFactory, providers, Wallet, utils} from 'ethers'
import {getContractFactory} from '@eth-optimism/contracts'
import {ethers, upgrades} from 'hardhat'
import chai, {expect} from 'chai'
import {solidity} from 'ethereum-waffle'

chai.use(solidity)
const abiDecoder = require('web3-eth-abi')
import * as request from 'request-promise-native'

const fetch = require('node-fetch')
import hre from 'hardhat'

const cfg = hre.network.config
const hPort = 1235 // Port for local HTTP server
var urlStr

const gasOverride = {gasLimit: 3000000}
const local_provider = new providers.JsonRpcProvider(cfg['url'])

const deployerPK = hre.network.config.accounts[0]
const deployerWallet = new Wallet(deployerPK, local_provider)

var BOBAL2Address
var BobaTuringCreditAddress

let Factory__BobaTuringCredit: ContractFactory
let Factory__ERC20Mock: ContractFactory
let erc20Mock: Contract
let Factory__TuringHelperFactory: ContractFactory
let turingFactory: Contract
let Factory__TuringHelper: ContractFactory
let turingHelper: Contract
let turingCredit: Contract
let L2BOBAToken: Contract
let addressesBOBA

import TuringHelperFactoryJson from "../artifacts/contracts/TuringHelperFactory.sol/TuringHelperFactory.json"
import TuringHelperJson from "../artifacts/contracts/TuringHelper.sol/TuringHelper.json"
import BobaTuringCreditJson from '../../../../contracts/artifacts/contracts/L2/predeploys/BobaTuringCredit.sol/BobaTuringCredit.json'
import L2GovernanceERC20Json from '../../../../contracts/artifacts/contracts/standards/L2GovernanceERC20.sol/L2GovernanceERC20.json'

describe("Turing Helper Factory", function () {

  before(async () => {

    if (hre.network.name === 'boba_rinkeby') {
      BOBAL2Address = '0xF5B97a4860c1D81A1e915C40EcCB5E4a5E6b8309'
      BobaTuringCreditAddress = '0x208c3CE906cd85362bd29467819d3AcbE5FC1614'
    } else if (hre.network.name === 'boba_mainnet') {
      BOBAL2Address = '0x_________________'
      BobaTuringCreditAddress = '0xF8D2f1b0292C0Eeef80D8F47661A9DaCDB4b23bf'
    } else {
      const result = await request.get({uri: 'http://127.0.0.1:8080/boba-addr.json'})
      addressesBOBA = JSON.parse(result)
      BOBAL2Address = addressesBOBA.TOKENS.BOBA.L2
      BobaTuringCreditAddress = addressesBOBA.BobaTuringCredit
    }

    L2BOBAToken = new Contract(
      BOBAL2Address,
      L2GovernanceERC20Json.abi,
      deployerWallet
    )

    turingCredit = await new ContractFactory(
      (BobaTuringCreditJson.abi),
      (BobaTuringCreditJson.bytecode),
      deployerWallet).attach(BobaTuringCreditAddress)

    Factory__TuringHelper = new ContractFactory(
      (TuringHelperJson.abi),
      (TuringHelperJson.bytecode),
      deployerWallet)

    turingHelper = await upgrades.deployProxy(Factory__TuringHelper)
    console.log("    Helper contract deployed as", turingHelper.address)
    const implementationTuringHelper = await upgrades.erc1967.getImplementationAddress(turingHelper.address)
    console.log("    Implementation of Helper at", implementationTuringHelper)

    Factory__TuringHelperFactory = new ContractFactory(
      (TuringHelperFactoryJson.abi),
      (TuringHelperFactoryJson.bytecode),
      deployerWallet)

    turingFactory = await Factory__TuringHelperFactory.deploy(
      BOBAL2Address,
      implementationTuringHelper,
      BobaTuringCreditAddress,
      gasOverride
    )

    console.log("    Factory contract deployed as", turingFactory.address)
  })

  let newTuringHelper: Contract
  let permittedCaller = '0x4B45C30b8c4fAEC1c8eAaD5398F8b8e91BFbac15'
  it("should deploy new TuringHelper via Factory and have proper ownership", async () => {
    // Approva Boba before
    const bobaToDeposit = ethers.utils.parseEther('0.02')
    const approveTx = await L2BOBAToken.approve(
      turingFactory.address,
      bobaToDeposit,
    )
    await approveTx.wait()
    console.log("Approved Boba tokens for funding new TuringHelper.")

    const implTx = await turingFactory.deployMinimal([permittedCaller], bobaToDeposit, gasOverride)
    const res = await implTx.wait()
    console.log("TX confirmation: ", res)
    expect(res).to.be.ok

    const [implementation] = res.events.find(e => e.event === 'TuringHelperDeployed').args
    console.log("New Turing Helper at: " + implementation)

    newTuringHelper = Factory__TuringHelper.attach(implementation)
    const owner = await newTuringHelper.owner()
    console.log("Owner: ", owner)
    expect(owner).to.equal(deployerWallet.address)
  })

  it("contract should be whitelisted", async () => {
    const tr2 = await newTuringHelper.checkPermittedCaller(permittedCaller, gasOverride)
    const res2 = await tr2.wait()
    const rawData = res2.events[0].data
    const result = parseInt(rawData.slice(-64), 16)
    expect(result).to.equal(1)
    console.log("    Test contract whitelisted in new TuringHelper (1 = yes)?", result)
  })
})
