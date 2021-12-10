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
import TuringHelper from "../artifacts/contracts/TuringHelper.sol/TuringHelper.json"

let Factory__Hello: ContractFactory
let hello: Contract
let Factory__Helper: ContractFactory
let helper: Contract

const local_provider = new providers.JsonRpcProvider(cfg['url'])

// Key for autofunded L2 Hardhat test account
const testPrivateKey = '0xa267530f49f8280200edf313ee7af6b827f2a8bce2897751d06a843f644967b1'
const testWallet = new Wallet(testPrivateKey, local_provider)

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

          var jBody = JSON.parse(body)
 
          if (jBody.method === "add2") {

            let v1 = jBody.params[0]

            const args = abiDecoder.decodeParameters(['uint256', 'uint256'], v1)

            let sum = Number(args['0']) + Number(args['1'])

            res.writeHead(200, { 'Content-Type': 'application/json' });
            console.log("      (HTTP) Returning off-chain response:", args, "->", sum)
            var jResp2 = {
              "jsonrpc": "2.0",
              "id": jBody.id,
              "result": abiDecoder.encodeParameter('uint256', sum)
            }
            res.end(JSON.stringify(jResp2))
            server.emit('success', body);
          } else if (jBody.method === "mult2") {
            let v1 = jBody.params[0]

            const args = abiDecoder.decodeParameters(['uint256', 'uint256'], v1)

            let product = Number(args['0']) * Number(args['1'])

            res.writeHead(200, { 'Content-Type': 'application/json' });
            console.log("      (HTTP) Returning off-chain response:", args, "->", product);
            var jResp2 = {
              "jsonrpc": "2.0",
              "id": jBody.id,
              "result": abiDecoder.encodeParameter('uint256', product)
            }
            res.end(JSON.stringify(jResp2));
            server.emit('success', body);
          } 
          else if (jBody.method === "float") {
            let v1 = jBody.params[0]

            const args = abiDecoder.decodeParameters(['string', 'string'], v1)

            let product = parseFloat(args['0']) / parseFloat(args['1'])

            res.writeHead(200, { 'Content-Type': 'application/json' });
            console.log("      (HTTP) Returning off-chain response:", args, "->", product.toString())
            var jResp2 = {
              "jsonrpc": "2.0",
              "id": jBody.id,
              "result": abiDecoder.encodeParameter('string', product.toString())
            }
            res.end(JSON.stringify(jResp2));
            server.emit('success', body);
          } 
          else if (jBody.method === "sphere") {
            let v1 = jBody.params[0]

            const args = abiDecoder.decodeParameters(['string', 'string'], v1)

            let volume = (4/3) * parseFloat(args['0']) * Math.pow(parseFloat(args['1']),3)

            res.writeHead(200, { 'Content-Type': 'application/json' });
            console.log("      (HTTP) Returning off-chain response:", args, "->", volume.toString())
            var jResp2 = {
              "jsonrpc": "2.0",
              "id": jBody.id,
              "result": abiDecoder.encodeParameter('string', volume.toString())
            }
            res.end(JSON.stringify(jResp2));
            server.emit('success', body);
          } 
          else {
            res.writeHead(400, { 'Content-Type': 'text/plain' })
            res.end('Unknown method')
          }

        });

      } else {
        res.writeHead(400, { 'Content-Type': 'text/plain' })
        res.end('Expected content-type: application/json')
      }
    }).listen(hPort)

    // Get a non-localhost IP address of the local machine, as the target for the off-chain request
    urlStr = "http://" + ip.address() + ":" + hPort
    
    console.log("    Created local HTTP server at", urlStr)
    
    Factory__Helper = new ContractFactory(
      (TuringHelper.abi),
      (TuringHelper.bytecode),
      testWallet)

    // defines the URL that will be called by HelloTuring.sol
    helper = await Factory__Helper.deploy(urlStr, gasOverride)
    console.log("    Helper contract deployed as", helper.address, "on", "L2")
    
    await (helper.RegisterMethod(ethers.utils.toUtf8Bytes("add2")))
    await (helper.RegisterMethod(ethers.utils.toUtf8Bytes("mult2")))
    await (helper.RegisterMethod(ethers.utils.toUtf8Bytes("float")))
    await (helper.RegisterMethod(ethers.utils.toUtf8Bytes("sphere")))
    
    Factory__Hello = new ContractFactory(
      (HelloTuringJson.abi),
      (HelloTuringJson.bytecode),
      testWallet)
    
    hello = await Factory__Hello.deploy(helper.address, gasOverride)
    
    console.log("    Test contract deployed as", hello.address)
  })

  it("should return the URL from the helper", async () => {
    let url = await helper.data_URL()
    expect(url.slice(0,32)).to.equal(ethers.utils.formatBytes32String(urlStr).slice(0,32))
  })

  it("should return the helper address", async () => {
    let helperAddress = await hello.helperAddr();
    expect(helperAddress).to.equal(helper.address)
  })

  it("test of local compute endpoint: should do basic math via direct server query", async () => {

    let body = {
      method: 'mult2',
      params: [abiDecoder.encodeParameters(['uint256','uint256'],['6', '6'])],
    }

    fetch(urlStr, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' }
    }).then(
      res => res.json()
    ).then(json => {
        const result = abiDecoder.decodeParameter('uint256', json.result)
        expect(result).to.equal('36')
      }
    )

  })

  it("should support numerical datatypes and addition", async () => {
    let tr = await hello.AddNumbers(20, 22, gasOverride)
    const res = await tr.wait()
    expect(res).to.be.ok
    const rawData = res.events[0].data 
    const numberHexString = rawData.slice(-64)
    const result = parseInt(numberHexString, 16)
    console.log("      result of 20 + 22 =",result)
    expect(result).to.equal(20+22)
  })
  it("should support integer multiplication", async () => {
    let tr = await hello.MultNumbers(5, 5, gasOverride)
    const res = await tr.wait()
    expect(res).to.be.ok
    const rawData = res.events[0].data 
    const numberHexString = rawData.slice(-64)
    const result = parseInt(numberHexString, 16)
    console.log("      result of 5*5 =",result)
    expect(result).to.equal(5*5)
  })
  it("should support floating point division", async () => {
    let tr = await hello.MultFloatNumbers("42.165", "3.14159", 2/*method*/, gasOverride)
    const res = await tr.wait()
    expect(res).to.be.ok
    const rawData = res.events[0].data
    const numberHexString = rawData.slice(-64)
    const numberString = Buffer.from(numberHexString, 'hex').toString()
    const result = parseFloat(numberString)
    console.log("      result of 42.165 / 3.14159 =",result)
    expect(result.toFixed(3)).to.equal('13.422')
  })
  it("should support floating point volume of sphere", async () => {
    let tr = await hello.MultFloatNumbers("3.14159", "2.00", 3/*method*/, gasOverride)
    const res = await tr.wait()
    expect(res).to.be.ok
    const rawData = res.events[0].data
    const numberHexString = rawData.slice(-64)
    const numberString = Buffer.from(numberHexString, 'hex').toString()
    const result = parseFloat(numberString)
    console.log("      result of 4/3 * Pi * r^3 =",result)
    expect(result.toFixed(5)).to.equal('33.51029')
  })

})

