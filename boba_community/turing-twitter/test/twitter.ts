// https://github.com/bobanetwork/boba/blob/develop/packages/boba/turing/test/005_lending.ts

import { Contract, ContractFactory, providers, utils, Wallet } from 'ethers'
import hre, { ethers } from 'hardhat'
import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import * as request from 'request-promise-native'
import TwitterAuthenticatedFaucet from '../artifacts/contracts/AuthenticatedFaucet.sol/AuthenticatedFaucet.json'
import TuringHelperJson from '../artifacts/contracts/TuringHelper.sol/TuringHelper.json'
import L2GovernanceERC20Json from '../../../packages/contracts/artifacts/contracts/standards/L2GovernanceERC20.sol/L2GovernanceERC20.json'
import BobaTuringCreditJson from '../../../packages/contracts/artifacts/contracts/L2/predeploys/BobaTuringCredit.sol/BobaTuringCredit.json'

chai.use(solidity)
const abiDecoder = require('web3-eth-abi')

const fetch = require('node-fetch')

const cfg = hre.network.config
const hPort = 1235 // Port for local HTTP server
let urlStr

const gasOverride = { gasLimit: 8_000_000 }
const local_provider = new providers.JsonRpcProvider(cfg['url'])

const deployerPK = hre.network.config.accounts[0]
const deployerWallet = new Wallet(deployerPK, local_provider)

let BOBAL2Address
let BobaTuringCreditAddress

let Factory__BobaTuringCredit: ContractFactory
let Factory__ERC20Mock: ContractFactory
let erc20Mock: Contract
let Factory__TwitterClaim: ContractFactory
let Factory__TwitterClaimMeta: ContractFactory
let twitter: Contract
let twitterMeta: Contract
let Factory__TuringHelper: ContractFactory
let turingHelper: Contract
let turingCredit: Contract
let L2BOBAToken: Contract
let addressesBOBA

