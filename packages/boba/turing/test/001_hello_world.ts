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
const testPrivateKey = '0x47c99abed3324a2707c28affff1267e45918ec8c3f20b8aa892e8b065d2942dd'
//this gets automatically funded on L2 by the deployer
//deployer_1         | ✓ Funded 0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec on L2 with 5000.0 ETH
const testWallet = new Wallet(testPrivateKey, local_provider)

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

          if (jBody.method === "jan12") {
            
            res.writeHead(200, { 'Content-Type': 'application/json' })
            
            var answer = "(UNDEFINED)"
            var v3 = jBody.params[0]
            var v4 = abiDecoder.decodeParameter('string', v3)

            switch (v4) {
              case 'E': //so the debug info shows and extra space, but it's not actually there, so all is good
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
    //urlStr = "http://localhost:" + hPort
    
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
    console.log("    Remaining funds:", remainingBalance.toString(), "wei")
    
    //method names need to be length 5?

    let register = await helper.RegisterMethod(ethers.utils.toUtf8Bytes("jan12"))
    register = await helper.RegisterMethod(ethers.utils.toUtf8Bytes("func2"))
    register = await helper.RegisterMethod(ethers.utils.toUtf8Bytes("func3"))
    TX = await register.wait()
    console.log("\n  RegisterMethod TX gasUsed:", TX.gasUsed.toString())
    console.log("    RegisterMethod TX cumulativeGasUsed:", TX.cumulativeGasUsed.toString())
    
    remainingBalance = await testWallet.getBalance()
    console.log("    Remaining funds:", remainingBalance.toString(), "wei")

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
    console.log("    Remaining funds:", remainingBalance.toString(), "wei")
  })

  it("should correctly register one or more methods", async () => {
    let method = await helper.GetMethod(0)
    expect(method).to.equal(ethers.utils.formatBytes32String("jan12").slice(0,12))
  })

  it("should return the URL from the helper", async () => {
    let url = await helper.data_URL()
    expect(url.slice(0,32)).to.equal(ethers.utils.formatBytes32String(urlStr).slice(0,32))
  })

  it("should return the helper address", async () => {
    let helperAddress = await hello.helperAddr();
    expect(helperAddress).to.equal(helper.address)
  })

  it("test of local compute endpoint: should return the EN_US greeting via direct server query", async () => {

    let body = {
      method: 'jan12',
      params: [abiDecoder.encodeParameter('string', 'E')],
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

/*
l2geth_1           
DEBUG[12-08|19:14:20.663] TURING handler.go check for Turing request: 
err="execution reverted"                   
result="<invalid Value>" 
args="[<ethapi.CallArgs Value> <rpc.BlockNumberOrHash Value> <*map[common.Address]ethapi.account Value>]"
*/

  it("check HelloTuring.sol basics", async () => {
    let prefix = await hello.CustomGreetingMinimal("EN_US"/*, gasOverride*/)
    //console.log("prefix:",prefix)
    expect(prefix).to.equal("TURING_")
  })

  it("check HelloTuring.sol abi cycle (encode->decode) of EN_US locale", async () => {
    let encode = await hello.CustomGreetingABIcycle("EN_US"/*, gasOverride*/)
    //console.log("prefix:",prefix)
    expect(encode).to.equal("EN_US")
  })

  // it("check the EN_US greeting payload for eth_call route", async () => {
  //   let us_greeting = await hello.CustomGreetingForDryRun("EN_US"/*, gasOverride*/)
  //   console.log("us_greeting:",us_greeting)
  //   let decoded = abiDecoder.decodeParameter('string',us_greeting)
  //   console.log("decoded:",decoded)
  //   expect(us_greeting).to.equal("Hello World")
  // })

  it("should return the EN_US greeting via eth_call", async () => {
    let us_greeting = await hello.CustomGreetingFor("E")
    console.log("us_greeting:",us_greeting)
    expect(us_greeting).to.equal("Hello World")
  })

  /*

     Error: missing revert data in call exception (
     error={"reason":"processing response error","code":"SERVER_ERROR","body":"{\"jsonrpc\":\"2.0\",\"id\":98,\"error\":{\"code\":-32000,\"message\":\"execution reverted: _OMGXTURING_\\ufffdc\\u0001\\ufffdhttp://192.168.1.246:1234\\ufffdhello\\ufffd@\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000 \\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\\u0000\"}}\n","error":{"code":-32000},"requestBody":"{\"method\":\"eth_call\",\"params\":[{\"gas\":\"0x989680\",\"from\":\"0x1cbd3b2770909d4e10f157cabc84c7264073c9ec\",\"to\":\"0x09d8613732c590f1481610a0d4ec8743f9e9306a\",\"data\":\"0x530f8fcf00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000005454e5f5553000000000000000000000000000000000000000000000000000000\"},\"latest\"],\"id\":98,\"jsonrpc\":\"2.0\"}",
     "requestMethod":"POST",
     "url":"http://localhost:8545"}, 
     data="0x", 
     code=CALL_EXCEPTION, 
     version=providers/5.4.5)


  */

  // it("should allow the user to set a locale via eth_sendRawTransaction", async () => {    
  //   let loc1 = await hello.SetMyLocale("FR", gasOverride)
  //   const tr = await loc1.wait()
  //   console.log("events",tr.events)
  //   console.log("events[0].args",tr.events[0].args)
  //   console.log("events[1].args",tr.events[1].args)
  //   // expect(tr).to.be.ok
  //   //console.log("FIXME - use proper API to check that receipt contains the expected OffchainResponse event")
  //   //const rawData = tr.events[0].data
  //   //expect(rawData.toString()).to.contain("426f6e6a6f7572206c65206d6f6e6465") // "Bonjour le monde" as hex
  // })
  
  // it("should return the expected personal greeting", async () => {
  //   let msg1 = hello.PersonalGreeting(gasOverride)
  //   expect(await msg1).to.equal("Bonjour le monde")
  // })
  
  // it("should allow the user to change their locale", async () => {
  //   let loc2 = await hello.SetMyLocale("EN_GB", gasOverride)
  //   expect(await loc2.wait()).to.be.ok
  // })
  
  // it("should now return a different personal greeting", async () => {
  //   let msg2 = hello.PersonalGreeting(gasOverride)
  //   expect(await msg2).to.equal("Top of the Morning")
  // })
  
})

