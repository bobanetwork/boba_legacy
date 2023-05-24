import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
import { ethers } from 'hardhat'
import { Contract, ContractFactory, BigNumber, utils } from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'
import { getBobaContractAt } from '@boba/contracts'
import { bobaLinkGetQuote } from '@boba/api'
import util from 'util'

/* eslint-disable */
const fetch = require('node-fetch')
/* eslint-enable */

import { OptimismEnv } from './shared/env'
import { waitForAndExecute } from './shared/utils'
import { Server } from 'http'

describe('BobaLink Test\n', async () => {
  let env: OptimismEnv

  let BobaChainLinkOracle: Contract
  let BobaOracleHC: Contract

  let Factory__TuringHelper: ContractFactory
  let TuringHelper: Contract

  let BobaTuringCredit: Contract

  const apiPort = 1235
  let URL: string

  const gasOverride = {
    gasLimit: 1000000,
  }

  const addOracle = async (
    contract: Contract,
    oracleAddr: string,
    adminAddr: string,
    roundId = 0
  ) => {
    const admin = await contract.getAdmin()
    if (admin === '0x0000000000000000000000000000000000000000') {
      await contract.setOracle(oracleAddr, adminAddr, roundId)
    }
  }

  let server: Server

  after(async () => {
    await server.close(console.error)
  })

  before(async () => {
    env = await OptimismEnv.new()

    await env.l2Wallet.sendTransaction({
      to: env.l2BobalinkWallet.address,
      value: utils.parseEther('100'),
    })

    const BobaTuringCreditAddress = await env.addressesBOBA.BobaTuringCredit

    BobaTuringCredit = getContractFactory(
      'BobaTuringCreditAltL1',
      env.l2Wallet
    ).attach(BobaTuringCreditAddress)

    Factory__TuringHelper = await ethers.getContractFactory(
      'TuringHelper',
      env.l2Wallet
    )

    TuringHelper = await Factory__TuringHelper.deploy()
    console.log('Helper contract deployed at', TuringHelper.address)
    await TuringHelper.deployTransaction.wait()

    BobaChainLinkOracle = await getBobaContractAt(
      'FluxAggregatorHC',
      env.addressesBOBA.BOBAUSD_AggregatorHC,
      env.l2Wallet
    )
    BobaOracleHC = await getBobaContractAt(
      'FluxAggregatorHC',
      env.addressesBOBA.Proxy__BOBAUSD_AggregatorHC,
      env.l2Wallet
    )

    await BobaOracleHC.updateHCHelper(TuringHelper.address)
    await BobaOracleHC.updateHCChainLinkPriceFeedAddr(
      BobaChainLinkOracle.address
    )

    await addOracle(
      BobaOracleHC,
      BobaChainLinkOracle.address,
      env.l2BobalinkWallet.address
    )
    await addOracle(
      BobaChainLinkOracle,
      BobaChainLinkOracle.address,
      env.l2Wallet.address
    )

    await TuringHelper.addPermittedCaller(BobaOracleHC.address)

    // add boba as credit
    const depositBOBAAmount = utils.parseEther('100')
    const bobaBalance = await env.l2Wallet.getBalance()
    console.log('BOBA Balance in your account', bobaBalance.toString())

    const depositTx = await BobaTuringCredit.addBalanceTo(
      depositBOBAAmount,
      TuringHelper.address,
      { value: depositBOBAAmount }
    )
    await depositTx.wait()

    const generateBytes32 = (input: number | BigNumber) => {
      return utils.hexZeroPad(utils.hexlify(input), 32).replace('0x', '')
    }

    /* eslint-disable */
    const http = require('http')
    const ip = require("ip")
    // start local server
    server = module.exports = http.createServer(async function (req, res) {

      if (req.headers['content-type'] === 'application/json') {

        let body = '';

        req.on('data', function (chunk) {
          body += chunk.toString()
        })

        req.on('end', async function () {
          const jsonBody = JSON.parse(body)
          const input = JSON.parse(body).params[0]
          let result

          const args = utils.defaultAbiCoder.decode(['uint256', 'address', 'uint256'], input)
          if (req.url === "/fake") {
            const randomPrice = Math.floor(Math.random() * 1000)
            result = `0x${generateBytes32(32 * 3)}${generateBytes32(args[2])}${generateBytes32(randomPrice)}${generateBytes32(args[2])}`
            let response = {
              "jsonrpc": "2.0",
              "id": jsonBody.id,
              "result": result
            }
            res.end(JSON.stringify(response))
            server.emit('success', body)
          }
          if (req.url === "/bobalink-test-api") {
            const APIChainLinkContract = new Contract(
              args[1],
              [
                'function getRoundData(uint80) view returns (uint80 roundId,uint256 answer,uint256 startedAt,uint256 updatedAt,uint80 answeredInRound)',
                'function latestRound() view returns (uint80 roundId)',
              ],
              env.l2Provider
            )
            const latestRound = await APIChainLinkContract.latestRound()
            const roundData = await APIChainLinkContract.getRoundData(args[2])
            result = `0x${generateBytes32(32 * 3)}${generateBytes32(roundData.roundId)}${generateBytes32(roundData.answer)}${generateBytes32(latestRound)}`
            let response = {
              "jsonrpc": "2.0",
              "id": jsonBody.id,
              "result": result
            }
            res.end(JSON.stringify(response))
            server.emit('success', body)
          }
          if (req.url === '/bobalink-prod-api') {
            const asyncBobaLinkGetQuote: any = util.promisify(
              bobaLinkGetQuote
            )
            const response = await asyncBobaLinkGetQuote({
              body: JSON.stringify({params: [input]}
            )}, null)
            res.end(response.body)
            server.emit('success', body)
          }
          if (req.url === '/invalidapi') {
            res.writeHead(400, { 'Content-Type': 'text/plain' })
            res.end('Expected content-type: application/json')
          }
        });

      } else {
        res.writeHead(400, { 'Content-Type': 'text/plain' })
        res.end('Expected content-type: application/json')
      }
      }).listen(apiPort)
      URL = `http://${ip.address()}:${apiPort}`
      /* eslint-enable */
  })

  it('test of local compute endpoint: should return price', async () => {
    const lastRoundId = (await BobaChainLinkOracle.latestRound()).toNumber()
    const decimals = await BobaChainLinkOracle.decimals()
    /* eslint-disable */
    await BobaChainLinkOracle.emergencySubmit(lastRoundId + 1, utils.parseUnits('0.1', decimals), 1000)
    /* eslint-enable */
    const roundId = lastRoundId + 1
    const abi_payload = utils.defaultAbiCoder.encode(
      ['uint256', 'address', 'uint256'],
      [64, BobaChainLinkOracle.address, roundId]
    )

    const body = {
      params: [abi_payload],
    }

    const resp = await fetch(`${URL}/fake`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await resp.json()
    const result = utils.defaultAbiCoder.decode(
      ['uint256', 'uint256', 'int256', 'uint80'],
      res.result
    )

    expect(Number(result[0])).to.equal(32 * 3)
    expect(result[1]).to.be.deep.equal(roundId)
    expect(result[3]).to.be.deep.equal(roundId)
  })

  it('test of /bobalink-test-api endpoint: should return price', async () => {
    const lastRoundId = (await BobaChainLinkOracle.latestRound()).toNumber()
    const abi_payload = utils.defaultAbiCoder.encode(
      ['uint256', 'address', 'uint256'],
      [64, BobaChainLinkOracle.address, lastRoundId]
    )

    const body = {
      params: [abi_payload],
    }

    const resp = await fetch(`${URL}/bobalink-test-api`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await resp.json()
    const result = utils.defaultAbiCoder.decode(
      ['uint256', 'uint256', 'int256', 'uint80'],
      res.result
    )
    expect(Number(result[0])).to.equal(32 * 3)
    expect(result[1]).to.be.deep.equal(lastRoundId)
    expect(result[3]).to.be.deep.equal(lastRoundId)
  })

  it('test of /bobalink-prod-api endpoint: should return price', async () => {
    process.env.L1_NODE_WEB3_URL = env.l2Provider.connection.url
    const lastRoundId = (await BobaChainLinkOracle.latestRound()).toNumber()
    const abi_payload = utils.defaultAbiCoder.encode(
      ['uint256', 'address', 'uint256'],
      [64, BobaChainLinkOracle.address, lastRoundId]
    )

    const body = {
      params: [abi_payload],
    }

    const resp = await fetch(`${URL}/bobalink-prod-api`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await resp.json()
    const result = utils.defaultAbiCoder.decode(
      ['uint256', 'uint256', 'int256', 'uint80'],
      res.result
    )
    expect(Number(result[0])).to.equal(32 * 3)
    expect(result[1]).to.be.deep.equal(lastRoundId)
    expect(result[3]).to.be.deep.equal(lastRoundId)
  })

  it('should get quote via Hybrid Compute', async () => {
    const lastRoundId = (await BobaChainLinkOracle.latestRound()).toNumber()
    await BobaOracleHC.updateHCUrl(`${URL}/fake`)
    const admin = await BobaOracleHC.getAdmin()
    const HCUrl = await BobaOracleHC.HCUrl()
    await BobaOracleHC.connect(
      env.l2BobalinkWallet
    ).estimateGas.getChainLinkQuote(lastRoundId)
    await BobaOracleHC.connect(env.l2BobalinkWallet).getChainLinkQuote(
      lastRoundId,
      gasOverride
    )
    const block = await env.l2Provider.getBlockNumber()
    const chainLinkQuoteEvents = await BobaOracleHC.queryFilter(
      BobaOracleHC.filters.ChainLinkQuoteGot(),
      block - 1,
      block
    )
    expect(chainLinkQuoteEvents[0].args.CLRoundId).to.equal(lastRoundId)
    expect(chainLinkQuoteEvents[0].args.CLLatestRoundId).to.eq(lastRoundId)
  }).retries(3)

  it('should get a single quote via bobalink using test api', async () => {
    await BobaOracleHC.updateHCUrl(`${URL}/bobalink-test-api`)
    const lastRoundId = (await BobaChainLinkOracle.latestRound()).toNumber()
    const decimals = await BobaChainLinkOracle.decimals()
    const price = utils.parseUnits('0.2', decimals)
    /* eslint-disable */
    await BobaChainLinkOracle.emergencySubmit(lastRoundId + 1, price, 1000)
    /* eslint-enable */
    const test = async () => {
      const latestAnswer = await BobaOracleHC.latestAnswer()
      const block = await env.l2Provider.getBlockNumber()
      const chainLinkQuoteEvents = await BobaOracleHC.queryFilter(
        BobaOracleHC.filters.ChainLinkQuoteGot(),
        block,
        block
      )
      expect(latestAnswer).to.be.eq(price)
      expect(chainLinkQuoteEvents[0].args.CLRoundId).to.equal(lastRoundId + 1)
      expect(chainLinkQuoteEvents[0].args.CLLatestRoundId).to.eq(
        lastRoundId + 1
      )
    }
    await waitForAndExecute(test, 10)
  })

  it('should not be able to submit answer again using Hybird Compute', async () => {
    const lastRoundId = (await BobaOracleHC.latestRound()).toNumber()
    await expect(
      BobaOracleHC.connect(env.l2BobalinkWallet).estimateGas.submit(lastRoundId)
    ).to.be.revertedWith('invalid roundId to initialize')
  })

  it('should not be able to submit answer again using emergency submission', async () => {
    const lastRoundId = (await BobaOracleHC.latestRound()).toNumber()
    const decimals = await BobaOracleHC.decimals()
    await expect(
      BobaOracleHC.connect(env.l2BobalinkWallet).emergencySubmit(
        lastRoundId,
        utils.parseUnits('0.3', decimals),
        lastRoundId
      )
    ).to.be.revertedWith('invalid roundId to initialize')
  })

  it('should get multiple quotes via bobalink using test api', async () => {
    await BobaOracleHC.updateHCUrl(`${URL}/bobalink-test-api`)
    const lastRoundId = (await BobaChainLinkOracle.latestRound()).toNumber()
    const decimals = await BobaChainLinkOracle.decimals()
    const price1 = utils.parseUnits('0.4', decimals)
    const price2 = utils.parseUnits('0.5', decimals)
    /* eslint-disable */
    await BobaChainLinkOracle.emergencySubmit(lastRoundId + 1, price1, 1000)
    await BobaChainLinkOracle.emergencySubmit(lastRoundId + 2, price2, 1000)
    /* eslint-enable */
    const test = async () => {
      const prevAnswer = await BobaOracleHC.getRoundData(lastRoundId + 1)
      const latestAnswer = await BobaOracleHC.getRoundData(lastRoundId + 2)
      const block = await env.l2Provider.getBlockNumber()
      const chainLinkQuoteEvents = await BobaOracleHC.queryFilter(
        BobaOracleHC.filters.ChainLinkQuoteGot(),
        block,
        block
      )
      expect(prevAnswer.answer).to.be.eq(price1)
      expect(latestAnswer.answer).to.be.eq(price2)
      expect(chainLinkQuoteEvents[0].args.CLRoundId).to.equal(lastRoundId + 2)
      expect(chainLinkQuoteEvents[0].args.CLLatestRoundId).to.eq(
        lastRoundId + 2
      )
    }
    await waitForAndExecute(test, 10)
  })

  it('should get a single quote via bobalink using prod api', async () => {
    await BobaOracleHC.updateHCUrl(`${URL}/bobalink-prod-api`)
    const lastRoundId = (await BobaChainLinkOracle.latestRound()).toNumber()
    const decimals = await BobaChainLinkOracle.decimals()
    const price = utils.parseUnits('0.6', decimals)
    /* eslint-disable */
    await BobaChainLinkOracle.emergencySubmit(lastRoundId + 1, price, 1000)
    /* eslint-enable */
    const test = async () => {
      const latestAnswer = await BobaOracleHC.latestAnswer()
      const block = await env.l2Provider.getBlockNumber()
      const chainLinkQuoteEvents = await BobaOracleHC.queryFilter(
        BobaOracleHC.filters.ChainLinkQuoteGot(),
        block,
        block
      )
      expect(latestAnswer).to.be.eq(price)
      expect(chainLinkQuoteEvents[0].args.CLRoundId).to.equal(lastRoundId + 1)
      expect(chainLinkQuoteEvents[0].args.CLLatestRoundId).to.eq(
        lastRoundId + 1
      )
    }
    await waitForAndExecute(test, 10)
  })

  it('should get multiple quotes via bobalink using prod api', async () => {
    await BobaOracleHC.updateHCUrl(`${URL}/bobalink-prod-api`)
    const lastRoundId = (await BobaChainLinkOracle.latestRound()).toNumber()
    const decimals = await BobaChainLinkOracle.decimals()
    const price1 = utils.parseUnits('0.7', decimals)
    const price2 = utils.parseUnits('0.8', decimals)
    /* eslint-disable */
    await BobaChainLinkOracle.emergencySubmit(lastRoundId + 1, price1, 1000)
    await BobaChainLinkOracle.emergencySubmit(lastRoundId + 2, price2, 1000)
    /* eslint-enable */
    const test = async () => {
      const prevAnswer = await BobaOracleHC.getRoundData(lastRoundId + 1)
      const latestAnswer = await BobaOracleHC.getRoundData(lastRoundId + 2)
      const block = await env.l2Provider.getBlockNumber()
      const chainLinkQuoteEvents = await BobaOracleHC.queryFilter(
        BobaOracleHC.filters.ChainLinkQuoteGot(),
        block,
        block
      )
      expect(prevAnswer.answer).to.be.eq(price1)
      expect(latestAnswer.answer).to.be.eq(price2)
      expect(chainLinkQuoteEvents[0].args.CLRoundId).to.equal(lastRoundId + 2)
      expect(chainLinkQuoteEvents[0].args.CLLatestRoundId).to.eq(
        lastRoundId + 2
      )
    }
    await waitForAndExecute(test, 10)
  })
})
