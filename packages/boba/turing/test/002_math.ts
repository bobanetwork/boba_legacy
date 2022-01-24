import { BigNumber, Contract, ContractFactory, providers, Wallet } from 'ethers'
import { ethers } from 'hardhat'
import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
chai.use(solidity)
const abiDecoder = require('web3-eth-abi')

const fetch = require('node-fetch')
import hre from 'hardhat'
const cfg = hre.network.config
const hPort = 1235 // Port for local HTTP server
var urlStr

const gasOverride =  {
  gasLimit: 3000000 //3,000,000
}

import HelloTuringJson from "../artifacts/contracts/HelloTuring.sol/HelloTuring.json"
import TuringHelperJson from "../artifacts/contracts/TuringHelper.sol/TuringHelper.json"

let Factory__Hello: ContractFactory
let hello: Contract

const local_provider = new providers.JsonRpcProvider(cfg['url'])

// Key for autofunded L2 Hardhat test account
const helperPredeploy = '0x4200000000000000000000000000000000000022'
const testPrivateKey = '0xa267530f49f8280200edf313ee7af6b827f2a8bce2897751d06a843f644967b1'
const testWallet = new Wallet(testPrivateKey, local_provider)

let Factory__Helper: ContractFactory
let helper: Contract
const deployerPK = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
const deployerWallet = new Wallet(deployerPK, local_provider)

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

          const args = abiDecoder.decodeParameter('string', v1)

          let volume = (4/3) * 3.14159 * Math.pow(parseFloat(args['0']),3)

          res.writeHead(200, { 'Content-Type': 'application/json' });
          console.log("      (HTTP) SPHERE Returning off-chain response:", args, "->", volume * 100)

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
      testWallet)
    
    helper = await Factory__Helper.deploy()
    console.log("    Helper contract deployed as", helper.address)

    Factory__Hello = new ContractFactory(
      (HelloTuringJson.abi),
      (HelloTuringJson.bytecode),
      testWallet)
    
    hello = await Factory__Hello.deploy(helper.address, gasOverride)
    console.log("    Test contract deployed as", hello.address)
    
    // white list the new 'hello' contract in the helper
    // helper = new ethers.Contract(
    //   helperPredeploy, // predeploy address
    //   TuringHelper.abi,
    //   deployerWallet
    // )
    const tr1 = await helper.addPermittedCaller(hello.address)
    const res1 = await tr1.wait()
    console.log("    addingPermittedCaller to TuringHelper", res1.events[0].data)
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
        expect(Number(result[1])).to.equal(3351)
      }
    )

  })

  it("should support floating point volume of sphere", async () => {
    let tr = await hello.multFloatNumbers(urlStr, '2.123', gasOverride)
    const res = await tr.wait()
    expect(res).to.be.ok
    const rawData = res.events[0].data
    const result = parseInt(rawData.slice(-64), 16) / 100 
    expect(result.toFixed(5)).to.equal('33.51000')
  })

  it("should support floating point volume of sphere based on geth-cached result", async () => {
    let tr = await hello.multFloatNumbers(urlStr, '2.123', gasOverride)
    const res = await tr.wait()
    expect(res).to.be.ok
    const rawData = res.events[0].data
    const result = parseInt(rawData.slice(-64), 16) / 100 
    expect(result.toFixed(5)).to.equal('33.51000')
  })

})

