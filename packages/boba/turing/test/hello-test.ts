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
const gasOverride = {} // Can specify e.g. {gasPrice:0, gasLimit:999999} if needed
// import HelloTuringJson_1 from "../artifacts/contracts/HelloTuring.sol/HelloTuring.json"
import HelloTuringJson_2 from "../artifacts-ovm/contracts/HelloTuring.sol/HelloTuring.json"
// import TuringHelper_1 from "../artifacts/contracts/TuringHelper.sol/TuringHelper.json"
import TuringHelper_2 from "../artifacts-ovm/contracts/TuringHelper.sol/TuringHelper.json"
let Factory__Hello: ContractFactory
let hello: Contract
let Factory__Helper: ContractFactory
let helper: Contract
const local_provider = new providers.JsonRpcProvider(cfg['url'])

// Key for Hardhat test account #13 (0x1cbd3b2770909d4e10f157cabc84c7264073c9ec)
const testPrivateKey = '0x47c99abed3324a2707c28affff1267e45918ec8c3f20b8aa892e8b065d2942dd'
const testWallet = new Wallet(testPrivateKey, local_provider)
const L1 = !cfg['ovm']

describe("L2_Only", function () {
  // It is no longer feasible to mock out enough of the l2geth functionality to support
  // an L1 version of these tests.
  it("should not be run on an L1 chain", async () => {
    expect(L1).to.be.false
  })
})

describe("HelloTest", function () {

  before(async () => {
    var http = require('http');
    var ip = require("ip")

    var server = module.exports = http.createServer(async function (req, res) {
      if (req.headers['content-type'] === 'application/json') {
        var body = '';
        req.on('data', function (chunk) {
          body += chunk.toString();
        });

        req.on('end', async function () {

          var jBody = JSON.parse(body)
          //console.log ("jBody", jBody)

          if (jBody.method === "hello") {
            res.writeHead(200, { 'Content-Type': 'application/json' });
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
          } else if (jBody.method === "add2") {

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
          } else if (jBody.method == "catOrDog") {
            let v1 = jBody.params[0]

            const args = abiDecoder.decodeParameters(['string'], v1);

            let classification = await (async () => {
              let response = await fetch('http://127.0.0.1:8123/api', {method:'POST', body:JSON.stringify({"url":args['0']})})
              response = await response.json();
              return response.class
            })();

            res.writeHead(200, { 'Content-Type': 'application/json' });
            console.log("      (HTTP) Returning off-chain response:", args['0'], "->", classification);
            var jResp2 = {
              "jsonrpc": "2.0",
              "id": jBody.id,
              "result": abiDecoder.encodeParameter('string', classification)
            }
            res.end(JSON.stringify(jResp2));
            server.emit('success', body);
          }
          else {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Unknown method');
          }

        });

      } else {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Expected content-type: application/json');
      }
    }).listen(hPort);
    // Get a non-localhost IP address of the local machine, as the target for the off-chain request
    urlStr = "http://" + ip.address() + ":" + hPort
    console.log("    Created local HTTP server at", urlStr)
    Factory__Helper = new ContractFactory(
      (TuringHelper_2.abi),
      (TuringHelper_2.bytecode),
      testWallet)
    helper = await Factory__Helper.deploy(urlStr, gasOverride)
    
    console.log("    Helper contract deployed as", helper.address, "on", "L2")
    
    await (helper.RegisterMethod(ethers.utils.toUtf8Bytes("hello")));
    await (helper.RegisterMethod(ethers.utils.toUtf8Bytes("add2")));
    await (helper.RegisterMethod(ethers.utils.toUtf8Bytes("mult2")));
    await (helper.RegisterMethod(ethers.utils.toUtf8Bytes("catOrDog")));
    
    Factory__Hello = new ContractFactory(
      (HelloTuringJson_2.abi),
      (HelloTuringJson_2.bytecode),
      testWallet)
    
    hello = await Factory__Hello.deploy(helper.address, gasOverride)
    
    console.log("    Test contract deployed as", hello.address)
  })

  it("should return the EN_US greeting via eth_call", async () => {
    let us_greeting = hello.CustomGreetingFor("EN_US", gasOverride)
    expect(await us_greeting).to.equal("Hello World")
  })
  it("should allow the user to set a locale via eth_sendRawTransaction", async () => {
    let loc1 = await hello.SetMyLocale("FR", gasOverride)

    const tr = await loc1.wait()
    expect(tr).to.be.ok
    console.log("FIXME - use proper API to check that receipt contains the expected OffchainRepsonse event")
    const rawData = tr.events[1].data
    expect(rawData.toString()).to.contain("426f6e6a6f7572206c65206d6f6e6465") // "Bonjour le monde" as hex
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
  it("should support numerical datatypes", async () => {
    let sum = hello.AddNumbers(20, 22)
    expect(await sum).to.equal(42)
  })
  it("should support numerical multiplication", async () => {
    let product = hello.MultNumbers(5, 5);
    expect(await product).to.equal(25);
  })
  // The "classifier" test is broken, relying on a local service which is not launched by the test harness.
  it.skip("should correctly classfify the image of dog or cat", async () => {
    let dogClassification = hello.isCatOrDog("https://i.insider.com/5484d9d1eab8ea3017b17e29?width=1300&format=jpeg&auto=webp");
    expect(await dogClassification).to.equal('dog');

    let catClassification = hello.isCatOrDog("https://c.files.bbci.co.uk/12A9B/production/_111434467_gettyimages-1143489763.jpg");
    expect(await catClassification).to.equal('cat');
  })
})

