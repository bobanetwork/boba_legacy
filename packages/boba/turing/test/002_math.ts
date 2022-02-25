import { BigNumber, Contract, ContractFactory, providers, Wallet, utils } from 'ethers'
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
var urlStr

const gasOverride =  { gasLimit: 3000000 }
const local_provider = new providers.JsonRpcProvider(cfg['url'])

const deployerPK = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
const deployerWallet = new Wallet(deployerPK, local_provider)

let Factory__Hello: ContractFactory
let hello: Contract
let Factory__Helper: ContractFactory
let helper: Contract
let turingCredit: Contract
let L2BOBAToken: Contract
let addressesBOBA

let badCallCount = 0

import HelloTuringJson from "../artifacts/contracts/HelloTuring.sol/HelloTuring.json"
import TuringHelperJson from "../artifacts/contracts/TuringHelper.sol/TuringHelper.json"
import L2GovernanceERC20Json from '@boba/contracts/artifacts/contracts/standards/L2GovernanceERC20.sol/L2GovernanceERC20.json'

describe("Basic Math", function () {

    before(async () => {

    var http = require('http')
    var ip = require("ip")

    var server = module.exports = http.createServer(async function (req, res) {

      if (req.headers['content-type'] === 'application/json') {

        var body = '';
        
        req.on('data', function (chunk) {
          body += chunk.toString()
        })

        req.on('end', async function () {

          // there are two hacks in here to deal with ABI encoder/decoder issues
          // in the real world it's less complicated

          var jBody = JSON.parse(body)
          let v1 = jBody.params[0]

          if(v1.length > 194) {
            //chop off the prefix introduced by the real call
            v1 = '0x' + v1.slice(66)
          }

          const arg = abiDecoder.decodeParameter('string', v1)

          if (arg == 4) {
                // This tests that failures are cached and not retried
                badCallCount += 1
                console.log("      (HTTP) Sending 400 error response, count=", badCallCount)
                res.writeHead(400, { 'Content-Type': 'text/plain' })
                res.end('Error: 4 is a bad number')
                return
          }

          if (arg == 5) {
                // Should get a different error message
                badCallCount += 1
                console.log("      (HTTP) Sending bad JSON-RPC response")
                res.writeHead(200, { 'Content-Type': 'application/json' })
                const badRpc = {
                  "jsonrpc": "2.0",
                  "id": jBody.id,
                  "result": "Flagrant system error."
                }
                res.end(JSON.stringify(badRpc))
                return
          }

          let volume = (4/3) * 3.14159 * Math.pow(parseFloat(arg),3)

          res.writeHead(200, { 'Content-Type': 'application/json' });

          // Optional mechanism to intentionally delay the off-chain response
          // long enough to investigate blocking/timeout issues in l2geth
          const ms_delay = 1000
          if (ms_delay > 0) {
            console.log("      (HTTP) Delaying response for:", ms_delay, "ms")
            await new Promise(resolve => setTimeout(resolve, ms_delay));
          }

          console.log("      (HTTP) SPHERE Returning off-chain response:", arg, "->", volume * 100)

          let result = abiDecoder.encodeParameters(['uint256','uint256'], [32/*start offset of the bytes*/, Math.round(volume*100)])

          var jResp2 = {
            "jsonrpc": "2.0",
            "id": jBody.id,
            "result": result
          }

          res.end(JSON.stringify(jResp2))
          server.emit('success', body)

        });

      } else {
        console.log("Other request:", req)
        res.writeHead(400, { 'Content-Type': 'text/plain' })
        res.end('Expected content-type: application/json')
      }
    }).listen(hPort)

    // Get a non-localhost IP address of the local machine, as the target for the off-chain request
    urlStr = "http://" + ip.address() + ":" + hPort
    
    console.log("    Created local HTTP server at", urlStr)
    
    Factory__Helper = new ContractFactory(
      (TuringHelperJson.abi),
      (TuringHelperJson.bytecode),
      deployerWallet)
    
    helper = await Factory__Helper.deploy()
    console.log("    Helper contract deployed as", helper.address)

    Factory__Hello = new ContractFactory(
      (HelloTuringJson.abi),
      (HelloTuringJson.bytecode),
      deployerWallet)
    
    hello = await Factory__Hello.deploy(helper.address, gasOverride)
    console.log("    Test contract deployed as", hello.address)
    
    // whitelist your contract in the helper
    const tr1 = await helper.addPermittedCaller(hello.address)
    const res1 = await tr1.wait()
    console.log("    addingPermittedCaller to TuringHelper", res1.events[0].data)

    const result = await request.get({ uri: 'http://127.0.0.1:8080/boba-addr.json' })
    addressesBOBA = JSON.parse(result)

    L2BOBAToken = new Contract(
      addressesBOBA.TOKENS.BOBA.L2,
      L2GovernanceERC20Json.abi,
      deployerWallet
    )

    // prepare to register/fund your Turing Helper 
    turingCredit = getContractFactory(
      'BobaTuringCredit',
      deployerWallet
    ).attach(addressesBOBA.BobaTuringCredit)

  })

  it("contract should be whitelisted", async () => {
    const tr2 = await helper.checkPermittedCaller(hello.address, gasOverride)
    const res2 = await tr2.wait()
    const rawData = res2.events[0].data
    const result = parseInt(rawData.slice(-64), 16)
    expect(result).to.equal(1)
    console.log("    Test contract whitelisted in TuringHelper (1 = yes)?", result)
  })

  it("should return the helper address", async () => {
    let helperAddress = await hello.helperAddr()
    console.log("    Helper at", helperAddress)
    expect(helperAddress).to.equal(helper.address)
  })

  it('Should register and fund your Turing helper contract in turingCredit', async () => {

    const depositAmount = utils.parseEther('10')

    const preBalance = await turingCredit.prepaidBalance(helper.address)
    console.log("    Credit Prebalance", preBalance.toString())

    const bobaBalance = await L2BOBAToken.balanceOf(deployerWallet.address)
    console.log("    BOBA Balance in your account", bobaBalance.toString())

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

    expect(postBalance).to.be.deep.eq(preBalance.add(depositAmount))
  })

  it("test of local compute endpoint: should do basic math via direct server query", async () => {

    let abi_payload = abiDecoder.encodeParameter('string','2.123')

    let body = {
      params: [abi_payload],
    }

    fetch(urlStr, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' }
    }).then(
      res => res.json()
    ).then(json => {
        const result = abiDecoder.decodeParameters(['uint256','uint256'], json.result)
        expect(Number(result[1])).to.equal(4008)
      }
    )
  })

  it("should support floating point volume of sphere", async () => {
    // This pre-populates the result cache, so that the real transaction can
    // complete without needing to block the sequencer thread.
    await hello.estimateGas.multFloatNumbers(urlStr, '2.123', gasOverride)

    let tr = await hello.multFloatNumbers(urlStr, '2.123', gasOverride)
    const res = await tr.wait()
    expect(res).to.be.ok
    const rawData = res.events[0].data
    const result = parseInt(rawData.slice(-64), 16) / 100 
    expect(result.toFixed(2)).to.equal('40.08')
  })
  
  it("should not re-use cache for a new Tx", async () => {
    // The nonce is now part of the cache key, so after a completed Tx the
    // next Tx should not see the previous cache entry.
    let tr = await hello.multFloatNumbers(urlStr, '2.123', gasOverride)
    await expect(tr.wait()).to.be.reverted
  })

  it("should revert on a cache miss", async () => {
    let tr = await hello.multFloatNumbers(urlStr, '3.123', gasOverride)
    await expect(tr.wait()).to.be.reverted
  })

  it("should not overwrite a non-Turing revert message", async () => {
    try {
      await hello.estimateGas.multFloatNumbers(urlStr, '0', gasOverride)
      expect(1).to.equal(0)
    } catch (err) {
      expect(err.message).to.contain("Multiply by zero error")
    }
  })

  it("should not retry a failed off-chain call", async () => {
    for (let i = 0; i < 10; i++) {
      try {
        await hello.estimateGas.multFloatNumbers(urlStr, '4', gasOverride)
        expect(1).to.equal(0)
      } catch (err) {
        expect(err.message).to.contain("TURING: Server error")
      }
    }
    expect(badCallCount).to.equal(1)
  })
  it("should get appropriate error msg for bad JSON-RPC", async () => {
    try {
      await hello.estimateGas.multFloatNumbers(urlStr, '5', gasOverride)
      expect(1).to.equal(0)
    } catch (err) {
      expect(err.message).to.contain("TURING: Could not decode server response")
    }
    expect(badCallCount).to.equal(2)
  })
})

