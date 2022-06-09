import {
  SequencerBatch,
  BatchType,
  add0x,
  remove0x,
  sleep,
} from '@eth-optimism/core-utils'
import { getContractFactory } from '@eth-optimism/contracts'
import { BigNumber, Contract, ContractFactory, ethers, utils } from 'ethers'

import { expect } from './shared/setup'
import { OptimismEnv } from './shared/env'
import { envConfig } from './shared/utils'

import HelloTuringJson from '@boba/turing-hybrid-compute/artifacts/contracts/HelloTuring.sol/HelloTuring.json'
import TuringHelperJson from '@boba/turing-hybrid-compute/artifacts/contracts/TuringHelper.sol/TuringHelper.json'
import L1ERC20Json from '@boba/contracts/artifacts/contracts/test-helpers/L1ERC20.sol/L1ERC20.json'
import L2GovernanceERC20Json from '@boba/contracts/artifacts/contracts/standards/L2GovernanceERC20.sol/L2GovernanceERC20.json'

describe('Batch Serialization', () => {
  let env: OptimismEnv
  let BobaTuringCredit: Contract
  let L1StandardBridge: Contract

  let L1BOBAToken: Contract
  let L2BOBAToken: Contract

  let TuringHelper: Contract
  let Factory__TuringHelper: ContractFactory

  let Factory__Random: ContractFactory
  let random: Contract

  // Allow for each type to be tested. The env var here must be
  // the same value that is passed to the batch submitter
  const batchType = envConfig.BATCH_SUBMITTER_SEQUENCER_BATCH_TYPE.toUpperCase()

  before(async () => {
    env = await OptimismEnv.new()

    const BobaTuringCreditAddress = await env.addressesBOBA.BobaTuringCredit

    BobaTuringCredit = getContractFactory(
      'BobaTuringCredit',
      env.l2Wallet
    ).attach(BobaTuringCreditAddress)

    L1BOBAToken = new Contract(
      env.addressesBOBA.TOKENS.BOBA.L1,
      L1ERC20Json.abi,
      env.l1Wallet
    )

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
    console.log('    Helper contract deployed at', TuringHelper.address)
    await TuringHelper.deployTransaction.wait()

    Factory__Random = new ContractFactory(
      HelloTuringJson.abi,
      HelloTuringJson.bytecode,
      env.l2Wallet
    )
    random = await Factory__Random.deploy(TuringHelper.address)
    console.log('    Test random contract deployed at', random.address)
    await random.deployTransaction.wait()

    const tr1 = await TuringHelper.addPermittedCaller(random.address)
    const res1 = await tr1.wait()
    console.log(
      '    addingPermittedCaller to TuringHelper',
      res1.events[0].data
    )

    const L1StandardBridgeAddress = await env.addressesBASE
      .Proxy__L1StandardBridge

    L1StandardBridge = getContractFactory(
      'L1StandardBridge',
      env.l1Wallet
    ).attach(L1StandardBridgeAddress)
  })

  it.only('{tag:boba} Should transfer BOBA to L2', async () => {
    const depositBOBAAmount = utils.parseEther('10')

    const preL1BOBABalance = await L1BOBAToken.balanceOf(env.l1Wallet.address)
    const preL2BOBABalance = await L2BOBAToken.balanceOf(env.l2Wallet.address)

    const approveL1BOBATX = await L1BOBAToken.approve(
      L1StandardBridge.address,
      depositBOBAAmount
    )
    await approveL1BOBATX.wait()

    await env.waitForXDomainTransaction(
      L1StandardBridge.depositERC20(
        L1BOBAToken.address,
        L2BOBAToken.address,
        depositBOBAAmount,
        9999999,
        ethers.utils.formatBytes32String(new Date().getTime().toString())
      )
    )

    const postL1BOBABalance = await L1BOBAToken.balanceOf(env.l1Wallet.address)
    const postL2BOBABalance = await L2BOBAToken.balanceOf(env.l2Wallet.address)

    expect(preL1BOBABalance).to.deep.eq(
      postL1BOBABalance.add(depositBOBAAmount)
    )

    expect(preL2BOBABalance).to.deep.eq(
      postL2BOBABalance.sub(depositBOBAAmount)
    )
  })

  it.only('{tag:boba} contract should be whitelisted', async () => {
    const tr2 = await TuringHelper.checkPermittedCaller(random.address)
    const res2 = await tr2.wait()
    const rawData = res2.events[0].data
    const result = parseInt(rawData.slice(-64), 16)
    expect(result).to.equal(1)
    console.log(
      '    Test contract whitelisted in TuringHelper (1 = yes)?',
      result
    )
  })

  it.only('{tag:boba} Should register and fund your Turing helper contract in turingCredit and get a 256 bit random number', async () => {
    env = await OptimismEnv.new()

    const depositAmount = utils.parseEther('0.1')

    const preBalance = await BobaTuringCredit.prepaidBalance(
      TuringHelper.address
    )
    console.log('    Credit Prebalance', preBalance.toString())

    const bobaBalance = await L2BOBAToken.balanceOf(env.l2Wallet.address)
    console.log('    BOBA Balance in your account', bobaBalance.toString())

    const approveTx = await L2BOBAToken.approve(
      BobaTuringCredit.address,
      depositAmount
    )
    await approveTx.wait()

    const depositTx = await BobaTuringCredit.addBalanceTo(
      depositAmount,
      TuringHelper.address
    )
    await depositTx.wait()

    const postBalance = await BobaTuringCredit.prepaidBalance(
      TuringHelper.address
    )

    expect(postBalance).to.be.deep.eq(preBalance.add(depositAmount))

    const tr = await random.getRandom()
    const res = await tr.wait()
    expect(res).to.be.ok
    const rawData = res.events[0].data
    const numberHexString = '0x' + rawData.slice(-64)
    const result = BigInt(numberHexString)
    console.log('    Turing VRF 256 =', result)
  })

  it.only('{tag:boba} should fetch batches', async () => {
    let tip = await env.l1Provider.getBlockNumber()
    const ctc = env.messenger.contracts.l1.CanonicalTransactionChain
    let logs = await ctc.queryFilter(
      ctc.filters.TransactionBatchAppended(),
      0,
      tip
    )
    let args = logs[logs.length - 1].args
    let _prevTotalElements = args._prevTotalElements.toNumber()
    let _batchSize = args._batchSize.toNumber()

    // make sure that bacth submitter submits all L2 block data to L1 CTC contract
    const lastestL2Block = await env.l2Provider.getBlockNumber()
    while (_prevTotalElements + _batchSize < lastestL2Block) {
      await sleep(1000)
      tip = await env.l1Provider.getBlockNumber()
      logs = await ctc.queryFilter(
        ctc.filters.TransactionBatchAppended(),
        0,
        tip
      )
      args = logs[logs.length - 1].args
      _prevTotalElements = args._prevTotalElements.toNumber()
      _batchSize = args._batchSize.toNumber()
    }

    // collect all of the batches
    const batches = []
    for (const log of logs) {
      const tx = await env.l1Provider.getTransaction(log.transactionHash)
      batches.push(tx.data)
    }

    expect(batches.length).to.be.gt(0, 'Submit some batches first')

    let latest = 0
    // decode all of the batches
    for (const batch of batches) {
      // Typings don't work?
      const decoded = (SequencerBatch as any).fromHex(batch)
      expect(decoded.type).to.eq(BatchType[batchType])

      // Iterate over all of the transactions, fetch them
      // by hash and make sure their blocknumbers are in
      // ascending order. This lets us skip handling deposits here
      for (const transaction of decoded.transactions) {
        const tx = transaction.toTransaction()
        const restoredData = turingParse_v1(tx.data)
        tx.data = restoredData
        const serializedTx = ethers.utils.serializeTransaction(
          {
            nonce: tx.nonce,
            gasPrice: tx.gasPrice,
            gasLimit: tx.gasLimit,
            value: tx.value,
            to: tx.to,
            data: tx.data,
            chainId: tx.chainId,
          },
          { r: tx.r, v: tx.v, s: tx.s }
        )
        const transactionHash = ethers.utils.keccak256(serializedTx)
        const got = await env.l2Provider.getTransaction(transactionHash)
        expect(got).to.not.eq(null)
        expect(got.blockNumber).to.be.gt(latest)
        // make sure that verifier sync all blocks
        let verifierBlockNumber = await env.verifierProvider.getBlockNumber()
        while (verifierBlockNumber < got.blockNumber) {
          await sleep(1000)
          verifierBlockNumber = await env.verifierProvider.getBlockNumber()
        }
        const verifierGot = await env.verifierProvider.getTransaction(
          transactionHash
        )
        expect(verifierGot).to.not.eq(null)
        expect(got.blockNumber).to.be.eq(verifierGot.blockNumber)
        latest = got.blockNumber
      }
    }
  })
})

