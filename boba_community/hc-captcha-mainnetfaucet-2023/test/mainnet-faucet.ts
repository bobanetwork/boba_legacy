// https://github.com/bobanetwork/boba/blob/develop/packages/boba/turing/test/005_lending.ts

import {Contract, ContractFactory, providers, utils, Wallet} from "ethers";
import hre, {ethers} from "hardhat";
import chai, {expect} from "chai";
import {solidity} from "ethereum-waffle";
import * as request from "request-promise-native";
import MainnetFaucet from "../artifacts/contracts/BobaMainnetFaucet.sol/BobaMainnetFaucet.json";
import HCHelperJson from "../artifacts/contracts/TuringHelper.sol/TuringHelper.json";
import L2GovernanceERC20Json
  from "../../../packages/contracts/artifacts/contracts/standards/L2GovernanceERC20.sol/L2GovernanceERC20.json";
import BobaTuringCreditJson
  from "../../../packages/contracts/artifacts/contracts/L2/predeploys/BobaTuringCredit.sol/BobaTuringCredit.json";
import http from "http";
import {spawn} from "child_process";

chai.use(solidity);
const abiDecoder = require("web3-eth-abi");

const fetch = require("node-fetch");

const cfg = hre.network.config;
const hPortGet = 1235; // Port for local HTTP server
const hPortVerify = 1236; // Port for local HTTP server
let urlStr;

const gasOverride = {gasLimit: 8_000_000};
const local_provider = new providers.JsonRpcProvider(cfg["url"]);

const deployerPK = hre.network.config.accounts[0];
const deployerWallet = new Wallet(deployerPK, local_provider);

let BOBAL2Address;
let BobaHcCreditAddress;

let Factory__BobaHcCredit: ContractFactory;
let Factory__MainnetFaucet: ContractFactory;
let mainnetFaucet: Contract;
let Factory__HcHelper: ContractFactory;
let hcHelper: Contract;
let hcCredit: Contract;
let L2BOBAToken: Contract;
let addressesBOBA;
const ethClaimAmount = ethers.utils.parseEther("0.0001")
const depositAmount = utils.parseEther("1"); // for HCCredit

const USE_LOCAL_BACKEND = true
let localTuringUrl: string;
let getCaptchaUrl: string;
const publicTuringUrl = 'https://zci1n9pde8.execute-api.us-east-1.amazonaws.com/Prod/' // TODO

enum LocalEndpoint {
  getCaptcha = "getCAPTCHA",
  verifyCaptcha = "verifyCAPTCHA",
}

const loadPythonResult = (params, endpoint: LocalEndpoint) => {
  return new Promise((resolve, reject) => {
    const childPython = spawn('python3', [`./api/run-local-server-${endpoint}.py`, params])
    let result = ''
    childPython.stdout.on(`data`, (data) => {
      result += data.toString()
    })

    childPython.on('close', (code) => {
      resolve(result)
    })

    childPython.stderr.on('data', (err) => {
      console.error('Python error stderr: ', err.toString())
    })

    childPython.on('error', (err) => {
      console.error('Python error: ', err)
      reject(err)
    })
  })
}

