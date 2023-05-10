import { BigNumber, Contract, ContractFactory, providers, Wallet, utils } from 'ethers'
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
var urlStr2
import { getContractFactory } from '@eth-optimism/contracts'
const gasOverride =  {
  gasLimit: 11000000 //3,000,000
}

import BobaTuringCreditJson from "../../../packages/contracts/artifacts/contracts/L2/predeploys/BobaTuringCredit.sol/BobaTuringCredit.json";
import GasOracleJson from "../../../packages/contracts/artifacts/contracts/L2/predeploys/OVM_GasPriceOracle.sol/OVM_GasPriceOracle.json"
import HelloTuringJson from "../artifacts/contracts/HelloTuring.sol/HelloTuring.json"
import TuringHelper from "../artifacts/contracts/TuringHelper.sol/TuringHelper.json"
import L2GovernanceERC20Json from '@boba/contracts/artifacts/contracts/standards/L2GovernanceERC20.sol/L2GovernanceERC20.json'
import { Server } from "http";

let Factory__Hello: ContractFactory
let hello: Contract
let Factory__Helper: ContractFactory
let helper: Contract
let turingCredit: Contract
let L2BOBAToken: Contract
let addressesBOBA
const local_provider = new providers.JsonRpcProvider(cfg['url'])
var BOBAL2Address
var BobaTuringCreditAddress

// Key for autofunded L2 Hardhat test account
const testPrivateKey = '0xa267530f49f8280200edf313ee7af6b827f2a8bce2897751d06a843f644967b1'
const testWallet = new Wallet(testPrivateKey, local_provider)
const deployerPK = hre.network.config.accounts[0]
const deployerWallet = new Wallet(deployerPK, local_provider)
const oracleWallet = new Wallet("0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e", local_provider) // Hardhat 19