const turingParse_v1 = (decodedTxData: string): string => {
  // This MIGHT have a Turing payload inside of it...
  let dataHexString = remove0x(decodedTxData)

  // First, parse the version and length field...
  // TuringVersion not used right now; for future use and for supporting legacy packets
  const turingLength = parseInt(dataHexString.slice(2, 6), 16) * 2 // * 2 because we are operating on the hex string

  if (turingLength === 0) {
    // The .slice(headerLength) chops off the Turing header
    // '6' is correct here because we are operating on the string
    dataHexString = dataHexString.slice(6)
    return add0x(dataHexString)
  } else if (turingLength > 0 && turingLength < dataHexString.length) {
    const turingCandidate = dataHexString.slice(-turingLength)

    const turingCall = turingCandidate.slice(0, 8).toLowerCase()

    // methodID for GetResponse is 7d93616c -> [125 147 97 108]
    // methodID for GetRandom   is 493d57d6 -> [ 73  61 87 214]
    if (turingCall === '7d93616c' || turingCall === '493d57d6') {
      // we are all set! we have a Turing v1 payload
      dataHexString = dataHexString.slice(6, -turingLength)
      // The `headerLength` chops off the Turing length header field, and the `-turingLength` chops off the Turing bytes
      // '6' is correct here because we are operating on the string
      return add0x(dataHexString)
    } else {
      // unknown/corrupted/legacy format
      // In this case, will add '0x', the default, and do nothing
      return add0x(dataHexString)
    }
  } else {
    // unknown/corrupted/legacy format
    // In this case, will add '0x', the default, and do nothing
    return add0x(dataHexString)
  }
}

export const parseSignatureVParam = (
  v: number | ethers.BigNumber | string,
  chainId: number
): number => {
  v = ethers.BigNumber.from(v).toNumber()
  // Handle unprotected transactions
  if (v === 27 || v === 28) {
    return v
  }
  // Handle EIP155 transactions
  return v - 2 * chainId - 35
}