const createServer = (endpoint: LocalEndpoint) => {
  const http = require('http')
  const ip = require('ip')
  const port = endpoint === LocalEndpoint.getCaptcha ? hPortGet : hPortVerify

  const server = (module.exports = http
    .createServer(async function (req, res) {
      if (endpoint === LocalEndpoint.getCaptcha || (endpoint === LocalEndpoint.verifyCaptcha && req.headers['content-type'] === 'application/json')) {
        let bodyStr = ''

        req.on('data', (chunk) => {
          bodyStr += chunk.toString()
        })

        req.on('end', async () => {

          const jBody = JSON.stringify({body: bodyStr, logs: false})
          let result

          result = ((await loadPythonResult(jBody, endpoint)) as string).replace(
            '\r\n',
            ''
          ) // load Python directly, since examples are currently in Python & to have common test-base

          if (!result) {
            throw new Error('No server response..')
          }

          const jResp2 = {
            id: JSON.parse(bodyStr).id,
            jsonrpc: '2.0',
            result: JSON.parse(JSON.parse(result).body).result,
          }

          res.end(JSON.stringify(jResp2))
          server.emit('success', bodyStr)
        })
      } else {
        console.log('Other request:', req)
        res.writeHead(400, {'Content-Type': 'text/plain'})
        res.end('Expected content-type: application/json')
      }
    })
    .listen(port))

  // Get a non-localhost IP address of the local machine, as the target for the off-chain request
  const urlBase = 'http://' + ip.address() + ':' + port
  const endpointUrl = urlBase + '/' + endpoint

  if (endpoint === LocalEndpoint.getCaptcha) {
    getCaptchaUrl = endpointUrl
  } else {
    localTuringUrl = endpointUrl
    console.log("Set local turing url: ", localTuringUrl)
  }

  console.log('Created local HTTP server at', localTuringUrl)
}

