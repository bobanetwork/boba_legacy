import { BigNumber, Contract, ContractFactory, providers, Wallet } from 'ethers'
import { ethers } from 'hardhat'
import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
chai.use(solidity)
const abiDecoder = require('web3-eth-abi')

import hre from 'hardhat'
const cfg = hre.network.config
const hPort = 9009 // Port for local HTTP server
var urlStr
const gasOverride = {} // Can specify e.g. {gasPrice:0, gasLimit:999999} if needed

// import HelloTuringJson_1 from "../artifacts/contracts/HelloTuring.sol/HelloTuring.json"
// import HelloTuringJson_2 from "../artifacts-ovm/contracts/HelloTuring.sol/HelloTuring.json"
// import TuringHelper_1 from "../artifacts/contracts/TuringHelper.sol/TuringHelper.json"
// import TuringHelper_2 from "../artifacts-ovm/contracts/TuringHelper.sol/TuringHelper.json"
import StableSwapJSON from "../artifacts-ovm/contracts/StableSwap.sol/StableSwap.json"
import TuringHelper_2 from "../artifacts-ovm/contracts/TuringHelper.sol/TuringHelper.json"

let Factory__Stable: ContractFactory
let Stable: Contract
let Factory__Helper: ContractFactory
let helper: Contract


const local_provider = new providers.JsonRpcProvider(cfg['url'])

// Key for Hardhat test account #13 (0x1cbd3b2770909d4e10f157cabc84c7264073c9ec)
const testPrivateKey = '0x47c99abed3324a2707c28affff1267e45918ec8c3f20b8aa892e8b065d2942dd'
const testWallet = new Wallet(testPrivateKey, local_provider)
const L1 = !cfg['ovm']

describe("L2_Only", function() {
  // It is no longer feasible to mock out enough of the l2geth functionality to support
  // an L1 version of these tests.

  it("should not be run on an L1 chain", async() => {
    expect(L1).to.be.false
  })
})

describe("StableTest", function() {

  before(async () => {
    var http = require('http');
    var ip = require("ip")

    var server = module.exports = http.createServer(function (req, res) {
      if (req.headers['content-type'] === 'application/json') {
	var body = '';
	req.on('data', function (chunk) {
	  body += chunk.toString();
	});

	req.on('end', async function () {

	  var jBody = JSON.parse(body)
	  //console.log ("jBody", jBody)

    //       if (jBody.method === "hello") {
	  //   res.writeHead(200, {'Content-Type': 'application/json'});
	  //   var answer = "(UNDEFINED)"
	  //   var v3=jBody.params[0]
	  //   var v4 = abiDecoder.decodeParameter('string',v3)

	  //   switch(v4) {
    //           case 'EN_US':
		// answer = "Hello World"
		// break;
	  //     case 'EN_GB':
		// answer = "Top of the Morning"
		// break;
	  //     case 'FR':
		// answer = "Bonjour le monde"
		// break;
	  //     default:
		// answer = "(UNDEFINED)"  // FIXME This should return an error.
		// break;
	  //   }
	  //   console.log ("      (HTTP) Returning off-chain response:", v4, "->", answer)
	  //   var jResp = {
    //           "jsonrpc": "2.0",
	  //     "id": jBody.id,
	  //     "result": abiDecoder.encodeParameter('string',answer)
	  //   }
	  //   res.end(JSON.stringify(jResp))
	  //   server.emit('success', body);
    //       }
        if (jBody.method === "add2") {

	    let v1 = jBody.params[0]

	    const args = abiDecoder.decodeParameters(['uint256'], v1)
      var argNum = Number(args[0]);

      // argNum = 9009

      let sum = Math.trunc(Math.sqrt(argNum));


	    res.writeHead(200, {'Content-Type': 'application/json'});
	    console.log ("      (HTTP) Returning off-chain response:", args, "->", sum)
	    var jResp2 = {
              "jsonrpc": "2.0",
	      "id": jBody.id,
	      "result": abiDecoder.encodeParameter('uint256', sum)
	    }
	    res.end(JSON.stringify(jResp2))
	    server.emit('success', body);
	  } else {
	    res.writeHead(400, {'Content-Type': 'text/plain'});
	    res.end('Unknown method');
	  }

	});

      } else {
	res.writeHead(400, {'Content-Type': 'text/plain'});
	res.end('Expected content-type: application/json');
      };
    }).listen(hPort);

    // Get a non-localhost IP address of the local machine, as the target for the off-chain request
    urlStr = "http://" + ip.address() + ":" + hPort
    console.log("    Created local HTTP server at", urlStr)

    Factory__Helper = new ContractFactory(
      (TuringHelper_2.abi),
      (TuringHelper_2.bytecode),
      testWallet)

    helper = await Factory__Helper.deploy(urlStr, gasOverride)
    console.log("    Helper contract deployed as", helper.address, "on","L2")

    await(helper.RegisterMethod(ethers.utils.toUtf8Bytes("hello")));
    await(helper.RegisterMethod(ethers.utils.toUtf8Bytes("add2")));

    Factory__Stable = new ContractFactory(
      (StableSwapJSON.abi),
      (StableSwapJSON.bytecode),
      testWallet)

    Stable = await Factory__Stable.deploy(helper.address,1000,1000, gasOverride)
    console.log("    Test contract deployed as", Stable.address)
  })

  it("calculate square root off-chain", async() => {
    let sum = await Stable.sqrt(9009)
  })
})
