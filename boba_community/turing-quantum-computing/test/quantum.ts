import { Contract, ContractFactory, providers, Wallet, utils } from 'ethers'
import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'

chai.use(solidity)
import * as request from 'request-promise-native'

import hre from 'hardhat'

const cfg = hre.network.config
let urlStr

const gasOverride = { gasLimit: 3000000 }
const local_provider = new providers.JsonRpcProvider(cfg['url'])

const deployerPK = hre.network.config.accounts[0]
const deployerWallet = new Wallet(deployerPK, local_provider)

let BOBAL2Address
let BobaTuringCreditAddress

let Factory__Quantum: ContractFactory
let quantum: Contract
let Factory__Helper: ContractFactory
let helper: Contract
let turingCredit: Contract
let L2BOBAToken: Contract
let addressesBOBA

import TalkWithQuantumComputersJson from '../artifacts/contracts/TalkWithQuantumComputers.sol/TalkWithQuantumComputers.json'
import TuringHelperJson from '../artifacts/contracts/TuringHelper.sol/TuringHelper.json'
import L2GovernanceERC20Json from '../../../../boba/packages/boba/contracts/artifacts/contracts/standards/L2GovernanceERC20.sol/L2GovernanceERC20.json'
import { getContractFactory } from '@eth-optimism/contracts'

describe('Get true random number from quantum computer', () => {
  before(async () => {
    urlStr = 'https://0000.execute-api.us-east-1.amazonaws.com/Prod/' // limitation is 64 bytes for an url
    console.log('    URL set to', urlStr)

    Factory__Helper = new ContractFactory(
      TuringHelperJson.abi,
      TuringHelperJson.bytecode,
      deployerWallet
    )

    helper = await Factory__Helper.deploy(gasOverride)
    console.log('    Helper contract deployed as', helper.address)

    Factory__Quantum = new ContractFactory(
      TalkWithQuantumComputersJson.abi,
      TalkWithQuantumComputersJson.bytecode,
      deployerWallet
    )

    quantum = await Factory__Quantum.deploy(helper.address, gasOverride)

    console.log('    Quantum contract deployed as', quantum.address)

    // whitelist the new 'lending' contract in the helper
    const tr1 = await helper.addPermittedCaller(quantum.address)
    const res1 = await tr1.wait()
    console.log(
      '    addingPermittedCaller to TuringHelper',
      res1.events[0].data
    )

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
    turingCredit = getContractFactory(
      'BobaTuringCredit',
      deployerWallet
    ).attach(BobaTuringCreditAddress)
  })

  it('contract should be whitelisted', async () => {
    const tr2 = await helper.checkPermittedCaller(quantum.address, gasOverride)
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
    // 0.1 Boba per Turing call
    const depositAmount = utils.parseEther('0.20')

    const approveTx = await L2BOBAToken.approve(
      turingCredit.address,
      depositAmount
    )
    await approveTx.wait()

    // Add Boba tokens to TuringCredit & assign it to our TuringHelper
    const depositTx = await turingCredit.addBalanceTo(
      depositAmount,
      helper.address
    )
    await depositTx.wait()
  })

  it('should return the helper address', async () => {
    const helperAddress = await quantum.helperAddr()
    expect(helperAddress).to.equal(helper.address)
  })

  it('should get true random number from quantum computer', async () => {
    await quantum.estimateGas.getRealRandomNumberFromQuantumComputer(
      urlStr,
      'ibmq_qasm_simulator',
      gasOverride
    ) // necessary when calling offChain, Turing specific implementation
    const tr = await quantum.getRealRandomNumberFromQuantumComputer(
      urlStr,
      'ibmq_qasm_simulator',
      gasOverride
    )
    const res = await tr.wait()
    expect(res).to.be.ok
    let rawData = res.events[2].data //the event returns
    rawData = rawData.slice(2)

    const numberHexString = rawData.slice(128, 192)
    const result = parseInt(numberHexString, 16)
    console.log('    Quantum computer generated random number is', result)
  })
})
