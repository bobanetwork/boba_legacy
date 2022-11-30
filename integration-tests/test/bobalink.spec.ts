import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
const expect = chai.expect
import { Contract, ContractFactory, BigNumber, utils, providers } from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'

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

    FluxAggregatorHC = await Factory__FluxAggregatorHC.deploy(
      env.addressesBOBA.TOKENS.BOBA.L2, // boba L2 token
      0, // starting payment amount
      180, // timeout, 3 mins
      '0x0000000000000000000000000000000000000000', // validator
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
          }
          let response = {
            "jsonrpc": "2.0",
            "id": jsonBody.id,
            "result": result
          }
          res.end(JSON.stringify(response))
          server.emit('success', body)
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
    await FluxAggregatorHC.updateTuringUrl(`${URL}/fake`)
    await FluxAggregatorHC.estimateGas.getChainLinkQuote(roundId)
    await FluxAggregatorHC.getChainLinkQuote(roundId, gasOverride)
    const block = await env.l2Provider.getBlockNumber()
    const chainLinkQuoteEvents = await FluxAggregatorHC.queryFilter(
      FluxAggregatorHC.filters.GetChainLinkQuote(),
      block - 1,
      block
    )
    expect(chainLinkQuoteEvents[0].args.CLRoundId).to.equal(roundId)
    expect(chainLinkQuoteEvents[0].args.CLLatestRoundId).to.eq(roundId)
  })

  it('should get real chainLink quote', async () => {
    await FluxAggregatorHC.updateTuringUrl(`${URL}/real`)
    await FluxAggregatorHC.estimateGas.getChainLinkQuote(roundId)
    await FluxAggregatorHC.getChainLinkQuote(roundId, gasOverride)
    const block = await env.l2Provider.getBlockNumber()
    const chainLinkQuoteEvents = await FluxAggregatorHC.queryFilter(
      FluxAggregatorHC.filters.GetChainLinkQuote(),
      block - 1,
      block
    )
    const latestRound = await ChainLinkContract.latestRound()
    expect(chainLinkQuoteEvents[0].args.CLRoundId).to.equal(roundId)
    expect(chainLinkQuoteEvents[0].args.CLLatestRoundId).to.eq(latestRound)
  })

  it('should allow to submit answer using Turing', async () => {
    const addOracleTx = await FluxAggregatorHC.changeOracles(
      [],
      [env.l1Wallet.address],
      [env.l1Wallet.address],
      [roundId],
      1, // min submission count
      1, // max submission count
      0 // restart delay
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

  it('should not be able to submit answer again using Turing', async () => {
    const nextRoundId = roundId.add(1)
    await expect(FluxAggregatorHC.estimateGas.submit(nextRoundId)).to.be
      .reverted
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
    ).to.be.reverted
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
    ).to.be.reverted
  })
})
