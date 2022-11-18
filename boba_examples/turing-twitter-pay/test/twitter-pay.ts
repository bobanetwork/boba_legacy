// https://github.com/bobanetwork/boba/blob/develop/packages/boba/turing/test/005_lending.ts

import { Contract, ContractFactory, providers, utils, Wallet } from 'ethers'
import hre from 'hardhat'
import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import * as request from 'request-promise-native'
import TwitterPay from '../artifacts/contracts/TwitterPay.sol/TwitterPay.json'
import TuringHelperJson from '../artifacts/contracts/TuringHelper.sol/TuringHelper.json'
import L2GovernanceERC20Json from '../../../contracts/artifacts/contracts/standards/L2GovernanceERC20.sol/L2GovernanceERC20.json'
import BobaTuringCreditJson from '../../../contracts/artifacts/contracts/L2/predeploys/BobaTuringCredit.sol/BobaTuringCredit.json'
import { spawn } from 'child_process'

chai.use(solidity)

const cfg = hre.network.config
const hPort = 1235 // Port for local HTTP server

const gasOverride = { gasLimit: 8_000_000 }
const local_provider = new providers.JsonRpcProvider(cfg['url'])

const deployerPK = hre.network.config.accounts[0]
const userPK = hre.network.config.accounts[1]
const deployerWallet = new Wallet(deployerPK, local_provider)
const userWallet = new Wallet(userPK, local_provider)

let BOBAL2Address
let BobaTuringCreditAddress
let preDeployedTwitterPayAddress

let Factory__BobaTuringCredit: ContractFactory
let Factory__TwitterPay: ContractFactory
let twitter: Contract
let Factory__TuringHelper: ContractFactory
let turingHelper: Contract
let turingCredit: Contract
let L2BOBAToken: Contract
let addressesBOBA

// To run tests on pre-deployed TwitterPay (only takes effect on local L2Geth)
const useAlreadyDeployedTwitterPay = true
const USE_LOCAL_BACKEND = true
let localTuringUrl

