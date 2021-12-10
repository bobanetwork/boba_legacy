import { BigNumber, Contract, ContractFactory, providers, Wallet } from 'ethers'
import { ethers } from 'hardhat'
import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
chai.use(solidity)
const abiDecoder = require('web3-eth-abi')

const fetch = require('node-fetch')
import hre from 'hardhat'
const cfg = hre.network.config
const hPort = 1234 // Port for local HTTP server
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

// Key for Hardhat test account #13 (0x1cbd3b2770909d4e10f157cabc84c7264073c9ec)
const testPrivateKey = '0xa267530f49f8280200edf313ee7af6b827f2a8bce2897751d06a843f644967b1'
//this gets automatically funded on L2 by the deployer
//deployer_1         | ✓ Funded 0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec on L2 with 5000.0 ETH
const testWallet = new Wallet(testPrivateKey, local_provider)
console.log("Remaining balance:",testWallet.getBalance())

describe("Hello World", function () {

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

          if (jBody.method === "hello") {
            
            res.writeHead(200, { 'Content-Type': 'application/json' })
            
            var answer = "(UNDEFINED)"
            var v3 = jBody.params[0]
            var v4 = abiDecoder.decodeParameter('string', v3)

            switch (v4) {
              case 'EN_US':
                answer = "Hello World"
                break;
              case 'EN_GB':
                answer = "Top of the Morning"
                break;
              case 'FR':
                answer = "Bonjour le monde"
                break;
              default:
                answer = "(UNDEFINED)"  // FIXME This should return an error.
                break;
            }
            console.log("      (HTTP) Returning off-chain response:", v4, "->", answer)
            var jResp = {
              "jsonrpc": "2.0",
              "id": jBody.id,
              "result": abiDecoder.encodeParameter('string', answer)
            }
            res.end(JSON.stringify(jResp))
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
    let TX = await helper.deployTransaction.wait()
    console.log("\n  Deployment gasUsed:", TX.gasUsed.toString())
    console.log("    Deployment cumulativeGasUsed:", TX.cumulativeGasUsed.toString())
    console.log("    Helper contract deployed as", helper.address, "on", "L2")

    let remainingBalance = await testWallet.getBalance()
    console.log("    Remaining funds:", ethers.utils.formatEther(remainingBalance), "ETH")
    
    let register = await helper.RegisterMethod(ethers.utils.toUtf8Bytes("hello"))
    TX = await register.wait()
    console.log("\n  RegisterMethod TX gasUsed:", TX.gasUsed.toString())
    console.log("    RegisterMethod TX cumulativeGasUsed:", TX.cumulativeGasUsed.toString())
    
    remainingBalance = await testWallet.getBalance()
    console.log("    Remaining funds:", ethers.utils.formatEther(remainingBalance), "ETH")

    Factory__Hello = new ContractFactory(
      (HelloTuringJson.abi),
      (HelloTuringJson.bytecode),
      testWallet)
    
    hello = await Factory__Hello.deploy(helper.address, gasOverride)
    TX = await hello.deployTransaction.wait()
    console.log("\n  Deployment gasUsed:", TX.gasUsed.toString())
    console.log("    Deployment cumulativeGasUsed:", TX.cumulativeGasUsed.toString())
    console.log("    Test contract deployed as", hello.address)

    remainingBalance = await testWallet.getBalance()
    console.log("    Remaining funds:", ethers.utils.formatEther(remainingBalance), "ETH")
  })

  it("test of local compute endpoint: should return the EN_US greeting via direct server query", async () => {

    let body = {
      method: 'hello',
      params: [abiDecoder.encodeParameter('string', 'EN_US')],
    }

    fetch(urlStr, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' }
    }).then(
      res => res.json()
    ).then(json => {
        const us_greeting = abiDecoder.decodeParameter('string', json.result)
        expect(us_greeting).to.equal("Hello World")
      }
    )

  })

  it("should return the EN_US greeting via eth_sendRawTransaction", async () => {
    let us_greeting = await hello.CustomGreetingFor("EN_US", gasOverride)
    const tr = await us_greeting.wait()
    expect(tr).to.be.ok
    const rawData = tr.events[0].data
    expect(rawData.toString()).to.contain(Buffer.from('Hello World', 'utf8').toString('hex'))
  })

  it("should allow the user to set a locale via eth_sendRawTransaction", async () => {    
    let loc1 = await hello.SetMyLocale("FR", gasOverride)
    const tr = await loc1.wait()
    expect(tr).to.be.ok
    const rawData = tr.events[0].data
    expect(rawData.toString()).to.contain(Buffer.from('Bonjour le monde', 'utf8').toString('hex'))
  })
  
  it("should return the expected personal greeting", async () => {
    let msg1 = hello.PersonalGreeting(gasOverride)
    expect(await msg1).to.equal("Bonjour le monde")
  })
  
  it("should allow the user to change their locale", async () => {
    let loc2 = await hello.SetMyLocale("EN_GB", gasOverride)
    expect(await loc2.wait()).to.be.ok
  })
  
  it("should now return a different personal greeting", async () => {
    let msg2 = hello.PersonalGreeting(gasOverride)
    expect(await msg2).to.equal("Top of the Morning")
  })
  
})

