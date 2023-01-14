import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
import { Contract, ContractFactory, BigNumber, utils } from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'
import { bobaLinkGetQuote } from '@boba/api'
import { sleep } from '@eth-optimism/core-utils'

/* eslint-disable */
const fetch = require('node-fetch')
/* eslint-enable */

import FluxAggregatorHCJson from '@boba/contracts/artifacts/contracts/oracle/FluxAggregatorHC.sol/FluxAggregatorHC.json'
import TuringHelperJson from '../artifacts/contracts/TuringHelper.sol/TuringHelper.json'
import L2GovernanceERC20Json from '@boba/contracts/artifacts/contracts/standards/L2GovernanceERC20.sol/L2GovernanceERC20.json'

import { OptimismEnv } from './shared/env'
import util from 'util'

describe('BobaLink Test\n', async () => {
  let env: OptimismEnv

  let EthChainLinkOracle: Contract
  let EthOracleHC: Contract

  let BtcChainLinkOracle: Contract
  let BtcOracleHC: Contract

  let Factory__TuringHelper: ContractFactory
  let TuringHelper: Contract

  let BobaTuringCredit: Contract
  let L2BOBAToken: Contract

  const apiPort = 1235
  let URL: string

  const gasOverride = {
    gasLimit: 1000000,
  }

  before(async () => {
    env = await OptimismEnv.new()

    const BobaTuringCreditAddress = await env.addressesBOBA.BobaTuringCredit

    BobaTuringCredit = getContractFactory(
      'BobaTuringCredit',
      env.l2Wallet
    ).attach(BobaTuringCreditAddress)

    L2BOBAToken = new Contract(
      env.addressesBOBA.TOKENS.BOBA.L2,
      L2GovernanceERC20Json.abi,
      env.l2Wallet
    )

    Factory__TuringHelper = new ContractFactory(
      TuringHelperJson.abi,
      TuringHelperJson.bytecode,
      env.l2Wallet
    )

    TuringHelper = await Factory__TuringHelper.deploy()
    console.log('Helper contract deployed at', TuringHelper.address)
    await TuringHelper.deployTransaction.wait()

    EthChainLinkOracle = new Contract(
      env.addressesBOBA.ETHUSD_AggregatorHC,
      FluxAggregatorHCJson.abi,
      env.l2Wallet
    )
    EthOracleHC = new Contract(
      env.addressesBOBA.Proxy__ETHUSD_AggregatorHC,
      FluxAggregatorHCJson.abi,
      env.l2Wallet
    )

    BtcChainLinkOracle = new Contract(
      env.addressesBOBA.WBTCUSD_AggregatorHC,
      FluxAggregatorHCJson.abi,
      env.l2Wallet
    )
    BtcOracleHC = new Contract(
      env.addressesBOBA.Proxy__WBTCUSD_AggregatorHC,
      FluxAggregatorHCJson.abi,
      env.l2Wallet
    )

    await EthOracleHC.updateHCHelper(TuringHelper.address)
    await BtcOracleHC.updateHCHelper(TuringHelper.address)

    await EthOracleHC.updateHCChainLinkPriceFeedAddr(EthChainLinkOracle.address)
    await BtcOracleHC.updateHCChainLinkPriceFeedAddr(BtcChainLinkOracle.address)

    await EthOracleHC.setOracle(
      EthChainLinkOracle.address,
      env.l2Wallet_2.address,
      0
    )
    await BtcOracleHC.setOracle(
      BtcChainLinkOracle.address,
      env.l2Wallet_2.address,
      0
    )
    await EthChainLinkOracle.setOracle(
      EthChainLinkOracle.address,
      env.l2Wallet.address,
      0
    )
    await BtcChainLinkOracle.setOracle(
      BtcChainLinkOracle.address,
      env.l2Wallet.address,
      0
    )

    await TuringHelper.addPermittedCaller(EthOracleHC.address)
    await TuringHelper.addPermittedCaller(BtcOracleHC.address)

    // add boba as credit
    const depositBOBAAmount = utils.parseEther('1')
    const bobaBalance = await L2BOBAToken.balanceOf(env.l2Wallet.address)
    console.log('BOBA Balance in your account', bobaBalance.toString())

    const approveTx = await L2BOBAToken.approve(
      BobaTuringCredit.address,
      depositBOBAAmount
    )
    await approveTx.wait()

    const depositTx = await BobaTuringCredit.addBalanceTo(
      depositBOBAAmount,
      TuringHelper.address
    )
    await depositTx.wait()

    const generateBytes32 = (input: number | BigNumber) => {
      return utils.hexZeroPad(utils.hexlify(input), 32).replace('0x', '')
    }

    /* eslint-disable */
    const http = require('http')
    const ip = require("ip")
    // start local server
    const server = module.exports = http.createServer(async function (req, res) {

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
            res.end(JSON.stringify(response))
            server.emit('success', body)
          }
          if (req.url === '/invalidapi') {
            res.writeHead(400, { 'Content-Type': 'text/plain' })
            res.end('Expected content-type: application/json')
          }
        });

      } else {
        console.log("Other request:", req)
        res.writeHead(400, { 'Content-Type': 'text/plain' })
        res.end('Expected content-type: application/json')
      }
      }).listen(apiPort)
      URL = `http://${ip.address()}:${apiPort}`
      /* eslint-enable */
  })

  it('test of local compute endpoint: should return price', async () => {
    const lastRoundId = (await EthChainLinkOracle.latestRound()).toNumber()
    const decimals = await EthChainLinkOracle.decimals()
    /* eslint-disable */
    await EthChainLinkOracle.emergencySubmit(lastRoundId + 1, utils.parseUnits('10000', decimals), 1000)
    /* eslint-enable */
    const roundId = lastRoundId + 1
    const abi_payload = utils.defaultAbiCoder.encode(
      ['uint256', 'address', 'uint256'],
      [64, EthChainLinkOracle.address, roundId]
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
    const lastRoundId = (await EthChainLinkOracle.latestRound()).toNumber()
    const abi_payload = utils.defaultAbiCoder.encode(
      ['uint256', 'address', 'uint256'],
      [64, EthChainLinkOracle.address, lastRoundId]
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
    const lastRoundId = (await EthChainLinkOracle.latestRound()).toNumber()
    const abi_payload = utils.defaultAbiCoder.encode(
      ['uint256', 'address', 'uint256'],
      [64, EthChainLinkOracle.address, lastRoundId]
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
    const lastRoundId = (await EthChainLinkOracle.latestRound()).toNumber()
    await EthOracleHC.updateHCUrl(`${URL}/fake`)
    await EthOracleHC.connect(env.l2Wallet_2).estimateGas.getChainLinkQuote(lastRoundId)
    await EthOracleHC.connect(env.l2Wallet_2).getChainLinkQuote(lastRoundId, gasOverride)
    const block = await env.l2Provider.getBlockNumber()
    const chainLinkQuoteEvents = await EthOracleHC.queryFilter(
      EthOracleHC.filters.ChainLinkQuoteGot(),
      block - 1,
      block
    )
    expect(chainLinkQuoteEvents[0].args.CLRoundId).to.equal(lastRoundId)
    expect(chainLinkQuoteEvents[0].args.CLLatestRoundId).to.eq(lastRoundId)
  }).retries(3)

  it('should get a single quote via bobalink using test api', async () => {
    await EthOracleHC.updateHCUrl(`${URL}/bobalink-test-api`)
    const lastRoundId = (await EthChainLinkOracle.latestRound()).toNumber()
    const decimals = await EthChainLinkOracle.decimals()
    const price = utils.parseUnits('12000', decimals)
    /* eslint-disable */
    await EthChainLinkOracle.emergencySubmit(lastRoundId + 1, price, 1000)
    /* eslint-enable */
    await sleep(10000)
    const latestAnswer = await EthOracleHC.latestAnswer()
    const block = await env.l2Provider.getBlockNumber()
    const chainLinkQuoteEvents = await EthOracleHC.queryFilter(
      EthOracleHC.filters.ChainLinkQuoteGot(),
      block,
      block
    )
    expect(latestAnswer).to.be.eq(price)
    expect(chainLinkQuoteEvents[0].args.CLRoundId).to.equal(lastRoundId + 1)
    expect(chainLinkQuoteEvents[0].args.CLLatestRoundId).to.eq(lastRoundId + 1)
  })

  it('should not be able to submit answer again using Hybird Compute', async () => {
    const lastRoundId = (await EthOracleHC.latestRound()).toNumber()
    await expect(
      EthOracleHC.connect(env.l2Wallet_2).estimateGas.submit(lastRoundId)
    ).to.be.revertedWith('invalid roundId to initialize')
  })

  it('should not be able to submit answer again using emergency submission', async () => {
    const lastRoundId = (await EthOracleHC.latestRound()).toNumber()
    const decimals = await EthOracleHC.decimals()
    await expect(
      EthOracleHC.connect(env.l2Wallet_2).emergencySubmit(
        lastRoundId,
        utils.parseUnits('10000', decimals),
        lastRoundId
      )
    ).to.be.revertedWith('invalid roundId to initialize')
  })

  it('should get multiple quotes via bobalink using test api', async () => {
    await EthOracleHC.updateHCUrl(`${URL}/bobalink-test-api`)
    const lastRoundId = (await EthChainLinkOracle.latestRound()).toNumber()
    const decimals = await EthChainLinkOracle.decimals()
    const price1 = utils.parseUnits('10000', decimals)
    const price2 = utils.parseUnits('12000', decimals)
    /* eslint-disable */
    await EthChainLinkOracle.emergencySubmit(lastRoundId + 1, price1, 1000)
    await EthChainLinkOracle.emergencySubmit(lastRoundId + 2, price2, 1000)
    /* eslint-enable */
    await sleep(10000)
    const prevAnswer = await EthOracleHC.getRoundData(lastRoundId + 1)
    const latestAnswer = await EthOracleHC.getRoundData(lastRoundId + 2)
    const block = await env.l2Provider.getBlockNumber()
    const chainLinkQuoteEvents = await EthOracleHC.queryFilter(
      EthOracleHC.filters.ChainLinkQuoteGot(),
      block,
      block
    )
    expect(prevAnswer.answer).to.be.eq(price1)
    expect(latestAnswer.answer).to.be.eq(price2)
    expect(chainLinkQuoteEvents[0].args.CLRoundId).to.equal(lastRoundId + 2)
    expect(chainLinkQuoteEvents[0].args.CLLatestRoundId).to.eq(lastRoundId + 2)
  })

  it('should get a single quote via bobalink using prod api', async () => {
    await EthOracleHC.updateHCUrl(`${URL}/bobalink-prod-api`)
    const lastRoundId = (await EthChainLinkOracle.latestRound()).toNumber()
    const decimals = await EthChainLinkOracle.decimals()
    const price = utils.parseUnits('12000', decimals)
    /* eslint-disable */
    await EthChainLinkOracle.emergencySubmit(lastRoundId + 1, price, 1000)
    /* eslint-enable */
    await sleep(10000)
    const latestAnswer = await EthOracleHC.latestAnswer()
    const block = await env.l2Provider.getBlockNumber()
    const chainLinkQuoteEvents = await EthOracleHC.queryFilter(
      EthOracleHC.filters.ChainLinkQuoteGot(),
      block,
      block
    )
    expect(latestAnswer).to.be.eq(price)
    expect(chainLinkQuoteEvents[0].args.CLRoundId).to.equal(lastRoundId + 1)
    expect(chainLinkQuoteEvents[0].args.CLLatestRoundId).to.eq(lastRoundId + 1)
  })

  it('should get multiple quotes via bobalink using prod api', async () => {
    await EthOracleHC.updateHCUrl(`${URL}/bobalink-prod-api`)
    const lastRoundId = (await EthChainLinkOracle.latestRound()).toNumber()
    const decimals = await EthChainLinkOracle.decimals()
    const price1 = utils.parseUnits('10000', decimals)
    const price2 = utils.parseUnits('12000', decimals)
    /* eslint-disable */
    await EthChainLinkOracle.emergencySubmit(lastRoundId + 1, price1, 1000)
    await EthChainLinkOracle.emergencySubmit(lastRoundId + 2, price2, 1000)
    /* eslint-enable */
    await sleep(10000)
    const prevAnswer = await EthOracleHC.getRoundData(lastRoundId + 1)
    const latestAnswer = await EthOracleHC.getRoundData(lastRoundId + 2)
    const block = await env.l2Provider.getBlockNumber()
    const chainLinkQuoteEvents = await EthOracleHC.queryFilter(
      EthOracleHC.filters.ChainLinkQuoteGot(),
      block,
      block
    )
    expect(prevAnswer.answer).to.be.eq(price1)
    expect(latestAnswer.answer).to.be.eq(price2)
    expect(chainLinkQuoteEvents[0].args.CLRoundId).to.equal(lastRoundId + 2)
    expect(chainLinkQuoteEvents[0].args.CLLatestRoundId).to.eq(lastRoundId + 2)
  })

  it('should get multiple quotes for multiple oracles using prod api', async () => {
    await EthOracleHC.updateHCUrl(`${URL}/bobalink-prod-api`)
    const EthLastRoundId = (await EthChainLinkOracle.latestRound()).toNumber()
    const EthDecimals = await EthChainLinkOracle.decimals()
    const EthPrice1 = utils.parseUnits('10000', EthDecimals)
    const EthPrice2 = utils.parseUnits('12000', EthDecimals)
    /* eslint-disable */
    await EthChainLinkOracle.emergencySubmit(EthLastRoundId + 1, EthPrice1, 1000)
    await EthChainLinkOracle.emergencySubmit(EthLastRoundId + 2, EthPrice2, 1000)
    /* eslint-enable */
    await BtcOracleHC.updateHCUrl(`${URL}/bobalink-prod-api`)
    const BtcLastRoundId = (await BtcChainLinkOracle.latestRound()).toNumber()
    const BtcDecimals = await BtcChainLinkOracle.decimals()
    const BtcPrice1 = utils.parseUnits('10000', BtcDecimals)
    const BtcPrice2 = utils.parseUnits('12000', BtcDecimals)
    /* eslint-disable */
    await BtcChainLinkOracle.emergencySubmit(BtcLastRoundId + 1, BtcPrice1, 1000)
    await BtcChainLinkOracle.emergencySubmit(BtcLastRoundId + 2, BtcPrice2, 1000)
    /* eslint-enable */
    await sleep(10000)
    const EthPrevAnswer = await EthOracleHC.getRoundData(EthLastRoundId + 1)
    const EthLatestAnswer = await EthOracleHC.getRoundData(EthLastRoundId + 2)
    const BtcPrevAnswer = await BtcOracleHC.getRoundData(BtcLastRoundId + 1)
    const BtcLatestAnswer = await BtcOracleHC.getRoundData(BtcLastRoundId + 2)
    expect(EthPrevAnswer.answer).to.be.eq(EthPrice1)
    expect(EthLatestAnswer.answer).to.be.eq(EthPrice2)
    expect(BtcPrevAnswer.answer).to.be.eq(BtcPrice1)
    expect(BtcLatestAnswer.answer).to.be.eq(BtcPrice2)
  })
})
