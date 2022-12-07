import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
import { Contract, ContractFactory, BigNumber, utils, providers } from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'
import { bobaLinkGetQuote } from '@boba/api'
import util from 'util'

import { BobaLinkService } from '@boba/bobalink'

/* eslint-disable */
const fetch = require('node-fetch')
/* eslint-enable */

import FluxAggregatorHCJson from '@boba/contracts/artifacts/contracts/oracle/FluxAggregatorHC.sol/FluxAggregatorHC.json'
import TuringHelperJson from '../artifacts/contracts/TuringHelper.sol/TuringHelper.json'
import L2GovernanceERC20Json from '@boba/contracts/artifacts/contracts/standards/L2GovernanceERC20.sol/L2GovernanceERC20.json'

import { OptimismEnv } from './shared/env'

describe('BobaLink Test\n', async () => {
  let env: OptimismEnv

  let Factory__FluxAggregatorHC: ContractFactory
  let FluxAggregatorHC: Contract

  let Factory__TuringHelper: ContractFactory
  let TuringHelper: Contract

  let BobaTuringCredit: Contract
  let L2BOBAToken: Contract

  let ChainLinkContract: Contract

  const apiPort = 1235
  const ETHUSDPriceFeedAddr = '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419'
  const minSubmissionValue = 1
  const maxSubmissionValue = utils.parseUnits('50000', 8)
  let URL: string
  const ETHProviderUrl = 'https://rpc.ankr.com/eth'
  const ETHProvider = new providers.JsonRpcProvider(ETHProviderUrl)
  const roundId = BigNumber.from('92233720368547795404')

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

    ChainLinkContract = new Contract(
      ETHUSDPriceFeedAddr,
      [
        'function getRoundData(uint80) view returns (uint80 roundId,uint256 answer,uint256 startedAt,uint256 updatedAt,uint80 answeredInRound)',
        'function latestRound() view returns (uint80 roundId)',
      ],
      ETHProvider
    )

    Factory__TuringHelper = new ContractFactory(
      TuringHelperJson.abi,
      TuringHelperJson.bytecode,
      env.l2Wallet
    )

    TuringHelper = await Factory__TuringHelper.deploy()
    console.log('Helper contract deployed at', TuringHelper.address)
    await TuringHelper.deployTransaction.wait()

    Factory__FluxAggregatorHC = new ContractFactory(
      FluxAggregatorHCJson.abi,
      FluxAggregatorHCJson.bytecode,
      env.l2Wallet
    )

    FluxAggregatorHC = await Factory__FluxAggregatorHC.deploy()
    await FluxAggregatorHC.initialize(
      minSubmissionValue, // min submission value
      maxSubmissionValue, // max submission value
      8, // decimals
      `ETH USD`, // description
      TuringHelper.address,
      `http://localhost:${apiPort}/fake`,
      ETHUSDPriceFeedAddr
    )

    const addPermitTx = await TuringHelper.addPermittedCaller(
      FluxAggregatorHC.address
    )
    await addPermitTx.wait()

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
          if (req.url === "/real") {
            const APIChainLinkContract = new Contract(
              args[1],
              [
                'function getRoundData(uint80) view returns (uint80 roundId,uint256 answer,uint256 startedAt,uint256 updatedAt,uint80 answeredInRound)',
                'function latestRound() view returns (uint80 roundId)',
              ],
              ETHProvider
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
          if (req.url === '/api') {
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
    const abi_payload = utils.defaultAbiCoder.encode(
      ['uint256', 'address', 'uint256'],
      [64, ETHUSDPriceFeedAddr, roundId]
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

  it('should get fake chainLink quote', async () => {
    await FluxAggregatorHC.updateHCUrl(`${URL}/fake`)
    await FluxAggregatorHC.estimateGas.getChainLinkQuote(roundId)
    await FluxAggregatorHC.getChainLinkQuote(roundId, gasOverride)
    const block = await env.l2Provider.getBlockNumber()
    const chainLinkQuoteEvents = await FluxAggregatorHC.queryFilter(
      FluxAggregatorHC.filters.ChainLinkQuoteGot(),
      block - 1,
      block
    )
    expect(chainLinkQuoteEvents[0].args.CLRoundId).to.equal(roundId)
    expect(chainLinkQuoteEvents[0].args.CLLatestRoundId).to.eq(roundId)
  })

  it('should get real chainLink quote', async () => {
    await FluxAggregatorHC.updateHCUrl(`${URL}/real`)
    await FluxAggregatorHC.estimateGas.getChainLinkQuote(roundId)
    await FluxAggregatorHC.getChainLinkQuote(roundId, gasOverride)
    const block = await env.l2Provider.getBlockNumber()
    const chainLinkQuoteEvents = await FluxAggregatorHC.queryFilter(
      FluxAggregatorHC.filters.ChainLinkQuoteGot(),
      block - 1,
      block
    )
    const latestRound = await ChainLinkContract.latestRound()
    expect(chainLinkQuoteEvents[0].args.CLRoundId).to.equal(roundId)
    expect(chainLinkQuoteEvents[0].args.CLLatestRoundId).to.eq(latestRound)
  })

  it('should submit answer using Hybird Compute', async () => {
    const addOracleTx = await FluxAggregatorHC.setOracle(
      env.l1Wallet.address,
      env.l1Wallet.address,
      roundId
    )
    await addOracleTx.wait()
    const nextRoundId = roundId.add(1)
    await FluxAggregatorHC.estimateGas.submit(nextRoundId)
    await FluxAggregatorHC.submit(nextRoundId, gasOverride)
    const latestRound = await FluxAggregatorHC.latestRound()
    const latestRoundData = await FluxAggregatorHC.getRoundData(latestRound)
    const chainLinkRoundData = await ChainLinkContract.getRoundData(nextRoundId)
    expect(latestRound).to.eq(nextRoundId)
    expect(latestRoundData.answer).to.be.eq(chainLinkRoundData.answer)
  })

  it('should not be able to submit answer again using Hybird Compute', async () => {
    const nextRoundId = roundId.add(1)
    await expect(
      FluxAggregatorHC.estimateGas.submit(nextRoundId)
    ).to.be.revertedWith('invalid roundId to initialize')
  })

  it('should not be able to submit answer again using emergency submission', async () => {
    const nextRoundId = roundId.add(1)
    const chainLinkRoundData = await ChainLinkContract.getRoundData(nextRoundId)
    const latestRound = await ChainLinkContract.latestRound()
    await expect(
      FluxAggregatorHC.emergencySubmit(
        nextRoundId,
        chainLinkRoundData.answer,
        latestRound
      )
    ).to.be.revertedWith('invalid roundId to initialize')
  })

  it('should not be able to submit answer using the incorrect chainlink data', async () => {
    const nextRoundId = roundId.add(2)
    const chainLinkRoundData = await ChainLinkContract.getRoundData(nextRoundId)
    const latestRound = await ChainLinkContract.latestRound()
    await FluxAggregatorHC.emergencySubmit(
      nextRoundId,
      chainLinkRoundData.answer,
      latestRound
    )
    await expect(
      FluxAggregatorHC.emergencySubmit(
        nextRoundId.add(1),
        chainLinkRoundData.answer,
        latestRound.sub(1)
      )
    ).to.be.revertedWith('ChainLink latestRoundId is invalid')
  })

  it('test of api endpoint: should return price', async () => {
    process.env.L1_NODE_WEB3_URL = ETHProviderUrl
    const abi_payload = utils.defaultAbiCoder.encode(
      ['uint256', 'address', 'uint256'],
      [64, ETHUSDPriceFeedAddr, roundId]
    )

    const body = {
      params: [abi_payload],
    }

    const resp = await fetch(`${URL}/api`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await resp.json()
    const result = utils.defaultAbiCoder.decode(
      ['uint256', 'uint256', 'int256', 'uint80'],
      res.result
    )

    const latestRound = await ChainLinkContract.latestRound()
    expect(Number(result[0])).to.equal(32 * 3)
    expect(result[1]).to.be.deep.equal(roundId)
    expect(result[3]).to.be.deep.equal(latestRound)
  })

  it('should allow to submit answer using Hybird Compute api', async () => {
    await FluxAggregatorHC.updateHCUrl(`${URL}/api`)
    const nextRoundId = roundId.add(3)
    await FluxAggregatorHC.estimateGas.getChainLinkQuote(nextRoundId)
    await FluxAggregatorHC.getChainLinkQuote(nextRoundId, gasOverride)
    const block = await env.l2Provider.getBlockNumber()
    const chainLinkQuoteEvents = await FluxAggregatorHC.queryFilter(
      FluxAggregatorHC.filters.ChainLinkQuoteGot(),
      block - 1,
      block
    )
    const latestRound = await ChainLinkContract.latestRound()
    expect(chainLinkQuoteEvents[0].args.CLRoundId).to.equal(nextRoundId)
    expect(chainLinkQuoteEvents[0].args.CLLatestRoundId).to.eq(latestRound)
  })

  it('should not be able to update answer if env is incorrect', async () => {
    process.env.L1_NODE_WEB3_URL = 'http://localhost:3000'
    const nextRoundId = roundId.add(3)
    await expect(
      FluxAggregatorHC.estimateGas.submit(nextRoundId)
    ).to.be.revertedWith('TURING: Server error')
  })

  it('should not be able to update answer if rpc returns error', async () => {
    process.env.L1_NODE_WEB3_URL = ETHProviderUrl
    const nextRoundId = roundId.add(3)
    await FluxAggregatorHC.updateHCUrl(`${URL}/invalidapi`)
    await expect(
      FluxAggregatorHC.estimateGas.submit(nextRoundId)
    ).to.be.rejectedWith('TURING: Server error')
    await FluxAggregatorHC.updateHCUrl(`${URL}/api`)
  })

  it('should be able to submit data via BobaLinkService', async () => {
    const startBOBALinkService = async () => {
      const chainId = (await env.l2Provider.getNetwork()).chainId
      return new BobaLinkService({
        l1RpcProvider: ETHProvider,
        l2RpcProvider: env.l2Provider,
        chainId,
        reporterWallet: env.l2Wallet,
        bobaLinkPairs,
        pollingInterval: 2000,
        setGasPriceToZero: false,
      })
    }

    const Timer = (time) => {
      return new Promise((resolve) => {
        setTimeout(() => resolve('TimeOut'), time)
      })
    }

    const bobaLinkPairs = {
      [ETHUSDPriceFeedAddr]: {
        pair: 'ETH / USD',
        decimals: 8,
        l2ContractAddress: FluxAggregatorHC.address,
      },
    }
    const bobaLinkService = await startBOBALinkService()
    await bobaLinkService.init()

    const prevRoundId = await FluxAggregatorHC.latestRound()
    await Promise.race([Timer(5000), bobaLinkService.start()])
    const latestRoundId = await FluxAggregatorHC.latestRound()
    const roundData = await FluxAggregatorHC.getRoundData(latestRoundId)
    const chainLinkLatestRoundId =
      await FluxAggregatorHC.chainLinkLatestRoundId()
    const chainLinkRoundData = await ChainLinkContract.getRoundData(
      latestRoundId
    )
    const chainLinkLatestRoundIdInCLContract =
      await ChainLinkContract.latestRound()
    expect(latestRoundId).to.be.gt(prevRoundId)
    expect(roundData.answer).to.be.eq(chainLinkRoundData.answer)
    expect(chainLinkLatestRoundIdInCLContract).to.be.eq(chainLinkLatestRoundId)
  })
})
