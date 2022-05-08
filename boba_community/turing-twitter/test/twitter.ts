// https://github.com/bobanetwork/boba/blob/develop/packages/boba/turing/test/005_lending.ts

import { Contract, ContractFactory, providers, utils, Wallet } from 'ethers'
import hre, { ethers } from 'hardhat'
import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import * as request from 'request-promise-native'
import TwitterAuthenticatedFaucetMeta from '../artifacts/contracts/AuthenticatedFaucetMeta.sol/AuthenticatedFaucetMeta.json'
import TwitterAuthenticatedFaucet from '../artifacts/contracts/AuthenticatedFaucet.sol/AuthenticatedFaucet.json'
import TuringHelperJson from '../artifacts/contracts/TuringHelper.sol/TuringHelper.json'
import L2GovernanceERC20Json from '../../../packages/contracts/artifacts/contracts/standards/L2GovernanceERC20.sol/L2GovernanceERC20.json'
import BobaTuringCreditJson from '../../../packages/contracts/artifacts/contracts/L2/predeploys/BobaTuringCredit.sol/BobaTuringCredit.json'
import { signTypedData, SignTypedDataVersion } from '@metamask/eth-sig-util'

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

    Factory__TwitterClaimMeta = new ContractFactory(
      TwitterAuthenticatedFaucetMeta.abi,
      TwitterAuthenticatedFaucetMeta.bytecode,
      deployerWallet
    )

    twitterMeta = await Factory__TwitterClaimMeta.deploy(gasOverride)

    Factory__TwitterClaim = new ContractFactory(
      TwitterAuthenticatedFaucet.abi,
      TwitterAuthenticatedFaucet.bytecode,
      deployerWallet
    )

    console.log('TwitterMeta contract deployed on', twitterMeta.address)

    twitter = await Factory__TwitterClaim.deploy(
      twitterMeta.address,
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

    // fund gas
    const gTx = await deployerWallet.sendTransaction({
      ...gasOverride,
      to: twitterMeta.address,
      value: ethers.utils.parseEther('0.001'),
    })
    await gTx.wait()
    console.log('Funded gas..')

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
      twitter.estimateGas.sendFunds('1520370421773725698', gasOverride)
    ).to.be.reverted
  })

  it('should fail for invalid tweet', async () => {
    await expect(twitter.estimateGas.sendFunds('8392382399393', gasOverride)).to
      .be.reverted
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

    const nonce = await twitterMeta.getNonce(
      deployerWallet.address,
      gasOverride
    )
    const types = {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      ForwardRequest: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'gas', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'data', type: 'bytes' },
      ],
    }

    // The data to sign
    const value = {
      from: deployerWallet.address,
      to: deployerWallet.address,
      value: 0,
      gas: gasOverride.gasLimit,
      nonce: parseInt(nonce, 10),
      data: [],
    }

    const chainId = (await twitterMeta.provider.getNetwork()).chainId
    const SIGNING_DOMAIN_NAME = 'AuthenticatedFaucet'
    const SIGNING_DOMAIN_VERSION = '1'
    const domain = {
      name: SIGNING_DOMAIN_NAME,
      version: SIGNING_DOMAIN_VERSION,
      verifyingContract: twitterMeta.address,
      chainId,
    }
    // const signature = await deployerWallet._signTypedData(domain, types, value)
    const signature = signTypedData({
      privateKey: ethers.utils.arrayify(deployerPK) as any, // deployerPK,
      data: { primaryType: 'ForwardRequest', types, domain, message: value },
      version: SignTypedDataVersion.V4,
    })

    const originalSigner = await twitterMeta.verifyTEST(
      value,
      signature,
      gasOverride
    )
    const verifiedData = ethers.utils.verifyTypedData(
      domain,
      types,
      value,
      signature
    )
    console.log('SIGG', signature, originalSigner, verifiedData)

    console.log('Executing meta tx: ', signature, value)
    const execTx = await twitterMeta.execute(value, signature, gasOverride)
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
      twitter.estimateGas.sendFunds('1520370421773725698', gasOverride)
    ).to.be.reverted
  })
})