describe("Get gas from mainnet faucet", function () {
  before(async () => {

    if (USE_LOCAL_BACKEND) {
      createServer(LocalEndpoint.getCaptcha)
      createServer(LocalEndpoint.verifyCaptcha)
    }

    if (hre.network.name === "boba_goerli") {
      BOBAL2Address = '0x4200000000000000000000000000000000000023'
      BobaHcCreditAddress = '0x4200000000000000000000000000000000000020'
    } else if (hre.network.name === "boba_mainnet") {
      BOBAL2Address = "0x_________________";
      BobaHcCreditAddress = "0x___________________";
    } else {
      const result = await request.get({
        uri: "http://127.0.0.1:8080/boba-addr.json"
      });
      addressesBOBA = JSON.parse(result);
      BOBAL2Address = addressesBOBA.TOKENS.BOBA.L2;
      BobaHcCreditAddress = addressesBOBA.BobaTuringCredit;
    }

    Factory__HcHelper = new ContractFactory(
      HCHelperJson.abi,
      HCHelperJson.bytecode,
      deployerWallet
    );

    hcHelper = await Factory__HcHelper.deploy(gasOverride);
    console.log("Helper contract deployed as", hcHelper.address);

    Factory__MainnetFaucet = new ContractFactory(
      MainnetFaucet.abi,
      MainnetFaucet.bytecode,
      deployerWallet
    );

    const turingUrl = USE_LOCAL_BACKEND
      ? localTuringUrl
      : publicTuringUrl

    mainnetFaucet = await Factory__MainnetFaucet.deploy(
      hcHelper.address,
      turingUrl,
      43200, // 12h
      ethClaimAmount,
      gasOverride
    );

    console.log("MainnetFaucet contract deployed on", mainnetFaucet.address);

    L2BOBAToken = new Contract(
      BOBAL2Address,
      L2GovernanceERC20Json.abi,
      deployerWallet
    );

    // fund faucet
    const fTx = await deployerWallet.sendTransaction({
      ...gasOverride,
      to: mainnetFaucet.address,
      value: ethClaimAmount
    });
    await fTx.wait();
    console.log("Funded faucet with ETH..");

    // whitelist the new 'lending' contract in the helper
    const tr1 = await hcHelper.addPermittedCaller(mainnetFaucet.address);
    const res1 = await tr1.wait();
    console.log("addingPermittedCaller to HCHelper", res1.events[0].data);


    // prepare to register/fund your Turing Helper
    Factory__BobaHcCredit = new ContractFactory(
      BobaTuringCreditJson.abi,
      BobaTuringCreditJson.bytecode,
      deployerWallet
    );

    hcCredit = await Factory__BobaHcCredit.attach(
      BobaHcCreditAddress
    );
  });

  it("contract should be whitelisted", async () => {
    const tr2 = await hcHelper.checkPermittedCaller(
      mainnetFaucet.address,
      gasOverride
    );
    const res2 = await tr2.wait();
    const rawData = res2.events[0].data;
    const result = parseInt(rawData.slice(-64), 16);
    expect(result).to.equal(1);
    console.log(
      "    Test contract whitelisted in HCHelper (1 = yes)?",
      result
    );
  });

  it("Should register and fund your HC helper contract in hcCredit", async () => {

    const approveTx = await L2BOBAToken.approve(
      hcCredit.address,
      depositAmount
    );
    await approveTx.wait();

    const depositTx = await hcCredit.addBalanceTo(
      depositAmount,
      hcHelper.address
    );
    await depositTx.wait();
  });

  it("should return the helper address", async () => {
    const helperAddress = await mainnetFaucet.hcHelper();
    expect(helperAddress).to.equal(hcHelper.address);
  });

  it("should get native faucet", async () => {
    const captcha = await (await fetch(getCaptchaUrl, {
      body: JSON.stringify({}), method: 'POST', headers: {
        "content-type": "application/json"
      }
    })).json()

    const preUserBalance = await deployerWallet.getBalance()
    const preContractBalance = await ethers.provider.getBalance(mainnetFaucet.address)

    // NOTE: imageStr is string inputted by end user based on captcha (base64 image)
    await mainnetFaucet.estimateGas.getNativeFaucet(captcha.result.uuid, captcha.result.imageStr)
    const res = await mainnetFaucet.getNativeFaucet(captcha.result.uuid, captcha.result.imageStr);
    await res.wait();

    const postUserBalance = await deployerWallet.getBalance()
    const postContractBalance = await ethers.provider.getBalance(mainnetFaucet.address)

    expect(preUserBalance).to.be.lt(postUserBalance, "User should have received testnet funds")
    expect(preContractBalance).to.be.gt(postContractBalance, "Faucet should have issued funds")
  });

  it("native faucet should fail when image string is invalid", async () => {
    const captcha = await (await fetch(getCaptchaUrl, {
      body: JSON.stringify({}), method: 'POST', headers: {
        "content-type": "application/json"
      }
    })).json()

    const preUserBalance = await deployerWallet.getBalance()
    const preContractBalance = await ethers.provider.getBalance(mainnetFaucet.address)

    // NOTE: imageStr is string inputted by end user based on captcha (base64 image)
    try {
      await mainnetFaucet.estimateGas.getNativeFaucet(captcha.result.uuid, captcha.result.imageStr + "2")
      const res = await mainnetFaucet.getNativeFaucet(captcha.result.uuid, captcha.result.imageStr + "2");
      await res.wait();
    } catch {}

    const postUserBalance = await deployerWallet.getBalance()
    const postContractBalance = await ethers.provider.getBalance(mainnetFaucet.address)

    expect(preUserBalance).to.be.eq(postUserBalance, "User should have not received testnet funds")
    expect(preContractBalance).to.be.eq(postContractBalance, "Faucet should have all original funds")
  });


  it("native faucet should fail when uuid has not been issued", async () => {
    const captcha = await (await fetch(getCaptchaUrl, {
      body: JSON.stringify({}), method: 'POST', headers: {
        "content-type": "application/json"
      }
    })).json()

    const preUserBalance = await deployerWallet.getBalance()
    const preContractBalance = await ethers.provider.getBalance(mainnetFaucet.address)

    // NOTE: imageStr is string inputted by end user based on captcha (base64 image)
    try {
      await mainnetFaucet.estimateGas.getNativeFaucet(captcha.result.uuid+"2", captcha.result.imageStr)
      const res = await mainnetFaucet.getNativeFaucet(captcha.result.uuid+"2", captcha.result.imageStr);
      await res.wait();
    } catch {}

    const postUserBalance = await deployerWallet.getBalance()
    const postContractBalance = await ethers.provider.getBalance(mainnetFaucet.address)

    expect(preUserBalance).to.be.eq(postUserBalance, "User should have not received testnet funds")
    expect(preContractBalance).to.be.eq(postContractBalance, "Faucet should have all original funds")
  });
});
