import { ethers } from 'hardhat'
import { Contract, utils } from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'
import { getBobaContractAt } from '@boba/contracts'
import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
chai.use(solidity)

import { OptimismEnv } from './shared/env'
import { verifyStateRoots } from './shared/state-root-verification'

describe('Turing 256 Bit Random Number Test', async () => {
  let env: OptimismEnv
  let BobaTuringCredit: Contract
  let L1StandardBridge: Contract

  let L1BOBAToken: Contract
  let L2BOBAToken: Contract

  let TuringHelper: Contract
  let random: Contract

  const apiPort = 5123
  let URL: string

  before(async () => {
    env = await OptimismEnv.new()

    const BobaTuringCreditAddress = await env.addressesBOBA.BobaTuringCredit

    BobaTuringCredit = getContractFactory(
      'BobaTuringCreditAltL1',
      env.l2Wallet
    ).attach(BobaTuringCreditAddress)

    L1BOBAToken = await getBobaContractAt(
      'L1ERC20',
      env.addressesBOBA.TOKENS.BOBA.L1,
      env.l1Wallet
    )

    L2BOBAToken = await getBobaContractAt(
      'L2GovernanceERC20',
      env.addressesBOBA.TOKENS.BOBA.L2,
      env.l2Wallet
    )

    TuringHelper = await ethers.deployContract(
      'TuringHelper',
      [],
      env.l2Wallet
    )
    console.log('    Helper contract deployed at', TuringHelper.address)
    await TuringHelper.deployTransaction.wait()

    random = await ethers.deployContract(
      'HelloTuring',
      [TuringHelper.address],
      env.l2Wallet
    )
    console.log('    Test random contract deployed at', random.address)
    await random.deployTransaction.wait()

    const tr1 = await TuringHelper.addPermittedCaller(random.address)
    const res1 = await tr1.wait()
    console.log(
      '    addingPermittedCaller to TuringHelper',
      res1.events[0].data
    )

    const L1StandardBridgeAddress = await env.addressesBASE
      .Proxy__L1StandardBridge

    L1StandardBridge = getContractFactory(
      'L1StandardBridge',
      env.l1Wallet
    ).attach(L1StandardBridgeAddress)
    /* eslint-disable */
    const http = require('http')
    const ip = require("ip")
    // start local server
    const server = module.exports = http.createServer(async function (req, res) {

      if (req.headers['content-type'] === 'application/json') {

        let body = '';

        req.on('data', function (chunk) {
          body += chunk.toString()
        })

        req.on('end', async function () {
          const jsonBody = JSON.parse(body)
          const input = JSON.parse(body).params[0]
          let result

          const args = utils.defaultAbiCoder.decode(['uint256','uint256'], input)
          if (req.url === "/echo") {
            const randomPrice = Math.floor(Math.random() * 1000)
            result = input
            let response = {
              "jsonrpc": "2.0",
              "id": jsonBody.id,
              "result": result
            }
            res.end(JSON.stringify(response))
            server.emit('success', body)
          } else {
            res.writeHead(400, { 'Content-Type': 'text/plain' })
            res.end('Bad request')
          }
        });
      } else {
        console.log("Other request:", req)
        res.writeHead(400, { 'Content-Type': 'text/plain' })
        res.end('Expected content-type: application/json')
      }
    }).listen(apiPort)
    URL = `http://${ip.address()}:${apiPort}/echo`
    /* eslint-enable */
  })

  after(async () => {
    const stateRootsVerified = await verifyStateRoots()
    expect(stateRootsVerified).to.equal(true)
    console.log('Verified state roots.')
  })

  it('Should transfer BOBA to L2', async () => {
    const depositBOBAAmount = utils.parseEther('10')

    const preL1BOBABalance = await L1BOBAToken.balanceOf(env.l1Wallet.address)
    const preL2BOBABalance = await L2BOBAToken.balanceOf(env.l2Wallet.address)

    if (preL2BOBABalance.lt(depositBOBAAmount)) {
      const approveL1BOBATX = await L1BOBAToken.approve(
        L1StandardBridge.address,
        depositBOBAAmount
      )
      await approveL1BOBATX.wait()

      await env.waitForXDomainTransaction(
        L1StandardBridge.depositERC20(
          L1BOBAToken.address,
          L2BOBAToken.address,
          depositBOBAAmount,
          9999999,
          ethers.utils.formatBytes32String(new Date().getTime().toString())
        )
      )

      const postL1BOBABalance = await L1BOBAToken.balanceOf(env.l1Wallet.address)
      const postL2BOBABalance = await L2BOBAToken.balanceOf(env.l2Wallet.address)

      expect(preL1BOBABalance).to.deep.eq(
        postL1BOBABalance.add(depositBOBAAmount)
      )

      expect(preL2BOBABalance).to.deep.eq(
        postL2BOBABalance.sub(depositBOBAAmount)
      )
    }
  }).retries(3)

  it('contract should be whitelisted', async () => {
    const tr2 = await TuringHelper.checkPermittedCaller(random.address)
    const res2 = await tr2.wait()
    const rawData = res2.events[0].data
    const result = parseInt(rawData.slice(-64), 16)
    expect(result).to.equal(1)
    console.log(
      '    Test contract whitelisted in TuringHelper (1 = yes)?',
      result
    )
  }).retries(3)

  it('Should register and fund your Turing helper contract in turingCredit', async () => {
    env = await OptimismEnv.new()

    const txPrice = await BobaTuringCredit.turingPrice()
    const depositAmount = txPrice.mul(2)

    const preBalance = await BobaTuringCredit.prepaidBalance(
      TuringHelper.address
    )
    console.log('    Credit Prebalance', preBalance.toString())

    const bobaBalance = await L2BOBAToken.balanceOf(env.l2Wallet.address)
    console.log('    BOBA Balance in your account', bobaBalance.toString())

    const depositTx = await BobaTuringCredit.addBalanceTo(
      txPrice.mul(2),
      TuringHelper.address,
      { value: txPrice.mul(2) }
    )
    await depositTx.wait()

    const postBalance = await BobaTuringCredit.prepaidBalance(
      TuringHelper.address
    )

    expect(postBalance).to.be.deep.eq(preBalance.add(depositAmount))
  })

  it('should be funded for two transactions', async () => {
    const txPrice = await BobaTuringCredit.turingPrice()
    const bal = await BobaTuringCredit.prepaidBalance(
      TuringHelper.address
    )
    expect(bal).to.be.deep.eq(txPrice.mul(2))
  })

  it('should get a 256 bit random number', async () => {
    const tr = await random.getRandom()
    const res = await tr.wait()
    expect(res).to.be.ok
    const rawData = res.events[0].data
    const numberHexString = '0x' + rawData.slice(-64)
    const result = BigInt(numberHexString)
    console.log('    Turing VRF 256 =', result)
  })
    .timeout(100000)
    .retries(3)

    // The price of one transaction should have been deducted, leaving 1
    it('should now be funded for one transaction', async () => {
    const txPrice = await BobaTuringCredit.turingPrice()
    const bal = await BobaTuringCredit.prepaidBalance(
      TuringHelper.address
    )
    expect(bal).to.be.deep.eq(txPrice)
  })

  // A security patch prevents the credit balance from reaching zero
  it('should maintain a nonzero credit balance', async () => {
    const tr = await random.getRandom()
    const res = await tr.wait()
    expect(res).to.be.ok
    const bal = await BobaTuringCredit.prepaidBalance(
      TuringHelper.address
    )
    expect(bal).to.be.deep.eq(1)
  })

  it('should top up the credit balance', async () => {
    // Needed for following tests
    const txPrice = await BobaTuringCredit.turingPrice()
    const depositAmount = txPrice.mul(6)
    const depositTx = await BobaTuringCredit.addBalanceTo(
      depositAmount,
      TuringHelper.address
    )
    await depositTx.wait()
    const bal = await BobaTuringCredit.prepaidBalance(
      TuringHelper.address
    )
    expect(bal).to.be.deep.at.least(txPrice.mul(6))
  })

  // Previously a user could make more than one Turing call per Tx with
  // different inputs. All calls after the first would get a replay of
  // the first result rather than one matching their own input.
  it('should disallow mixed-input Turing calls', async () => {
    try {
      await random.estimateGas.MixedInput(URL, 123, 999)
      expect(1).to.equal(0)
    } catch (e) {
      expect(e.error.toString()).to.contain("SERVER_ERROR")
    }
  })

  // Should reject a 2nd call from a different EVM depth.
  it('should disallow nested Turing calls', async () => {
    try {
      const tr = await random.NestedRandom(1)
      expect(1).to.equal(0)
    } catch (e) {
      expect(e.error.toString()).to.contain("SERVER_ERROR")
    }
  })

  it('should allow repeated Random calls (legacy support)', async () => {
    const tr = await random.MultiRandom()
    const res = await tr.wait()
    expect(res).to.be.ok
  })

  it('should allow repeated-input Turing calls', async () => {
    await random.estimateGas.MixedInput(URL, 123, 123)
    const tr = await random.MixedInput(URL, 123, 123)
    const rcpt = await tr.wait()
    expect(rcpt).to.be.ok
  })
})
