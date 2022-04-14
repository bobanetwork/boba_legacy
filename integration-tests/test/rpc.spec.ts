import { expectApprox, injectL2Context } from '@eth-optimism/core-utils'
import { Wallet, BigNumber, Contract, ContractFactory } from 'ethers'
import { serialize } from '@ethersproject/transactions'
import { ethers } from 'hardhat'
import chai, { expect } from 'chai'
import {
  sleep,
  l2Provider,
  defaultTransactionFactory,
  fundUser,
  L2_CHAINID,
  isLiveNetwork,
  gasPriceForL2,
  replicaProvider,
} from './shared/utils'
import chaiAsPromised from 'chai-as-promised'
import { OptimismEnv } from './shared/env'
import {
  TransactionReceipt,
  TransactionRequest,
} from '@ethersproject/providers'
import { solidity } from 'ethereum-waffle'
import simpleStorageJson from '../artifacts/contracts/SimpleStorage.sol/SimpleStorage.json'

chai.use(chaiAsPromised)
chai.use(solidity)

describe('Basic RPC tests', () => {
  let env: OptimismEnv
  let wallet: Wallet
  let replicaWallet: Wallet

  const provider = injectL2Context(l2Provider)
  const l2ReplicaProvider = injectL2Context(replicaProvider)

  let Reverter: Contract
  let revertMessage: string
  let revertingTx: TransactionRequest
  let revertingDeployTx: TransactionRequest

  before(async () => {
    env = await OptimismEnv.new()
    wallet = env.l2Wallet
    replicaWallet = env.l2Wallet_2.connect(env.replicaProvider)

    const Factory__Reverter = await ethers.getContractFactory(
      'Reverter',
      wallet
    )
    Reverter = await Factory__Reverter.connect(env.l2Wallet).deploy()
    await Reverter.deployTransaction.wait()
    revertMessage = await Reverter.revertMessage()
    revertingTx = {
      to: Reverter.address,
      data: Reverter.interface.encodeFunctionData('doRevert'),
    }
    const Factory__ConstructorReverter = await ethers.getContractFactory(
      'ConstructorReverter',
      wallet
    )
    revertingDeployTx = {
      data: Factory__ConstructorReverter.bytecode,
    }
  })

  describe('eth_sendRawTransaction', () => {
    it('{tag:boba} should correctly process a valid transaction', async () => {
      const tx = defaultTransactionFactory()
      tx.gasPrice = await gasPriceForL2()
      const nonce = await wallet.getTransactionCount()
      const result = await wallet.sendTransaction(tx)

      expect(result.from).to.equal(wallet.address)
      expect(result.nonce).to.equal(nonce)
      expect(result.gasLimit.toNumber()).to.equal(tx.gasLimit)
      expect(result.gasPrice.toNumber()).to.equal(tx.gasPrice)
      expect(result.data).to.equal(tx.data)
    })

    it('{tag:boba} should not accept a transaction with the wrong chain ID', async () => {
      const tx = {
        ...defaultTransactionFactory(),
        gasPrice: await gasPriceForL2(),
        chainId: (await wallet.getChainId()) + 1,
      }

      await expect(
        provider.sendTransaction(await wallet.signTransaction(tx))
      ).to.be.rejectedWith('invalid transaction: invalid sender')
    })

    it('{tag:boba} should accept a transaction without a chain ID', async () => {
      const tx = {
        ...defaultTransactionFactory(),
        nonce: await wallet.getTransactionCount(),
        gasPrice: await gasPriceForL2(),
        chainId: null, // Disables EIP155 transaction signing.
      }
      const signed = await wallet.signTransaction(tx)
      const response = await provider.sendTransaction(signed)

      expect(response.chainId).to.equal(0)
      const v = response.v
      expect(v === 27 || v === 28).to.be.true
    })

    it('{tag:boba} should accept a transaction with a value', async () => {
      const tx = {
        ...defaultTransactionFactory(),
        gasPrice: await gasPriceForL2(),
        chainId: await env.l2Wallet.getChainId(),
        data: '0x',
        value: ethers.utils.parseEther('0.1'),
      }

      const balanceBefore = await provider.getBalance(env.l2Wallet.address)
      const result = await env.l2Wallet.sendTransaction(tx)
      const receipt = await result.wait()
      expect(receipt.status).to.deep.equal(1)

      const balAfter = await provider.getBalance(env.l2Wallet.address)
      expect(balAfter.lte(balanceBefore.sub(ethers.utils.parseEther('0.1')))).to
        .be.true
    })

    it('{tag:boba} should reject a transaction with higher value than user balance', async () => {
      const balance = await env.l2Wallet.getBalance()
      const tx = {
        ...defaultTransactionFactory(),
        gasPrice: await gasPriceForL2(),
        chainId: await env.l2Wallet.getChainId(),
        data: '0x',
        value: balance.add(ethers.utils.parseEther('1')),
      }

      await expect(env.l2Wallet.sendTransaction(tx)).to.be.rejectedWith(
        'invalid transaction: insufficient funds for gas * price + value'
      )
    })

    it('{tag:boba} should correctly report OOG for contract creations', async () => {
      const factory = await ethers.getContractFactory('TestOOGInConstructor')

      await expect(factory.connect(wallet).deploy()).to.be.rejectedWith(
        'gas required exceeds allowance'
      )
    })
  })

  describe('eth_call', () => {
    it('{tag:boba} should correctly identify call out-of-gas', async () => {
      await expect(
        provider.call({
          ...revertingTx,
          gasLimit: 1,
        })
      ).to.be.rejectedWith('out of gas')
    })

    it('{tag:boba} should correctly return solidity revert data from a call', async () => {
      await expect(provider.call(revertingTx)).to.be.revertedWith(revertMessage)
    })

    it('{tag:boba} should produce error when called from ethers', async () => {
      await expect(Reverter.doRevert()).to.be.revertedWith(revertMessage)
    })

    it('{tag:boba} should correctly return revert data from contract creation', async () => {
      await expect(provider.call(revertingDeployTx)).to.be.revertedWith(
        revertMessage
      )
    })

    it('{tag:boba} should correctly identify contract creation out of gas', async () => {
      await expect(
        provider.call({
          ...revertingDeployTx,
          gasLimit: 1,
        })
      ).to.be.rejectedWith('out of gas')
    })

    it('{tag:boba} should allow eth_calls with nonzero value', async () => {
      // Deploy a contract to check msg.value of the call
      const Factory__ValueContext: ContractFactory =
        await ethers.getContractFactory('ValueContext', wallet)
      const ValueContext: Contract = await Factory__ValueContext.deploy()
      await ValueContext.deployTransaction.wait()

      // Fund account to call from
      const from = wallet.address
      const value = 15
      await fundUser(env.watcher, env.l1Bridge, value, from)

      // Do the call and check msg.value
      const data = ValueContext.interface.encodeFunctionData('getCallValue')
      const res = await provider.call({
        to: ValueContext.address,
        from,
        data,
        value,
      })

      expect(res).to.eq(BigNumber.from(value))
    })
  })

  describe('eth_getTransactionReceipt', () => {
    it('{tag:boba} correctly exposes revert data for contract calls', async () => {
      const req: TransactionRequest = {
        ...revertingTx,
        gasLimit: 8_000_000, // override gas estimation
      }

      const tx = await wallet.sendTransaction(req)

      let errored = false
      try {
        await tx.wait()
      } catch (e) {
        errored = true
      }
      expect(errored).to.be.true

      const receipt: TransactionReceipt = await provider.getTransactionReceipt(
        tx.hash
      )

      expect(receipt.status).to.eq(0)
    })

    it('{tag:boba} correctly exposes revert data for contract creations', async () => {
      const req: TransactionRequest = {
        ...revertingDeployTx,
        gasLimit: 8_000_000, // override gas estimation
      }

      const tx = await wallet.sendTransaction(req)

      let errored = false
      try {
        await tx.wait()
      } catch (e) {
        errored = true
      }
      expect(errored).to.be.true

      const receipt: TransactionReceipt = await provider.getTransactionReceipt(
        tx.hash
      )

      expect(receipt.status).to.eq(0)
    })

    // Optimistic Ethereum special fields on the receipt
    it('{tag:boba} includes L1 gas price and L1 gas used', async () => {
      const tx = await env.l2Wallet.populateTransaction({
        to: env.l2Wallet.address,
        gasPrice: await gasPriceForL2(),
      })

      const raw = serialize({
        nonce: parseInt(tx.nonce.toString(), 10),
        to: tx.to,
        gasLimit: tx.gasLimit,
        gasPrice: tx.gasPrice,
        type: tx.type,
        data: tx.data,
      })

      const l1Fee = await env.gasPriceOracle.getL1Fee(raw)
      const l1GasPrice = await env.gasPriceOracle.l1BaseFee()
      const l1GasUsed = await env.gasPriceOracle.getL1GasUsed(raw)
      const scalar = await env.gasPriceOracle.scalar()
      const decimals = await env.gasPriceOracle.decimals()

      const scaled = scalar.toNumber() / 10 ** decimals.toNumber()

      const res = await env.l2Wallet.sendTransaction(tx)
      await res.wait()

      const json = await env.l2Provider.send('eth_getTransactionReceipt', [
        res.hash,
      ])

      expect(l1GasUsed).to.deep.equal(BigNumber.from(json.l1GasUsed))
      expect(l1GasPrice).to.deep.equal(BigNumber.from(json.l1GasPrice))
      expect(scaled.toString()).to.deep.equal(json.l1FeeScalar)
      expect(l1Fee).to.deep.equal(BigNumber.from(json.l1Fee))
    })
  })

  describe('eth_getTransactionByHash', () => {
    it('{tag:boba} should be able to get all relevant l1/l2 transaction data', async () => {
      const tx = defaultTransactionFactory()
      tx.gasPrice = await gasPriceForL2()
      const result = await wallet.sendTransaction(tx)
      await result.wait()

      const transaction = (await provider.getTransaction(result.hash)) as any
      expect(transaction.queueOrigin).to.equal('sequencer')
      expect(transaction.transactionIndex).to.be.eq(0)
      expect(transaction.gasLimit).to.be.deep.eq(BigNumber.from(tx.gasLimit))
    })
  })

  describe('eth_getBlockByHash', () => {
    it('{tag:boba} should return the block and all included transactions', async () => {
      // Send a transaction and wait for it to be mined.
      const tx = defaultTransactionFactory()
      tx.gasPrice = await gasPriceForL2()
      const result = await wallet.sendTransaction(tx)
      const receipt = await result.wait()

      const block = (await provider.getBlockWithTransactions(
        receipt.blockHash
      )) as any

      expect(block.number).to.not.equal(0)
      expect(typeof block.stateRoot).to.equal('string')
      expect(block.transactions.length).to.equal(1)
      expect(block.transactions[0].queueOrigin).to.equal('sequencer')
      expect(block.transactions[0].l1TxOrigin).to.equal(null)
    })
  })

  describe('eth_getBlockByNumber', () => {
    // There was a bug that causes transactions to be reingested over
    // and over again only when a single transaction was in the
    // canonical transaction chain. This test catches this by
    // querying for the latest block and then waits and then queries
    // the latest block again and then asserts that they are the same.
    //
    // Needs to be skipped on Prod networks because this test doesn't work when
    // other people are sending transactions to the Sequencer at the same time
    // as this test is running.
    it('{tag:boba} should return the same result when new transactions are not applied', async function () {
      if (isLiveNetwork()) {
        this.skip()
      }

      // Get latest block once to start.
      const prev = await provider.getBlockWithTransactions('latest')
      // set wait to null to allow a deep object comparison
      prev.transactions[0].wait = null

      // Over ten seconds, repeatedly check the latest block to make sure nothing has changed.
      for (let i = 0; i < 5; i++) {
        const latest = await provider.getBlockWithTransactions('latest')
        latest.transactions[0].wait = null
        // Check each key of the transaction individually
        // for easy debugging if one field changes
        for (const [key, value] of Object.entries(latest.transactions[0])) {
          expect(value).to.deep.equal(
            prev.transactions[0][key],
            `mismatch ${key}`
          )
        }
        expect(latest).to.deep.equal(prev)
        await sleep(2000)
      }
    })
  })

  describe('eth_getBalance', () => {
    it('{tag:boba} should get the OVM_ETH balance', async () => {
      const rpcBalance = await provider.getBalance(env.l2Wallet.address)
      const contractBalance = await env.ovmEth.balanceOf(env.l2Wallet.address)
      expect(rpcBalance).to.be.deep.eq(contractBalance)
    })
  })

  describe('eth_chainId', () => {
    it('{tag:boba} should get the correct chainid', async () => {
      const { chainId } = await provider.getNetwork()
      expect(chainId).to.be.eq(L2_CHAINID)
    })
  })

  describe('eth_estimateGas', () => {
    it('{tag:boba} gas estimation is deterministic', async () => {
      let lastEstimate: BigNumber
      for (let i = 0; i < 10; i++) {
        const estimate = await l2Provider.estimateGas({
          to: defaultTransactionFactory().to,
          value: 0,
        })

        if (i > 0) {
          expect(lastEstimate).to.be.eq(estimate)
        }

        lastEstimate = estimate
      }
    })

    it('{tag:boba} should return a gas estimate for txs with empty data', async () => {
      const estimate = await l2Provider.estimateGas({
        to: defaultTransactionFactory().to,
        value: 0,
      })
      // Expect gas to be less than or equal to the target plus 1%
      expectApprox(estimate, 21000, { percentUpperDeviation: 1 })
    })

    it('{tag:boba} should fail for a reverting call transaction', async () => {
      await expect(provider.send('eth_estimateGas', [revertingTx])).to.be
        .reverted
    })

    it('{tag:boba} should fail for a reverting deploy transaction', async () => {
      await expect(provider.send('eth_estimateGas', [revertingDeployTx])).to.be
        .reverted
    })
  })

  describe('debug_traceTransaction', () => {
    it('{tag:boba} should match debug_traceBlock', async () => {
      const storage = new ContractFactory(
        simpleStorageJson.abi,
        simpleStorageJson.bytecode,
        env.l2Wallet
      )
      const tx = (await storage.deploy()).deployTransaction
      const receipt = await tx.wait()

      const txTrace = await provider.send('debug_traceTransaction', [
        receipt.transactionHash,
      ])
      const blockTrace = await provider.send('debug_traceBlockByHash', [
        receipt.blockHash,
      ])
      expect(txTrace).to.deep.equal(blockTrace[0].result)
    })
  })

  describe('rollup_gasPrices', () => {
    it('{tag:boba} should return the L1 and L2 gas prices', async () => {
      const result = await provider.send('rollup_gasPrices', [])
      const l1GasPrice = await env.gasPriceOracle.l1BaseFee()
      const l2GasPrice = await env.gasPriceOracle.gasPrice()

      expect(BigNumber.from(result.l1GasPrice)).to.deep.eq(l1GasPrice)
      expect(BigNumber.from(result.l2GasPrice)).to.deep.eq(l2GasPrice)
    })
  })

  describe('Replica RPC forward test', () => {
    it('{tag:boba} should correctly process a valid transaction', async () => {
      const tx = defaultTransactionFactory()
      tx.gasPrice = await gasPriceForL2()
      const nonce = await replicaWallet.getTransactionCount()
      const result = await replicaWallet.sendTransaction(tx)
      await result.wait()

      expect(result.from).to.equal(replicaWallet.address)
      expect(result.nonce).to.equal(nonce)
      expect(result.gasLimit.toNumber()).to.equal(tx.gasLimit)
      expect(result.gasPrice.toNumber()).to.equal(tx.gasPrice)
      expect(result.data).to.equal(tx.data)
    })

    it('{tag:boba} should not accept a transaction with the wrong chain ID', async () => {
      const tx = {
        ...defaultTransactionFactory(),
        gasPrice: await gasPriceForL2(),
        chainId: (await replicaWallet.getChainId()) + 1,
      }

      await expect(
        l2ReplicaProvider.sendTransaction(
          await replicaWallet.signTransaction(tx)
        )
      ).to.be.rejectedWith('invalid transaction: invalid sender')
    })

    it('{tag:boba} should accept a transaction without a chain ID', async () => {
      const tx = {
        ...defaultTransactionFactory(),
        nonce: await replicaWallet.getTransactionCount(),
        gasPrice: await gasPriceForL2(),
        chainId: null, // Disables EIP155 transaction signing.
      }
      const signed = await replicaWallet.signTransaction(tx)
      const response = await l2ReplicaProvider.sendTransaction(signed)
      await response.wait()

      expect(response.chainId).to.equal(0)
      const v = response.v
      expect(v === 27 || v === 28).to.be.true
    })

    it('{tag:boba} should accept a transaction with a value', async () => {
      const tx = {
        ...defaultTransactionFactory(),
        gasPrice: await gasPriceForL2(),
        chainId: await replicaWallet.getChainId(),
        data: '0x',
        value: ethers.utils.parseEther('0.1'),
      }

      const balanceBefore = await l2ReplicaProvider.getBalance(
        replicaWallet.address
      )
      const result = await replicaWallet.sendTransaction(tx)
      const receipt = await result.wait()
      expect(receipt.status).to.deep.equal(1)

      const balAfter = await l2ReplicaProvider.getBalance(replicaWallet.address)
      expect(balAfter.lte(balanceBefore.sub(ethers.utils.parseEther('0.1')))).to
        .be.true
    })

    it('{tag:boba} should reject a transaction with higher value than user balance', async () => {
      const balance = await replicaWallet.getBalance()
      const tx = {
        ...defaultTransactionFactory(),
        gasPrice: await gasPriceForL2(),
        chainId: await replicaWallet.getChainId(),
        data: '0x',
        value: balance.add(ethers.utils.parseEther('1')),
      }

      await expect(replicaWallet.sendTransaction(tx)).to.be.rejectedWith(
        'invalid transaction: insufficient funds for gas * price + value'
      )
    })

    it('{tag:boba} should correctly report OOG for contract creations', async () => {
      const factory = await ethers.getContractFactory('TestOOGInConstructor')

      await expect(factory.connect(replicaWallet).deploy()).to.be.rejectedWith(
        'gas required exceeds allowance'
      )
    })
  })
})