if (hre.network.name === "boba_local") {
  describe("Basic Math", function () {

    var server: Server

    after(async () => {
      await server.close(console.error)
    })

      before(async () => {

      var http = require('http')
      var ip = require("ip")

      server = module.exports = http.createServer(async function (req, res) {

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
            var result

            if (req.url === "/mulF") {
              const args = abiDecoder.decodeParameter('string', v1)

              let volume = (4/3) * 3.14159 * Math.pow(parseFloat(args['0']),3)

              res.writeHead(200, { 'Content-Type': 'application/json' });
              console.log("      (HTTP) SPHERE Returning off-chain response:", args, "->", volume * 100)

              result = abiDecoder.encodeParameters(['uint256'], [Math.round(volume*100)])
            } else {
              expect(req.url).to.equal("/mulA")

              const args = abiDecoder.decodeParameters(['uint256','uint256'], v1)

              let ary = []
              for(var i=0; i<args[0]; i++)
              {
                ary.push(args[1])
              }
              result = abiDecoder.encodeParameters(['uint256[]'], [ary])
            }

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
      const urlBase = "http://" + ip.address() + ":" + hPort
      urlStr = urlBase + "/mulF"
      urlStr2 = urlBase + "/mulA"

      console.log("    Created local HTTP server at", urlStr)

      Factory__Helper = new ContractFactory(
        (TuringHelper.abi),
        (TuringHelper.bytecode),
        testWallet)

      // defines the URL that will be called by HelloTuring.sol
      helper = await Factory__Helper.deploy(gasOverride)
      console.log("    Helper contract deployed as", helper.address, "on", "L2")

      Factory__Hello = new ContractFactory(
        (HelloTuringJson.abi),
        (HelloTuringJson.bytecode),
        testWallet)

      hello = await Factory__Hello.deploy(helper.address, gasOverride)

      console.log("    Test contract deployed as", hello.address)

      const tr1 = await helper.addPermittedCaller(hello.address, gasOverride)
      const res1 = await tr1.wait()
      console.log("    addingPermittedCaller to TuringHelper", res1.events[0].data)

      const result = await request.get({ uri: 'http://127.0.0.1:8080/boba-addr.json' })
      addressesBOBA = JSON.parse(result)
      BOBAL2Address = addressesBOBA.TOKENS.BOBA.L2
      BobaTuringCreditAddress = addressesBOBA.BobaTuringCredit

      L2BOBAToken = new Contract(
        BOBAL2Address,
        L2GovernanceERC20Json.abi,
        deployerWallet
      )

    // prepare to register/fund your Turing Helper
    turingCredit = new ContractFactory(
      BobaTuringCreditJson.abi,
      BobaTuringCreditJson.bytecode,
      deployerWallet
    ).attach(BobaTuringCreditAddress);

    const gasOracle = new ContractFactory(
      GasOracleJson.abi,
      GasOracleJson.bytecode,
      oracleWallet
    ).attach("0x420000000000000000000000000000000000000F");

    const oldFee = await gasOracle.l1BaseFee()
    const gasTx = await gasOracle.setL1BaseFee(4321001234)
    await gasTx.wait()
    const newFee = await gasOracle.l1BaseFee()
    console.log("Updated L1BaseFee from", oldFee.toNumber(), "to", newFee.toNumber())
  })      // prepare to register/fund your Turing Helper

    it("should return the helper address", async () => {
      let helperAddress = await hello.helperAddr();
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
          let result = abiDecoder.decodeParameters(['uint256'], json.result)
          expect(Number(result[0])).to.equal(3351)
        }
      )
    })

    it('Should fund your Turing helper contract in turingCredit', async () => {

      const depositAmount = utils.parseEther('0.5')
      const preBalance = await turingCredit.prepaidBalance(helper.address)

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

    it("should support floating point volume of sphere", async () => {
      await hello.estimateGas.multFloatNumbers(urlStr, '2.123', gasOverride)
      let tr = await hello.multFloatNumbers(urlStr, '2.123', gasOverride)
      const res = await tr.wait()
      expect(res).to.be.ok

      const ev = res.events.find(e => e.event === "MultFloatNumbers")
      const result = parseInt(ev.data.slice(-64), 16) / 100
      expect(result.toFixed(5)).to.equal('33.51000')
    })

    it("should support floating point volume of sphere based on geth-cached result", async () => {
      await hello.estimateGas.multFloatNumbers(urlStr, '2.123', gasOverride)
      let tr = await hello.multFloatNumbers(urlStr, '2.123', gasOverride)
      const res = await tr.wait()
      expect(res).to.be.ok

      const ev = res.events.find(e => e.event === "MultFloatNumbers")
      const result = parseInt(ev.data.slice(-64), 16) / 100
      expect(result.toFixed(5)).to.equal('33.51000')
    })

    it("should handle arrays", async() => {
      await hello.estimateGas.multArray(urlStr2, 48, 19, gasOverride)
      let tr = await hello.multArray(urlStr2, 48, 19, gasOverride)
      const res = await tr.wait()
      expect(res).to.be.ok

      const ev = res.events.find(e => e.event === "MultArray")
      const result = parseInt(ev.data.slice(-64), 16)
      expect(result).to.equal(912)
    })

    it("should limit the API response size", async() => {
      try {
        await hello.estimateGas.multArray(urlStr2, 2046, 67, gasOverride)
        expect(1).to.equal(0)
      } catch (e) {
        expect(e.error.toString()).to.contain("TURING: API Response too long")
      }
    })

    it("should limit the Calldata size", async() => {
      try {
        await hello.estimateGas.multArray(urlStr2, 2045, 56, gasOverride)
        expect(1).to.equal(0)
      } catch (e) {
        expect(e.error.toString()).to.contain("TURING: Calldata too long")
      }
    })

    it("should charge extra gas for L1 calldata storage", async() => {
      const g1 = (await hello.estimateGas.multArray(urlStr2, 1, 10, gasOverride)).toNumber()
      const g2 = (await hello.estimateGas.multArray(urlStr2, 101, 10, gasOverride)).toNumber()

      // Larger calldata costs more gas inside the contract itself. We need to test for
      // additional usage on top of this from the L1 calldata calculation. The exact value
      // depends on the L1 gas price so this test doesn't look for a specific number
      expect (g2 - g1).to.be.above(110000)
    })

    it("should support a large response", async() => {
      const nElem = 2038
      const g3 = (await hello.estimateGas.multArray(urlStr2, nElem, 55, gasOverride)).toNumber()
      console.log("Gas estimate:", g3)

      let tr = await hello.multArray(urlStr2, nElem, 55, gasOverride)
      const res = await tr.wait()
      expect(res).to.be.ok

      const ev = res.events.find(e => e.event === "MultArray")
      const result = parseInt(ev.data.slice(-64), 16)
      expect(result).to.equal(nElem * 55)
    })

    it("final balance", async () => {
      const postBalance = await turingCredit.prepaidBalance(
        helper.address
      )
      //expect(postBalance).to.equal( utils.parseEther('0.5'))
    })
  })
} else {
  console.log("These tests are only enabled for the boba_local network")
}