describe('Use Boba Bubble for tipping', () => {
  //#region setup
  const loadPythonResult = (params) => {
    return new Promise((resolve, reject) => {
      const childPython = spawn('python', ['./aws/run-local-server.py', params])
      let result = ''
      childPython.stdout.on(`data`, (data) => {
        result += data.toString()
      })

      childPython.on('close', (code) => {
        resolve(result)
      })

      childPython.stderr.on('data', (err) => {
        console.error('Python error stderr: ', err.toString())
      })

      childPython.on('error', (err) => {
        console.error('Python error: ', err)
        reject(err)
      })
    })
  }

  const createServer = () => {
    const http = require('http')
    const ip = require('ip')

    const server = (module.exports = http
      .createServer(async function (req, res) {
        if (req.headers['content-type'] === 'application/json') {
          let bodyStr = ''

          req.on('data', (chunk) => {
            bodyStr += chunk.toString()
          })

          req.on('end', async () => {
            const jBody = JSON.stringify({ body: bodyStr, logs: false })
            let result

            if (req.url === '/test') {
              result = ((await loadPythonResult(jBody)) as string).replace(
                '\r\n',
                ''
              ) // load Python directly, since examples are currently in Python & to have common test-base
            } else {
              throw new Error('Invalid route: ' + req.route)
            }

            if (!result) {
              throw new Error('No server response..')
            }

            const jResp2 = {
              id: JSON.parse(bodyStr).id,
              jsonrpc: '2.0',
              result: JSON.parse(JSON.parse(result).body).result,
            }

            res.end(JSON.stringify(jResp2))
            server.emit('success', bodyStr)
          })
        } else {
          console.log('Other request:', req)
          res.writeHead(400, { 'Content-Type': 'text/plain' })
          res.end('Expected content-type: application/json')
        }
      })
      .listen(hPort))

    // Get a non-localhost IP address of the local machine, as the target for the off-chain request
    const urlBase = 'http://' + ip.address() + ':' + hPort
    localTuringUrl = urlBase + '/test'

    console.log('Created local HTTP server at', localTuringUrl)
  }

  before(async () => {
    if (USE_LOCAL_BACKEND) {
      createServer()
    }

    if (hre.network.name === 'boba_goerli') {
      BOBAL2Address = '0x4200000000000000000000000000000000000023'
      BobaTuringCreditAddress = '0x4200000000000000000000000000000000000020'
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
      preDeployedTwitterPayAddress = addressesBOBA.TwitterPay
    }

    Factory__TuringHelper = new ContractFactory(
      TuringHelperJson.abi,
      TuringHelperJson.bytecode,
      deployerWallet
    )

    Factory__TwitterPay = new ContractFactory(
      TwitterPay.abi,
      TwitterPay.bytecode,
      deployerWallet
    )

    const turingUrl = USE_LOCAL_BACKEND
      ? localTuringUrl
      : 'https://zci1n9pde8.execute-api.us-east-1.amazonaws.com/Prod/'

    if (useAlreadyDeployedTwitterPay && preDeployedTwitterPayAddress) {
      // use already deployed version (local l2geth deployer)
      console.log(
        'Using already deployed TuringHelper & TwitterPay contract: ',
        preDeployedTwitterPayAddress
      )

      twitter = await Factory__TwitterPay.attach(preDeployedTwitterPayAddress)
      console.log('Attached to pre-deployed TuringHelper.')

      turingHelper = await Factory__TuringHelper.attach(
        await twitter.turingHelper()
      )
      console.log('Attached to pre-deployed TwitterPay.')

      // Since this is a onlyOwner function, you NEED to use the local deployer PK in your .env-file
      const tx = await twitter.setConfig(turingUrl, 10)
      const configRes = await tx.wait()
      expect(configRes).to.be.ok
      console.log('Have set Turing endpoint for TwitterPay.')
    } else {
      turingHelper = await Factory__TuringHelper.deploy(gasOverride)
      console.log('Helper contract deployed as', turingHelper.address)

      twitter = await Factory__TwitterPay.deploy(
        turingUrl,
        turingHelper.address,
        10,
        gasOverride
      )

      console.log('TwitterPay contract deployed on', twitter.address)

      // whitelist the new 'lending' contract in the helper
      const tr1 = await turingHelper.addPermittedCaller(twitter.address)
      const res1 = await tr1.wait()
      console.log('addingPermittedCaller to TuringHelper', res1.events[0].data)
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
  //#endregion

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

  it('should fail for invalid tweet', async () => {
    await expect(
      twitter.estimateGas.registerBobaBubble('8392382399393', gasOverride)
    ).to.be.reverted
  })

  let bobaBubble
  it('should conduct basic twitter registration', async () => {
    const tweetId = '1523935323096506368'
    await twitter.estimateGas.registerBobaBubble(tweetId, gasOverride)
    console.log('Estimated gas..')
    const registration = await twitter.registerBobaBubble(tweetId, gasOverride)
    const res = await registration.wait()
    expect(res).to.be.ok

    const currEvent = res.events.find((e) => e.event === 'BubbleRegistered')
    const eventArgs = currEvent.args
    const eventTopics = currEvent.topics
    console.log(eventArgs.bobaBubble.toString())
    console.log(eventArgs, eventTopics, currEvent.data) // 0x626f6261356661303763363331
    const authorId = eventArgs.authorId

    bobaBubble = eventArgs.bobaBubble //convertHexToASCII(eventArgs.bobaBubble.toString().substring(2))

    expect(authorId).to.be.not.null
  })

  it('should fail for second twitter registration', async () => {
    // try to claim again
    await expect(
      twitter.estimateGas.registerBobaBubble('1523935323096506368', gasOverride)
    ).to.be.reverted
  })

  it('should transfer funds to boba bubble (yourself)', async () => {
    const amount = utils.parseEther('0.000001')
    const approveTx = await L2BOBAToken.approve(
      twitter.address,
      amount,
      gasOverride
    )
    await approveTx.wait()
    console.log('Approved..')

    await twitter.estimateGas.sendFunds(
      BOBAL2Address,
      bobaBubble,
      amount,
      gasOverride
    )
    console.log('Estimated gas')
    const registration = await twitter.sendFunds(
      BOBAL2Address,
      bobaBubble,
      amount,
      gasOverride
    )
    const res = await registration.wait()
    expect(res).to.be.ok
  })

  it('should conduct basic twitter registration (2)', async () => {
    const tweetId = '1526154825297235968'
    const twitter2 = twitter.connect(userWallet)
    await twitter2.estimateGas.registerBobaBubble(tweetId, gasOverride)
    console.log('Estimated gas..')
    const registration = await twitter2.registerBobaBubble(tweetId, gasOverride)
    const res = await registration.wait()
    expect(res).to.be.ok

    const currEvent = res.events.find((e) => e.event === 'BubbleRegistered')
    const eventArgs = currEvent.args
    const eventTopics = currEvent.topics
    console.log(eventArgs.bobaBubble.toString())
    console.log(eventArgs, eventTopics, currEvent.data) // 0x626f6261356661303763363331
    const authorId = eventArgs.authorId

    bobaBubble = eventArgs.bobaBubble //convertHexToASCII(eventArgs.bobaBubble.toString().substring(2))

    expect(authorId).to.be.not.null
  })

  it('should transfer funds to boba bubble (other)', async () => {
    const amount = utils.parseEther('0.000001')
    const approveTx = await L2BOBAToken.approve(
      twitter.address,
      amount,
      gasOverride
    )
    await approveTx.wait()
    console.log('Approved..')

    await twitter.estimateGas.sendFunds(
      BOBAL2Address,
      bobaBubble,
      amount,
      gasOverride
    )
    console.log('Estimated gas')
    const registration = await twitter.sendFunds(
      BOBAL2Address,
      bobaBubble,
      amount,
      gasOverride
    )
    const res = await registration.wait()
    expect(res).to.be.ok
  })
})
