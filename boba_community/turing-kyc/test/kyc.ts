// https://github.com/bobanetwork/boba/blob/develop/packages/boba/turing/test/005_lending.ts

import {
  BigNumber,
  Contract,
  ContractFactory,
  providers,
  Wallet,
  utils,
} from 'ethers'
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
const hPort = 1235 // Port for local HTTP server
let urlStr

const gasOverride = { gasLimit: 3000000 }
const local_provider = new providers.JsonRpcProvider(cfg['url'])

const deployerPK = hre.network.config.accounts[0]
const deployerWallet = new Wallet(deployerPK, local_provider)

let BOBAL2Address
let BobaTuringCreditAddress

let Factory__BobaTuringCredit: ContractFactory
let Factory__ERC20Mock: ContractFactory
let erc20Mock: Contract
let Factory__KYCExample: ContractFactory
let kyc: Contract
let Factory__TuringHelper: ContractFactory
let turingHelper: Contract
let turingCredit: Contract
let L2BOBAToken: Contract
let addressesBOBA

import KYCExample from '../artifacts/contracts/KYCExample.sol/KYCExample.json'
import TuringHelperJson from '../artifacts/contracts/common/TuringHelper.sol/TuringHelper.json'
import L2GovernanceERC20Json from '../../../../contracts/artifacts/contracts/standards/L2GovernanceERC20.sol/L2GovernanceERC20.json'
import BobaTuringCreditJson from '../../../../../contracts/artifacts/contracts/L2/predeploys/BobaTuringCredit.sol/BobaTuringCredit.json'

//takes a string of hex values and coverts those to ASCII
function convertHexToASCII(hexString) {
  let stringOut = ''
  let tempAsciiCode
  hexString.match(/.{1,2}/g).map((i) => {
    tempAsciiCode = parseInt(i, 16)
    stringOut = stringOut + String.fromCharCode(tempAsciiCode)
  })
  return stringOut.substring(1)
}

describe('Verify KYC for function calls', function () {
  before(async () => {
    Factory__TuringHelper = new ContractFactory(
      TuringHelperJson.abi,
      TuringHelperJson.bytecode,
      deployerWallet
    )

    turingHelper = await Factory__TuringHelper.deploy(gasOverride)
    console.log('Helper contract deployed as', turingHelper.address)

    Factory__KYCExample = new ContractFactory(
      KYCExample.abi,
      KYCExample.bytecode,
      deployerWallet
    )

    kyc = await Factory__KYCExample.deploy(
      'https://localhost/kyc', // TODO
      turingHelper.address,
      gasOverride
    )

    console.log('KYCExample contract deployed on', kyc.address)

    // whitelist the new 'lending' contract in the helper
    const tr1 = await turingHelper.addPermittedCaller(kyc.address)
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
      kyc.address,
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
    const helperAddress = await kyc.turingHelper()
    expect(helperAddress).to.equal(turingHelper.address)
  })

  it('should call non KYC function', async () => {
    await kyc.estimateGas.openForEveryone(gasOverride)
    console.log('Estimated gas')
    const tr = await kyc.openForEveryone(gasOverride)
    console.log('Transaction sent')
    const res = await tr.wait()
    console.log('TX confirmation: ', res)
    expect(res).to.be.ok
  })

  it('should fail when calling KYC function with non KYCed wallet', async () => {
    //await kyc.estimateGas.onlyForKYCedWallets(gasOverride)
    //console.log("Estimated gas")
    const tr = await kyc.onlyForKYCedWallets(gasOverride)
    const res = tr.wait()
    console.log('Transaction sent')
    await expect(res).to.be.reverted
    console.log('TX confirmation: ', res)
  })
})
