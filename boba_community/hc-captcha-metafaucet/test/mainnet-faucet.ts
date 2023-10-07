// https://github.com/bobanetwork/boba/blob/develop/packages/boba/turing/test/005_lending.ts

import {Contract, ContractFactory, providers, utils, Wallet} from "ethers";
import hre, {ethers} from "hardhat";
import chai, {expect} from "chai";
import {solidity} from "ethereum-waffle";
import * as request from "request-promise-native";
import Faucet from "../artifacts/contracts/BobaFaucet.sol/BobaFaucet.json";
import HCHelperJson from "../artifacts/contracts/TuringHelper.sol/TuringHelper.json";
import L2GovernanceERC20Json
  from "../../../packages/contracts/artifacts/contracts/standards/L2GovernanceERC20.sol/L2GovernanceERC20.json";
import BobaTuringCreditJson
  from "../../../packages/contracts/artifacts/contracts/L2/predeploys/BobaTuringCredit.sol/BobaTuringCredit.json";
import {spawn} from "child_process";

chai.use(solidity);

const fetch = require("node-fetch");
const sendMetaTx = require("../api/hc_sendMetaTx.js").handler

const cfg = hre.network.config;
const gasOverride = {gasLimit: 8_000_000};
const local_provider = new providers.JsonRpcProvider(cfg["url"]);

const deployerPK = hre.network.config.accounts[0];
const deployerWallet = new Wallet(deployerPK, local_provider);
const otherWallet_1 = new Wallet(hre.network.config.accounts[1], local_provider);
const otherWallet_2 = new Wallet(hre.network.config.accounts[2], local_provider);
const otherWallet_3 = new Wallet(hre.network.config.accounts[3], local_provider);
const otherWallet_4 = new Wallet(hre.network.config.accounts[4], local_provider);

let BOBAL2Address;
let BobaHcCreditAddress;

let Factory__BobaHcCredit: ContractFactory;
let Factory__MainnetFaucet: ContractFactory;
let faucet: Contract;
let Factory__HcHelper: ContractFactory;
let hcHelper: Contract;
let hcCredit: Contract;
let L2BOBAToken: Contract;
let addressesBOBA;
const ethClaimAmount = ethers.utils.parseEther("0.001")
const tokenClaimAmount = ethers.utils.parseEther("0.1")
const depositAmount = utils.parseEther("2"); // for HCCredit

const DEFAULT_WAITING_PERIOD = 43200 // 12h
const USE_LOCAL_BACKEND = true
const publicTuringUrl = 'https://zci1n9pde8.execute-api.us-east-1.amazonaws.com/Prod/' // TODO
let turingUrlUsed: string

enum LocalEndpoint {
  getCaptcha = "getCAPTCHA",
  verifyCaptcha = "verifyCAPTCHA",
  sendMetaTx = "sendMetaTx"
}

const EndpointConfig = {
  // Urls to be set by createServer
  [LocalEndpoint.getCaptcha]: {
    port: 1235,
    url: '',
  },
  [LocalEndpoint.verifyCaptcha]: {
    port: 1236,
    url: '',
  },
  [LocalEndpoint.sendMetaTx]: {
    port: 1237,
    url: '',
  },
}