describe('Verify Twitter post for testnet funds', function () {
  before(async () => {
    Factory__TuringHelper = new ContractFactory(
      TuringHelperJson.abi,
      TuringHelperJson.bytecode,
      deployerWallet
    )

    turingHelper = await Factory__TuringHelper.deploy(gasOverride)
    console.log('Helper contract deployed as', turingHelper.address)

    Factory__TwitterClaim = new ContractFactory(
      TwitterAuthenticatedFaucet.abi,
      TwitterAuthenticatedFaucet.bytecode,
      deployerWallet
    )

    twitter = await Factory__TwitterClaim.deploy(
      'https://rsqtbccfs3.execute-api.us-east-1.amazonaws.com/Stage/',
      turingHelper.address,
      10,
      ethers.utils.parseEther('0.000001'),
      gasOverride
    )

    console.log('TwitterClaim contract deployed on', twitter.address)

    // fund faucet
    const fTx = await deployerWallet.sendTransaction({
      ...gasOverride,
      to: twitter.address,
      value: ethers.utils.parseEther('0.000001'),
    })
    await fTx.wait()
    console.log('Funded faucet..')

    // whitelist the new 'lending' contract in the helper
    const tr1 = await turingHelper.addPermittedCaller(twitter.address)
    const res1 = await tr1.wait()
    console.log('addingPermittedCaller to TuringHelper', res1.events[0].data)

    if (hre.network.name === 'boba_rinkeby') {
      BOBAL2Address = '0xF5B97a4860c1D81A1e915C40EcCB5E4a5E6b8309'
      BobaTuringCreditAddress = '0x208c3CE906cd85362bd29467819d3AcbE5FC1614'
    } else if (hre.network.name === 'boba_mainnet') {
      BOBAL2Address = '0x_________________'
      BobaTuringCreditAddress = '0x___________________'
    } else {
      const result = await request.get({
        uri: 'http://127.0.0.1:8080/boba-addr.json',
      })
      addressesBOBA = JSON.parse(result)
      BOBAL2Address = addressesBOBA.TOKENS.BOBA.L2
      BobaTuringCreditAddress = addressesBOBA.BobaTuringCredit
    }

    L2BOBAToken = new Contract(
      BOBAL2Address,
      L2GovernanceERC20Json.abi,
      deployerWallet
    )

    // prepare to register/fund your Turing Helper
    Factory__BobaTuringCredit = new ContractFactory(
      BobaTuringCreditJson.abi,
      BobaTuringCreditJson.bytecode,
      deployerWallet
    )

    turingCredit = await Factory__BobaTuringCredit.attach(
      BobaTuringCreditAddress
    )
  })

  it('contract should be whitelisted', async () => {
    const tr2 = await turingHelper.checkPermittedCaller(
      twitter.address,
      gasOverride
    )
    const res2 = await tr2.wait()
    const rawData = res2.events[0].data
    const result = parseInt(rawData.slice(-64), 16)
    expect(result).to.equal(1)
    console.log(
      '    Test contract whitelisted in TuringHelper (1 = yes)?',
      result
    )
  })

  it('Should register and fund your Turing helper contract in turingCredit', async () => {
    const depositAmount = utils.parseEther('0.10')

    const approveTx = await L2BOBAToken.approve(
      turingCredit.address,
      depositAmount
    )
    await approveTx.wait()

    const depositTx = await turingCredit.addBalanceTo(
      depositAmount,
      turingHelper.address
    )
    await depositTx.wait()
  })

  it('should return the helper address', async () => {
    const helperAddress = await twitter.turingHelper()
    expect(helperAddress).to.equal(turingHelper.address)
  })

  it('should fail without funds', async () => {
    await expect(
      twitter.estimateGas.sendFunds(
        deployerWallet.address,
        '1520370421773725698',
        gasOverride
      )
    ).to.be.reverted
  })

  it('should fail for invalid tweet', async () => {
    await expect(
      twitter.estimateGas.sendFunds(
        deployerWallet.address,
        '8392382399393',
        gasOverride
      )
    ).to.be.reverted
  })

  /*
  // Still works
  it('should conduct basic twitter claim', async () => {
    const tweetId = '1522128490211991552'
    await twitter.estimateGas.sendFunds(tweetId, gasOverride)
    console.log('Estimated gas')
    const claim = await twitter.sendFunds(
      tweetId,
      gasOverride
    )
    const res = await claim.wait()
    expect(res).to.be.ok
  })*/

  it('should conduct basic twitter claim via meta transaction', async () => {
    const tweetId = '1522128490211991552'

    const nonce = parseInt(
      await twitter.getNonce(deployerWallet.address, gasOverride),
      10
    )
    const [signer] = await ethers.getSigners()
    const hashedMsg = ethers.utils.solidityKeccak256(
      ['address', 'uint'],
      [signer.address, nonce]
    )
    const messageHashBin = ethers.utils.arrayify(hashedMsg)
    const signature = await signer.signMessage(messageHashBin)

    const verifiedOnChain = await twitter.verifyMessage(hashedMsg, signature)
    console.log('SIG', verifiedOnChain) // await sigTest.connect(userWallet).isDataValid(timestamp, signature);

    console.log('Executing meta tx (backend): ', signature, nonce)
    await twitter.estimateGas.sendFundsMeta(
      deployerWallet.address,
      tweetId,
      hashedMsg,
      signature,
      gasOverride
    )

    const execTx = await twitter.sendFundsMeta(
      deployerWallet.address,
      tweetId,
      hashedMsg,
      signature,
      gasOverride
    )
    const res = await execTx.wait()

    /*await twitter.estimateGas.sendFunds(tweetId, gasOverride)
    console.log('Estimated gas')
    const claim = await twitter.sendFunds(tweetId, gasOverride)
    const res = await claim.wait()*/
    expect(res).to.be.ok
  })

  it('should fail for second twitter claim', async () => {
    // try to claim again
    await expect(
      twitter.estimateGas.sendFunds(
        deployerWallet.address,
        '1520370421773725698',
        gasOverride
      )
    ).to.be.reverted
  })
})
