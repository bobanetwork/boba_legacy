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
    await (helper.RegisterMethod(ethers.utils.toUtf8Bytes("mult2")));
    
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

  it("should support numerical datatypes", async () => {
    let tr = await hello.AddNumbers(20, 22, gasOverride)
    const sum = await tr.wait()
    expect(sum).to.be.ok
    const rawData = sum.events[0].data
    expect(rawData.toString()).to.contain(Number(42).toString(16))
  })
  it("should support numerical multiplication", async () => {
    let tr = await hello.MultNumbers(5, 5, gasOverride)
    const prod = await tr.wait()
    expect(prod).to.be.ok
    const rawData = prod.events[0].data
    expect(rawData.toString()).to.contain(Number(25).toString(16))
  })

})