const loadPythonResult = async (params, endpoint: LocalEndpoint) => {

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
  const port = EndpointConfig[endpoint].port

  const server = (module.exports = http
    .createServer(async function (req, res) {
      if (endpoint === LocalEndpoint.getCaptcha || LocalEndpoint.sendMetaTx || (endpoint === LocalEndpoint.verifyCaptcha && req.headers['content-type'] === 'application/json')) {
        let bodyStr = ''

        req.on('data', (chunk) => {
          bodyStr += chunk.toString()
        })

        req.on('end', async () => {

          const jBody = {body: bodyStr, logs: false}

          let result
          if (endpoint === LocalEndpoint.sendMetaTx) {
            const metatxres = await sendMetaTx(jBody, {})
            result = JSON.stringify(metatxres)
          } else {
            result = ((await loadPythonResult(JSON.stringify(jBody), endpoint)) as string) // load Python directly, since examples are currently in Python & to have common test-base
          }
          result = result?.replace('\r\n', '')

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

  EndpointConfig[endpoint].url = endpointUrl

  console.log('Created local HTTP server at', endpointUrl)
}

describe("Get gas from mainnet faucet", function () {
  before(async () => {

    if (USE_LOCAL_BACKEND) {
      createServer(LocalEndpoint.getCaptcha)
      createServer(LocalEndpoint.verifyCaptcha)
      createServer(LocalEndpoint.sendMetaTx)
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
      Faucet.abi,
      Faucet.bytecode,
      deployerWallet
    );

    turingUrlUsed = USE_LOCAL_BACKEND
      ? EndpointConfig[LocalEndpoint.verifyCaptcha].url
      : publicTuringUrl

    L2BOBAToken = new Contract(
      BOBAL2Address,
      L2GovernanceERC20Json.abi,
      deployerWallet
    );

    faucet = await Factory__MainnetFaucet.deploy(
      hcHelper.address,
      L2BOBAToken.address,
      turingUrlUsed,
      DEFAULT_WAITING_PERIOD, // 12h
      ethClaimAmount,
      tokenClaimAmount,
      gasOverride
    );

    console.log("MainnetFaucet contract deployed on", faucet.address);

    // fund faucet
    const multiplier = 15
    const fTx = await deployerWallet.sendTransaction({
      ...gasOverride,
      to: faucet.address,
      value: ethClaimAmount.mul(multiplier)
    });
    await fTx.wait();
    console.log("Funded faucet with ETH..");

    const tTx = await L2BOBAToken.transfer(faucet.address, tokenClaimAmount.mul(multiplier), gasOverride)
    await tTx.wait()
    console.log("Funded faucet with BOBA..")

    // whitelist the new 'lending' contract in the helper
    const tr1 = await hcHelper.addPermittedCaller(faucet.address);
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
      faucet.address,
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
    const helperAddress = await faucet.hcHelper();
    expect(helperAddress).to.equal(hcHelper.address);
  });

  it("should fail to get captcha if no data provided", async () => {
    const captcha = await (await fetch(EndpointConfig[LocalEndpoint.getCaptcha].url, {
      body: JSON.stringify({}), method: 'POST', headers: {
        "content-type": "application/json"
      }
    })).json()

    expect(captcha?.result?.error).to.be.eq("No address provided.")
  });

  it("should fail to get captcha if no address provided", async () => {
    const captcha = await (await fetch(EndpointConfig[LocalEndpoint.getCaptcha].url, {
      body: JSON.stringify({"other_key": "abc"}), method: 'POST', headers: {
        "content-type": "application/json"
      }
    })).json()

    expect(captcha?.result?.error).to.be.eq("No address provided.")
  });

  it("should get native faucet", async () => {
    const captcha = await (await fetch(EndpointConfig[LocalEndpoint.getCaptcha].url, {
      body: JSON.stringify({to: deployerWallet.address}), method: 'POST', headers: {
        "content-type": "application/json"
      }
    })).json()

    const preUserBalance = await deployerWallet.getBalance()
    const preUserTokenBalance = await L2BOBAToken.balanceOf(deployerWallet.address)
    const preContractBalance = await ethers.provider.getBalance(faucet.address)
    const preContractTokenBalance = await L2BOBAToken.balanceOf(faucet.address)

    // NOTE: imageStr is string inputted by end user based on captcha (base64 image)
    console.log("Using wallet: ", deployerWallet.address)
    console.log("Current key: ", captcha.result.imageStr)
    await faucet.estimateGas.getFaucet(captcha.result.uuid, captcha.result.imageStr, deployerWallet.address)
    const res = await faucet.getFaucet(captcha.result.uuid, captcha.result.imageStr, deployerWallet.address);
    await res.wait();

    const postUserBalance = await deployerWallet.getBalance()
    const postUserTokenBalance = await L2BOBAToken.balanceOf(deployerWallet.address)
    const postContractBalance = await ethers.provider.getBalance(faucet.address)
    const postContractTokenBalance = await L2BOBAToken.balanceOf(faucet.address)

    expect(preUserBalance).to.be.lt(postUserBalance, "User should have received testnet funds")
    expect(preContractBalance).to.be.gt(postContractBalance, "Faucet should have issued funds")
    expect(preUserTokenBalance).to.be.lt(postUserTokenBalance, "User should have received testnet token funds")
    expect(preContractTokenBalance).to.be.gt(postContractTokenBalance, "Faucet should have issued token funds")
  });

  it("native faucet should fail when user already claimed within waiting period", async () => {
    const captcha = await (await fetch(EndpointConfig[LocalEndpoint.getCaptcha].url, {
      body: JSON.stringify({to: deployerWallet.address}), method: 'POST', headers: {
        "content-type": "application/json"
      }
    })).json()

    const preUserBalance = await deployerWallet.getBalance()
    const preContractBalance = await ethers.provider.getBalance(faucet.address)

    // NOTE: imageStr is string inputted by end user based on captcha (base64 image)
    await expect(faucet.estimateGas.getFaucet(captcha.result.uuid, captcha.result.imageStr, deployerWallet.address)).to.be.revertedWith("Invalid request")

    const postUserBalance = await deployerWallet.getBalance()
    const postContractBalance = await ethers.provider.getBalance(faucet.address)

    expect(preUserBalance).to.be.eq(postUserBalance, "User should have not received testnet funds")
    expect(preContractBalance).to.be.eq(postContractBalance, "Faucet should have all original funds")
  });

  it("native faucet should succeed after user who previously claimed waited long enough (waiting period)", async () => {
    // remove waiting period
    let tx = await faucet.configure(hcHelper.address, L2BOBAToken.address, turingUrlUsed, 0, ethClaimAmount, tokenClaimAmount)
    await tx.wait()

    const captcha = await (await fetch(EndpointConfig[LocalEndpoint.getCaptcha].url, {
      body: JSON.stringify({to: deployerWallet.address}), method: 'POST', headers: {
        "content-type": "application/json"
      }
    })).json()

    const preUserBalance = await deployerWallet.getBalance()
    const preContractBalance = await ethers.provider.getBalance(faucet.address)

    // NOTE: imageStr is string inputted by end user based on captcha (base64 image)
    await faucet.estimateGas.getFaucet(captcha.result.uuid, captcha.result.imageStr, deployerWallet.address)
    tx = await faucet.getFaucet(captcha.result.uuid, captcha.result.imageStr, deployerWallet.address)
    await tx.wait()

    const postUserBalance = await deployerWallet.getBalance()
    const postContractBalance = await ethers.provider.getBalance(faucet.address)

    expect(preUserBalance).to.be.lt(postUserBalance, "User should have received testnet funds")
    expect(preContractBalance).to.be.gt(postContractBalance, "Faucet should not have all original funds")

    // remove waiting period
    tx = await faucet.configure(hcHelper.address, L2BOBAToken.address, turingUrlUsed, DEFAULT_WAITING_PERIOD, ethClaimAmount, tokenClaimAmount)
    await tx.wait()
  });

  it("native faucet should fail when image string is invalid", async () => {
    const captcha = await (await fetch(EndpointConfig[LocalEndpoint.getCaptcha].url, {
      body: JSON.stringify({to: otherWallet_1.address}), method: 'POST', headers: {
        "content-type": "application/json"
      }
    })).json()

    const preUserBalance = await otherWallet_1.getBalance()
    const preContractBalance = await ethers.provider.getBalance(faucet.address)

    // NOTE: imageStr is string inputted by end user based on captcha (base64 image)
    await expect(faucet.estimateGas.getFaucet(captcha.result.uuid, captcha.result.imageStr + "2", otherWallet_1.address)).to.be.revertedWith("Captcha wrong")

    const postUserBalance = await otherWallet_1.getBalance()
    const postContractBalance = await ethers.provider.getBalance(faucet.address)

    expect(preUserBalance).to.be.eq(postUserBalance, "User should have not received testnet funds")
    expect(preContractBalance).to.be.eq(postContractBalance, "Faucet should have all original funds")
  });

  it("native faucet should fail when uuid has not been issued", async () => {
    const captcha = await (await fetch(EndpointConfig[LocalEndpoint.getCaptcha].url, {
      body: JSON.stringify({to: otherWallet_1.address}), method: 'POST', headers: {
        "content-type": "application/json"
      }
    })).json()

    const preUserBalance = await otherWallet_1.getBalance()
    const preContractBalance = await ethers.provider.getBalance(faucet.address)

    // NOTE: imageStr is string inputted by end user based on captcha (base64 image)
    const modifiedUuid = captcha.result.uuid.substring(0, captcha.result.uuid.length - 2) + Math.floor(Math.random() * (99 - 10 + 1) + 10).toString()
    await expect(faucet.estimateGas.getFaucet(modifiedUuid, captcha.result.imageStr, otherWallet_1.address)).to.be.revertedWith("Captcha wrong")

    const postUserBalance = await otherWallet_1.getBalance()
    const postContractBalance = await ethers.provider.getBalance(faucet.address)

    expect(preUserBalance).to.be.eq(postUserBalance, "User should have not received testnet funds")
    expect(preContractBalance).to.be.eq(postContractBalance, "Faucet should have all original funds")
  });

  it("native faucet should fail when address does not match uuid", async () => {
    const captcha = await (await fetch(EndpointConfig[LocalEndpoint.getCaptcha].url, {
      body: JSON.stringify({to: otherWallet_1.address}), method: 'POST', headers: {
        "content-type": "application/json"
      }
    })).json()

    const preUserBalance = await otherWallet_1.getBalance()
    const preContractBalance = await ethers.provider.getBalance(faucet.address)

    // NOTE: imageStr is string inputted by end user based on captcha (base64 image)
    await expect(faucet.estimateGas.getFaucet(captcha.result.uuid, captcha.result.imageStr, otherWallet_2.address)).to.be.revertedWith("Captcha wrong")

    const postUserBalance = await otherWallet_1.getBalance()
    const postContractBalance = await ethers.provider.getBalance(faucet.address)

    expect(preUserBalance).to.be.eq(postUserBalance, "User should have not received testnet funds")
    expect(preContractBalance).to.be.eq(postContractBalance, "Faucet should have all original funds")
  });

  describe('meta tx', () => {
    it('should not get nonce if no address provided', async () => {
      const metaRequest = await (await fetch(EndpointConfig[LocalEndpoint.sendMetaTx].url, {
        body: JSON.stringify({}), method: 'POST', headers: {
          "content-type": "application/json"
        }
      })).json()

      expect(metaRequest?.result?.error).to.be.eq('Address not defined')
    })

    it('should not get nonce if address provided is invalid for 1st request', async () => {
      const metaRequest = await (await fetch(EndpointConfig[LocalEndpoint.sendMetaTx].url, {
        body: JSON.stringify({to: "0x0"}), method: 'POST', headers: {
          "content-type": "application/json"
        }
      })).json()

      expect(metaRequest?.result?.error).to.be.eq('Address invalid')
    })

    it('should not send meta tx if no address provided for 2nd request', async () => {
      const metaRequest = await (await fetch(EndpointConfig[LocalEndpoint.sendMetaTx].url, {
        body: JSON.stringify({sig: "0x0"}), method: 'POST', headers: {
          "content-type": "application/json"
        }
      })).json()

      expect(metaRequest?.result?.error).to.be.eq('Address not defined')
    })

    it('should not send meta tx if address provided is invalid for 2nd request', async () => {
      const metaRequest = await (await fetch(EndpointConfig[LocalEndpoint.sendMetaTx].url, {
        body: JSON.stringify({sig: "0x0", to: "0x0"}), method: 'POST', headers: {
          "content-type": "application/json"
        }
      })).json()

      expect(metaRequest?.result?.error).to.be.eq('Address invalid')
    })

    /** @dev For test environments we may not want to set a faucet contract address in the .env file, so that we can set it dynamically from the tests. */
    it('should not send meta tx if no contract faucet address provided', async () => {
      const metaRequest = await (await fetch(EndpointConfig[LocalEndpoint.sendMetaTx].url, {
        body: JSON.stringify({sig: "0x0", to: otherWallet_1.address}), method: 'POST', headers: {
          "content-type": "application/json"
        }
      })).json()

      expect(metaRequest?.result?.error).to.be.eq('No mainnet faucet address provided')
    })

    it('should get nonce to sign', async () => {
      const metaRequest = await (await fetch(EndpointConfig[LocalEndpoint.sendMetaTx].url, {
        body: JSON.stringify({to: otherWallet_1.address}), method: 'POST', headers: {
          "content-type": "application/json"
        }
      })).json()

      console.log("Received nonce: ", metaRequest?.result?.nonce)
      expect(metaRequest?.result?.nonce?.length).to.be.eq(22)
    })

    it('should get different nonce to sign on every call', async () => {
      const metaRequest = await (await fetch(EndpointConfig[LocalEndpoint.sendMetaTx].url, {
        body: JSON.stringify({to: otherWallet_1.address}), method: 'POST', headers: {
          "content-type": "application/json"
        }
      })).json()

      const metaRequest2 = await (await fetch(EndpointConfig[LocalEndpoint.sendMetaTx].url, {
        body: JSON.stringify({to: otherWallet_1.address}), method: 'POST', headers: {
          "content-type": "application/json"
        }
      })).json()

      expect(metaRequest?.result?.nonce?.length).to.be.eq(22)
      expect(metaRequest2?.result?.nonce?.length).to.be.eq(22)
      expect(metaRequest?.result?.nonce).to.not.be.eq(metaRequest2?.result?.nonce)
    })

    it('should fail if get nonce not called before', async () => {
      const metaRequest = await (await fetch(EndpointConfig[LocalEndpoint.sendMetaTx].url, {
        // faucetAddr only needs to be defined in tests
        body: JSON.stringify({
          to: otherWallet_3.address,
          sig: "0x0",
          faucetAddr: faucet.address,
          uuid: "123",
          key: "987"
        }), method: 'POST', headers: {
          "content-type": "application/json"
        }
      })).json()

      expect(metaRequest?.result?.error).to.be.eq('Invalid signature')
    })

    it('should fail when uuid and imageKey not provided', async () => {
      await (await fetch(EndpointConfig[LocalEndpoint.sendMetaTx].url, {
        body: JSON.stringify({to: deployerWallet.address}), method: 'POST', headers: {
          "content-type": "application/json"
        }
      })).json()

      const metaRequest = await (await fetch(EndpointConfig[LocalEndpoint.sendMetaTx].url, {
        // faucetAddr only needs to be defined in tests
        body: JSON.stringify({to: deployerWallet.address, sig: "0x0", faucetAddr: faucet.address}),
        method: 'POST',
        headers: {
          "content-type": "application/json"
        }
      })).json()

      expect(metaRequest?.result?.error).to.be.eq('Captcha results not provided')
    })

    it('should fail when uuid not provided', async () => {
      await (await fetch(EndpointConfig[LocalEndpoint.sendMetaTx].url, {
        body: JSON.stringify({to: deployerWallet.address}), method: 'POST', headers: {
          "content-type": "application/json"
        }
      })).json()

      const metaRequest = await (await fetch(EndpointConfig[LocalEndpoint.sendMetaTx].url, {
        // faucetAddr only needs to be defined in tests
        body: JSON.stringify({to: deployerWallet.address, sig: "0x0", faucetAddr: faucet.address, key: "123"}),
        method: 'POST',
        headers: {
          "content-type": "application/json"
        }
      })).json()

      expect(metaRequest?.result?.error).to.be.eq('Captcha results not provided')
    })

    it('should fail when imageKey not provided', async () => {
      await (await fetch(EndpointConfig[LocalEndpoint.sendMetaTx].url, {
        body: JSON.stringify({to: deployerWallet.address}), method: 'POST', headers: {
          "content-type": "application/json"
        }
      })).json()

      const metaRequest = await (await fetch(EndpointConfig[LocalEndpoint.sendMetaTx].url, {
        // faucetAddr only needs to be defined in tests
        body: JSON.stringify({to: deployerWallet.address, sig: "0x0", faucetAddr: faucet.address, uuid: "123"}),
        method: 'POST',
        headers: {
          "content-type": "application/json"
        }
      })).json()

      expect(metaRequest?.result?.error).to.be.eq('Captcha results not provided')
    })

    it('should fail for signature with invalid length', async () => {
      await (await fetch(EndpointConfig[LocalEndpoint.sendMetaTx].url, {
        body: JSON.stringify({to: deployerWallet.address}), method: 'POST', headers: {
          "content-type": "application/json"
        }
      })).json()

      const metaRequest = await (await fetch(EndpointConfig[LocalEndpoint.sendMetaTx].url, {
        // faucetAddr only needs to be defined in tests
        body: JSON.stringify({
          to: deployerWallet.address,
          sig: "0x0",
          faucetAddr: faucet.address,
          uuid: "123",
          key: "987"
        }), method: 'POST', headers: {
          "content-type": "application/json"
        }
      })).json()

      expect(metaRequest?.result?.error).to.be.eq('Invalid signature')
    })

    it('should fail for invalid signature', async () => {
      await (await fetch(EndpointConfig[LocalEndpoint.sendMetaTx].url, {
        body: JSON.stringify({to: deployerWallet.address}), method: 'POST', headers: {
          "content-type": "application/json"
        }
      })).json()

      const metaRequest = await (await fetch(EndpointConfig[LocalEndpoint.sendMetaTx].url, {
        // faucetAddr only needs to be defined in tests
        body: JSON.stringify({
          to: deployerWallet.address,
          uuid: "123",
          key: "987",
          sig: "0x0293cc0d4eb416ca95349b7e63dc9d1c9a7aab4865b5cd6d6f2c36fb1dce12d34a05039aedf0bc64931a439def451bcf313abbcc72e9172f7fd51ecca30b41dd1b",
          faucetAddr: faucet.address
        }), method: 'POST', headers: {
          "content-type": "application/json"
        }
      })).json()

      expect(metaRequest?.result?.error).to.be.eq('Invalid signature')
    })

    const claimFundsViaMetaTx = async (wallet: Wallet) => {
      let metaRequest = await (await fetch(EndpointConfig[LocalEndpoint.getCaptcha].url, {
        body: JSON.stringify({to: wallet.address}), method: 'POST', headers: {
          "content-type": "application/json"
        }
      })).json()

      // ImageStr only in local environment defined (already solved captcha)
      const {uuid, imageBase64, imageStr} = metaRequest?.result
      expect(uuid?.length).to.be.gt(0, "UUID not defined")
      expect(imageBase64?.length).to.be.gt(0, "ImageBase64 not defined")

      metaRequest = await (await fetch(EndpointConfig[LocalEndpoint.sendMetaTx].url, {
        body: JSON.stringify({to: wallet.address}), method: 'POST', headers: {
          "content-type": "application/json"
        }
      })).json()

      const nonce = metaRequest?.result?.nonce
      expect(metaRequest?.result?.nonce?.length).to.be.eq(22, "Nonce has invalid length")

      const sig = await wallet.signMessage(nonce)
      expect(sig?.length).to.be.eq(132, "Signature has invalid length")

      const preUserBalance = await wallet.getBalance()
      const preContractBalance = await ethers.provider.getBalance(faucet.address)
      const preUserTokenBalance = await L2BOBAToken.balanceOf(wallet.address)
      const preContractTokenBalance = await L2BOBAToken.balanceOf(faucet.address)

      metaRequest = await (await fetch(EndpointConfig[LocalEndpoint.sendMetaTx].url, {
        // faucetAddr only needs to be defined in tests
        body: JSON.stringify({to: wallet.address, sig, uuid, key: imageStr, faucetAddr: faucet.address}),
        method: 'POST',
        headers: {
          "content-type": "application/json"
        }
      })).json()

      const postUserBalance = await wallet.getBalance()
      const postContractBalance = await ethers.provider.getBalance(faucet.address)
      const postUserTokenBalance = await L2BOBAToken.balanceOf(wallet.address)
      const postContractTokenBalance = await L2BOBAToken.balanceOf(faucet.address)

      console.log("Meta transaction API response: ", metaRequest)
      expect(metaRequest?.result?.error).to.be.undefined
      expect(metaRequest?.result?.message).to.be.eq('Funds issued')
      expect(postUserBalance).to.be.gt(preUserBalance, "Did not receive user funds");
      expect(postContractBalance).to.be.lt(preContractBalance, "Faucet did not issue funds")
      expect(postUserTokenBalance).to.be.gt(preUserTokenBalance, "Did not receive user token funds");
      expect(postContractTokenBalance).to.be.lt(preContractTokenBalance, "Faucet did not issue token funds")
    }

    it('should issue funds for valid signature', async () => {
      await claimFundsViaMetaTx(otherWallet_2)
    })

    it('should issue funds for valid signature for different wallets within waiting period but reject for same wallet or same nonce', async () => {
      expect(await faucet.waitingPeriod()).to.be.gt(0)

      await claimFundsViaMetaTx(otherWallet_1)
      await claimFundsViaMetaTx(otherWallet_4)

      // should reject 2nd time request
      let metaRequest = await (await fetch(EndpointConfig[LocalEndpoint.getCaptcha].url, {
        body: JSON.stringify({to: otherWallet_1.address}), method: 'POST', headers: {
          "content-type": "application/json"
        }
      })).json()

      // ImageStr only in local environment defined (already solved captcha)
      const {uuid, imageBase64, imageStr} = metaRequest?.result
      expect(uuid?.length).to.be.gt(0, "UUID not defined")
      expect(imageBase64?.length).to.be.gt(0, "ImageBase64 not defined")

      metaRequest = await (await fetch(EndpointConfig[LocalEndpoint.sendMetaTx].url, {
        body: JSON.stringify({to: otherWallet_1.address}), method: 'POST', headers: {
          "content-type": "application/json"
        }
      })).json()

      const nonce = metaRequest?.result?.nonce
      expect(metaRequest?.result?.nonce?.length).to.be.eq(22, "Nonce has invalid length")

      const sig = await otherWallet_1.signMessage(nonce)
      expect(sig?.length).to.be.eq(132, "Signature has invalid length")

      const preUserBalance = await otherWallet_1.getBalance()
      const preContractBalance = await ethers.provider.getBalance(faucet.address)

      metaRequest = await (await fetch(EndpointConfig[LocalEndpoint.sendMetaTx].url, {
        // faucetAddr only needs to be defined in tests
        body: JSON.stringify({to: otherWallet_1.address, sig, uuid, key: imageStr, faucetAddr: faucet.address}),
        method: 'POST',
        headers: {
          "content-type": "application/json"
        }
      })).json()

      const postUserBalance = await otherWallet_1.getBalance()
      const postContractBalance = await ethers.provider.getBalance(faucet.address)

      console.log("Meta transaction API response: ", metaRequest)
      expect(metaRequest?.result?.error).to.contain('Invalid request')
      expect(postUserBalance).to.be.eq(preUserBalance, "Should not receive user funds");
      expect(postContractBalance).to.be.eq(preContractBalance, "Faucet did issue funds")

      let tx = await faucet.configure(hcHelper.address, L2BOBAToken.address, turingUrlUsed, 0, ethClaimAmount, tokenClaimAmount)
      await tx.wait()
      expect(await faucet.waitingPeriod()).to.be.eq(0, "Waiting period not changed (1)")

      // try again with same nonce/signature and fail as nonce invalidated
      metaRequest = await (await fetch(EndpointConfig[LocalEndpoint.sendMetaTx].url, {
        // faucetAddr only needs to be defined in tests
        body: JSON.stringify({to: otherWallet_1.address, sig, uuid, key: imageStr, faucetAddr: faucet.address}),
        method: 'POST',
        headers: {
          "content-type": "application/json"
        }
      })).json()

      expect(metaRequest?.result?.error).to.be.eq('Invalid signature')

      tx = await faucet.configure(hcHelper.address, L2BOBAToken.address, turingUrlUsed, DEFAULT_WAITING_PERIOD, ethClaimAmount, tokenClaimAmount)
      await tx.wait()
      expect(await faucet.waitingPeriod()).to.be.eq(DEFAULT_WAITING_PERIOD, "Waiting period not changed (2)")
    })
  })

  describe('configure', () => {
    it('should not be able to change hcHelper to zero address', async () => {
      await expect(faucet.configure(ethers.constants.AddressZero, ethers.constants.AddressZero, "abc", 123, 976, 0)).to.be.revertedWith("HCHelper cannot be ZeroAddr")
    })

    it('should not be able to change nativeAmount to 0', async () => {
      await expect(faucet.configure(otherWallet_1.address, L2BOBAToken.address, "abc", 123, 0, 0)).to.be.revertedWith("Native amount too small")
    })

    it('should be able to change settings as owner', async () => {
      let tx = await faucet.configure(otherWallet_1.address, L2BOBAToken.address, "abc", 123, 976, 0)
      await tx.wait()
      expect(await faucet.hcHelper()).to.be.eq(otherWallet_1.address)
      expect(await faucet.hcBackendUrl()).to.be.eq("abc")
      expect(await faucet.waitingPeriod()).to.be.eq(123)
      expect(await faucet.nativeFaucetAmount()).to.be.eq(976)

      // back to defaults
      tx = await faucet.configure(hcHelper.address, L2BOBAToken.address, turingUrlUsed, DEFAULT_WAITING_PERIOD, ethClaimAmount, tokenClaimAmount)
      await tx.wait()
      expect(await faucet.hcHelper()).to.be.eq(hcHelper.address)
      expect(await faucet.hcBackendUrl()).to.be.eq(turingUrlUsed)
      expect(await faucet.waitingPeriod()).to.be.eq(DEFAULT_WAITING_PERIOD)
      expect(await faucet.nativeFaucetAmount()).to.be.eq(ethClaimAmount)
    })

    it('should not be able to change settings as non-owner', async () => {
      await expect(faucet.connect(otherWallet_1).configure(otherWallet_1.address, L2BOBAToken.address, "abc", 123, 976, 0)).to.be.revertedWith("Ownable: caller is not the owner")

      expect(await faucet.hcHelper()).to.be.eq(hcHelper.address)
      expect(await faucet.hcBackendUrl()).to.be.eq(turingUrlUsed)
      expect(await faucet.waitingPeriod()).to.be.eq(DEFAULT_WAITING_PERIOD)
      expect(await faucet.nativeFaucetAmount()).to.be.eq(ethClaimAmount)
    })
  })

  describe('withdraw', () => {
    it("should fail to withdraw funds as non-owner", async () => {
      await expect(faucet.connect(otherWallet_1).withdraw(1, 1)).to.be.revertedWith("Ownable: caller is not the owner")
    });

    it("should fail to withdraw funds if not available", async () => {
      await expect(faucet.withdraw(ethers.constants.MaxUint256, 0)).to.be.revertedWith("Failed to send native")
    });

    it("should withdraw partially native funds as owner", async () => {
      const preUserBalance = await deployerWallet.getBalance()
      const preContractBalance = await ethers.provider.getBalance(faucet.address)
      expect(preContractBalance).to.be.gt(0, "Contract balance already 0")

      const claimAmount = preContractBalance.div(4)
      const tx = await faucet.withdraw(claimAmount, 0)
      await tx.wait()

      const postUserBalance = await deployerWallet.getBalance()
      const postContractBalance = await ethers.provider.getBalance(faucet.address)

      expect(postContractBalance).to.be.eq(preContractBalance.sub(claimAmount), "Faucet should have no original funds")
      expect(postUserBalance).to.be.gt(preUserBalance, "User should have received all testnet funds")
    });

    it("should withdraw both funds as owner", async () => {
      const preUserBalance = await deployerWallet.getBalance()
      const preContractBalance = await ethers.provider.getBalance(faucet.address)
      const preUserTokenBalance = await L2BOBAToken.balanceOf(deployerWallet.address)
      const preContractTokenBalance = await L2BOBAToken.balanceOf(faucet.address)
      expect(preContractBalance).to.be.gt(0, "Contract balance already 0")
      expect(preContractTokenBalance).to.be.gt(0, 'Token contract balance already 0')

      const tx = await faucet.withdraw(preContractBalance, preContractTokenBalance)
      await tx.wait()

      const postUserBalance = await deployerWallet.getBalance()
      const postUserTokenBalance = await L2BOBAToken.balanceOf(deployerWallet.address)
      const postContractBalance = await ethers.provider.getBalance(faucet.address)
      const postContractTokenBalance = await L2BOBAToken.balanceOf(faucet.address)

      expect(postContractBalance).to.be.eq(0, "Faucet should have no original funds")
      expect(postContractTokenBalance).to.be.eq(0, "Faucet should have no original token funds")
      expect(postUserBalance).to.be.gt(preUserBalance, "User should have received all testnet funds")
      expect(postUserTokenBalance).to.be.gt(preUserTokenBalance, "User should have received all testnet token funds")
    });
  })
});
