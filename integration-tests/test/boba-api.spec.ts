import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)

/* Imports: External */
import { ethers, BigNumber, Contract, Wallet } from 'ethers'
import { predeploys, getContractFactory } from '@eth-optimism/contracts'
import ethSigUtil from 'eth-sig-util'
import util from 'util'

/* Imports: Internal */
import { OptimismEnv } from './shared/env'
import { gasPriceOracleWallet } from './shared/utils'
import { rinkebySwapBOBAForETH, mainnetSwapBOBAForETH } from '@boba/api'

describe('Boba API Tests', async () => {
  let env: OptimismEnv
  let L2Boba: Contract
  let Boba_GasPriceOracle: Contract

  before(async () => {
    env = await OptimismEnv.new()

    L2Boba = getContractFactory('L2GovernanceERC20')
      .attach(predeploys.L2GovernanceERC20)
      .connect(env.l2Wallet)
    Boba_GasPriceOracle = getContractFactory('Boba_GasPriceOracle')
      .attach(predeploys.Proxy__Boba_GasPriceOracle)
      .connect(env.l2Wallet)
  })

  describe('Meta Transaction API Tests', async () => {
    let EIP712Domain: any
    let Permit: any
    let name: string
    let version: string
    let chainId: number

    before(async () => {
      EIP712Domain = [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ]
      Permit = [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ]

      name = await L2Boba.name()
      version = '1'
      chainId = (await env.l2Provider.getNetwork()).chainId

      // Add ETH first
      await env.l2Wallet.sendTransaction({
        to: Boba_GasPriceOracle.address,
        value: ethers.utils.parseEther('10'),
      })

      // Load env
      process.env.L2_NODE_WEB3_URL = env.l2Provider.connection.url
      process.env.PRIVATE_KEY = env.l2Wallet.privateKey
      process.env.BOBA_GASPRICEORACLE_ADDRESS = Boba_GasPriceOracle.address
      process.env.L2_BOBA_ADDRESS = L2Boba.address
    })

    describe('Mainnet', async () => {
      it('{tag:boba} should swap BOBA for ETH', async () => {
        const owner = env.l2Wallet_2.address
        const spender = Boba_GasPriceOracle.address
        const receivedETHAmount = await Boba_GasPriceOracle.receivedETHAmount()
        const value = (await Boba_GasPriceOracle.getBOBAForSwap()).toString()
        const nonce = (await L2Boba.nonces(env.l2Wallet_2.address)).toNumber()
        const deadline = Math.floor(Date.now() / 1000) + 90
        const verifyingContract = L2Boba.address

        const data: any = {
          primaryType: 'Permit',
          types: { EIP712Domain, Permit },
          domain: { name, version, chainId, verifyingContract },
          message: { owner, spender, value, nonce, deadline },
        }

        const signature = ethSigUtil.signTypedData(
          Buffer.from(env.l2Wallet_2.privateKey.slice(2), 'hex'),
          { data }
        )

        const payload = { owner, spender, value, deadline, signature, data }
        const asyncMainnetSwapBOBAForETH: any = util.promisify(
          mainnetSwapBOBAForETH
        )

        const BobaBalanceBefore = await L2Boba.balanceOf(env.l2Wallet_2.address)
        const ETHBalanceBefore = await env.l2Wallet_2.getBalance()
        const GPO_ETHBalanceBefore = await env.l2Provider.getBalance(
          Boba_GasPriceOracle.address
        )

        const response = await asyncMainnetSwapBOBAForETH(
          { body: JSON.stringify(payload) },
          null
        )

        const BobaBalanceAfter = await L2Boba.balanceOf(env.l2Wallet_2.address)
        const ETHBalanceAfter = await env.l2Wallet_2.getBalance()
        const GPO_ETHBalanceAfter = await env.l2Provider.getBalance(
          Boba_GasPriceOracle.address
        )

        expect(response.statusCode).to.equal(201)

        expect(BobaBalanceAfter).to.be.deep.eq(
          BobaBalanceBefore.sub(BigNumber.from(value))
        )
        expect(ETHBalanceAfter).to.be.deep.eq(
          ETHBalanceBefore.add(receivedETHAmount)
        )
        expect(GPO_ETHBalanceAfter).to.be.deep.eq(
          GPO_ETHBalanceBefore.sub(receivedETHAmount)
        )
      })

      it('{tag:boba} should return error messages using the wrong payload', async () => {
        // Get balance
        const BobaBalanceBefore = await L2Boba.balanceOf(env.l2Wallet_2.address)
        const ETHBalanceBefore = await env.l2Wallet_2.getBalance()
        const GPO_ETHBalanceBefore = await env.l2Provider.getBalance(
          Boba_GasPriceOracle.address
        )

        // Missing parameters
        const owner = env.l2Wallet_2.address
        const spender = Boba_GasPriceOracle.address
        const value = (await Boba_GasPriceOracle.getBOBAForSwap()).toString()
        const nonce = (await L2Boba.nonces(env.l2Wallet_2.address)).toNumber()
        const deadline = Math.floor(Date.now() / 1000) + 90
        const verifyingContract = L2Boba.address

        const data: any = {
          primaryType: 'Permit',
          types: { EIP712Domain, Permit },
          domain: { name, version, chainId, verifyingContract },
          message: { owner, spender, value, nonce, deadline },
        }

        const signature = ethSigUtil.signTypedData(
          Buffer.from(env.l2Wallet_2.privateKey.slice(2), 'hex'),
          { data }
        )

        const payload_1 = { owner, spender, value, deadline, signature }
        const asyncMainnetSwapBOBAForETH: any = util.promisify(
          mainnetSwapBOBAForETH
        )
        const response_1 = await asyncMainnetSwapBOBAForETH(
          { body: JSON.stringify(payload_1) },
          null
        )
        const errorMessage_1 = JSON.parse(response_1.body).error
        expect(response_1.statusCode).to.equal(400)
        expect(errorMessage_1).to.equal('Missing parameters')

        // Wrong signature
        const invalidSignature = ethSigUtil.signTypedData(
          Buffer.from(env.l2Wallet.privateKey.slice(2), 'hex'),
          { data }
        )
        const payload_2 = {
          owner,
          spender,
          value,
          deadline,
          signature: invalidSignature,
          data,
        }

        const response_2 = await asyncMainnetSwapBOBAForETH(
          { body: JSON.stringify(payload_2) },
          null
        )
        const errorMessage_2 = JSON.parse(response_2.body).error
        expect(response_2.statusCode).to.equal(400)
        expect(errorMessage_2).to.equal('Invalid signature')

        // Insufficient BOBA balance
        const randomWallet = Wallet.createRandom().connect(
          env.l2Wallet.provider
        )
        const invalidData = {
          primaryType: 'Permit',
          types: { EIP712Domain, Permit },
          domain: { name, version, chainId, verifyingContract },
          message: {
            owner: randomWallet.address,
            spender,
            value,
            nonce,
            deadline,
          },
        }

        const signature_3 = ethSigUtil.signTypedData(
          Buffer.from(randomWallet.privateKey.slice(2), 'hex'),
          { data: invalidData }
        )

        const payload_3 = {
          owner: randomWallet.address,
          spender,
          value,
          deadline,
          signature: signature_3,
          data: invalidData,
        }
        const response_3 = await asyncMainnetSwapBOBAForETH(
          { body: JSON.stringify(payload_3) },
          null
        )
        const errorMessage_3 = JSON.parse(response_3.body).error
        expect(response_3.statusCode).to.equal(400)
        expect(errorMessage_3).to.equal('Insufficient balance')

        // Get balance
        const BobaBalanceAfter = await L2Boba.balanceOf(env.l2Wallet_2.address)
        const ETHBalanceAfter = await env.l2Wallet_2.getBalance()
        const GPO_ETHBalanceAfter = await env.l2Provider.getBalance(
          Boba_GasPriceOracle.address
        )

        expect(BobaBalanceAfter).to.be.deep.eq(BobaBalanceBefore)
        expect(ETHBalanceAfter).to.be.deep.eq(ETHBalanceBefore)
        expect(GPO_ETHBalanceAfter).to.be.deep.eq(GPO_ETHBalanceBefore)
      })

      it('{tag:boba} should return reverted reason from API if Boba_GasPriceOracle has insufficient ETH', async () => {
        // withdraw ETH first
        await Boba_GasPriceOracle.connect(gasPriceOracleWallet).withdrawETH()
        const Boba_GasPriceOracleBalance = await env.l2Provider.getBalance(
          Boba_GasPriceOracle.address
        )
        expect(Boba_GasPriceOracleBalance).to.be.equal(BigNumber.from('0'))

        // should revert
        const owner = env.l2Wallet_2.address
        const spender = Boba_GasPriceOracle.address
        const value = (await Boba_GasPriceOracle.getBOBAForSwap()).toString()
        const nonce = (await L2Boba.nonces(env.l2Wallet_2.address)).toNumber()
        const deadline = Math.floor(Date.now() / 1000) + 90
        const verifyingContract = L2Boba.address

        const data: any = {
          primaryType: 'Permit',
          types: { EIP712Domain, Permit },
          domain: { name, version, chainId, verifyingContract },
          message: { owner, spender, value, nonce, deadline },
        }

        const signature = ethSigUtil.signTypedData(
          Buffer.from(env.l2Wallet_2.privateKey.slice(2), 'hex'),
          { data }
        )

        const payload = { owner, spender, value, deadline, signature, data }
        const asyncMainnetSwapBOBAForETH: any = util.promisify(
          mainnetSwapBOBAForETH
        )

        const BobaBalanceBefore = await L2Boba.balanceOf(env.l2Wallet_2.address)
        const ETHBalanceBefore = await env.l2Wallet_2.getBalance()
        const GPO_ETHBalanceBefore = await env.l2Provider.getBalance(
          Boba_GasPriceOracle.address
        )

        const response = await asyncMainnetSwapBOBAForETH(
          { body: JSON.stringify(payload) },
          null
        )

        const BobaBalanceAfter = await L2Boba.balanceOf(env.l2Wallet_2.address)
        const ETHBalanceAfter = await env.l2Wallet_2.getBalance()
        const GPO_ETHBalanceAfter = await env.l2Provider.getBalance(
          Boba_GasPriceOracle.address
        )

        expect(response.statusCode).to.equal(400)
        expect(
          JSON.parse(JSON.parse(response.body).error.error.error.body).error
            .message
        ).to.equal('execution reverted: Failed to send ETH')

        expect(BobaBalanceAfter).to.be.deep.eq(BobaBalanceBefore)
        expect(ETHBalanceAfter).to.be.deep.eq(ETHBalanceBefore)
        expect(GPO_ETHBalanceAfter).to.be.deep.eq(GPO_ETHBalanceBefore)

        // Add funds
        await env.l2Wallet.sendTransaction({
          to: Boba_GasPriceOracle.address,
          value: ethers.utils.parseEther('10'),
        })
      })
    })

    describe('Rinkeby', async () => {
      it('{tag:boba} should swap BOBA for ETH', async () => {
        const owner = env.l2Wallet_2.address
        const spender = Boba_GasPriceOracle.address
        const receivedETHAmount = await Boba_GasPriceOracle.receivedETHAmount()
        const value = (await Boba_GasPriceOracle.getBOBAForSwap()).toString()
        const nonce = (await L2Boba.nonces(env.l2Wallet_2.address)).toNumber()
        const deadline = Math.floor(Date.now() / 1000) + 90
        const verifyingContract = L2Boba.address

        const data: any = {
          primaryType: 'Permit',
          types: { EIP712Domain, Permit },
          domain: { name, version, chainId, verifyingContract },
          message: { owner, spender, value, nonce, deadline },
        }

        const signature = ethSigUtil.signTypedData(
          Buffer.from(env.l2Wallet_2.privateKey.slice(2), 'hex'),
          { data }
        )

        const payload = { owner, spender, value, deadline, signature, data }
        const asyncRinkebySwapBOBAForETH: any = util.promisify(
          rinkebySwapBOBAForETH
        )

        const BobaBalanceBefore = await L2Boba.balanceOf(env.l2Wallet_2.address)
        const ETHBalanceBefore = await env.l2Wallet_2.getBalance()
        const GPO_ETHBalanceBefore = await env.l2Provider.getBalance(
          Boba_GasPriceOracle.address
        )

        const response = await asyncRinkebySwapBOBAForETH(
          { body: JSON.stringify(payload) },
          null
        )

        const BobaBalanceAfter = await L2Boba.balanceOf(env.l2Wallet_2.address)
        const ETHBalanceAfter = await env.l2Wallet_2.getBalance()
        const GPO_ETHBalanceAfter = await env.l2Provider.getBalance(
          Boba_GasPriceOracle.address
        )

        expect(response.statusCode).to.equal(201)

        expect(BobaBalanceAfter).to.be.deep.eq(
          BobaBalanceBefore.sub(BigNumber.from(value))
        )
        expect(ETHBalanceAfter).to.be.deep.eq(
          ETHBalanceBefore.add(receivedETHAmount)
        )
        expect(GPO_ETHBalanceAfter).to.be.deep.eq(
          GPO_ETHBalanceBefore.sub(receivedETHAmount)
        )
      })

      it('{tag:boba} should return error messages using the wrong payload', async () => {
        // Get balance
        const BobaBalanceBefore = await L2Boba.balanceOf(env.l2Wallet_2.address)
        const ETHBalanceBefore = await env.l2Wallet_2.getBalance()
        const GPO_ETHBalanceBefore = await env.l2Provider.getBalance(
          Boba_GasPriceOracle.address
        )

        // Missing parameters
        const owner = env.l2Wallet_2.address
        const spender = Boba_GasPriceOracle.address
        const value = (await Boba_GasPriceOracle.getBOBAForSwap()).toString()
        const nonce = (await L2Boba.nonces(env.l2Wallet_2.address)).toNumber()
        const deadline = Math.floor(Date.now() / 1000) + 90
        const verifyingContract = L2Boba.address

        const data: any = {
          primaryType: 'Permit',
          types: { EIP712Domain, Permit },
          domain: { name, version, chainId, verifyingContract },
          message: { owner, spender, value, nonce, deadline },
        }

        const signature = ethSigUtil.signTypedData(
          Buffer.from(env.l2Wallet_2.privateKey.slice(2), 'hex'),
          { data }
        )

        const payload_1 = { owner, spender, value, deadline, signature }
        const asyncRinkebySwapBOBAForETH: any = util.promisify(
          rinkebySwapBOBAForETH
        )
        const response_1 = await asyncRinkebySwapBOBAForETH(
          { body: JSON.stringify(payload_1) },
          null
        )
        const errorMessage_1 = JSON.parse(response_1.body).error
        expect(response_1.statusCode).to.equal(400)
        expect(errorMessage_1).to.equal('Missing parameters')

        // Wrong signature
        const invalidSignature = ethSigUtil.signTypedData(
          Buffer.from(env.l2Wallet.privateKey.slice(2), 'hex'),
          { data }
        )
        const payload_2 = {
          owner,
          spender,
          value,
          deadline,
          signature: invalidSignature,
          data,
        }

        const response_2 = await asyncRinkebySwapBOBAForETH(
          { body: JSON.stringify(payload_2) },
          null
        )
        const errorMessage_2 = JSON.parse(response_2.body).error
        expect(response_2.statusCode).to.equal(400)
        expect(errorMessage_2).to.equal('Invalid signature')

        // Insufficient BOBA balance
        const randomWallet = Wallet.createRandom().connect(
          env.l2Wallet.provider
        )
        const invalidData = {
          primaryType: 'Permit',
          types: { EIP712Domain, Permit },
          domain: { name, version, chainId, verifyingContract },
          message: {
            owner: randomWallet.address,
            spender,
            value,
            nonce,
            deadline,
          },
        }

        const signature_3 = ethSigUtil.signTypedData(
          Buffer.from(randomWallet.privateKey.slice(2), 'hex'),
          { data: invalidData }
        )

        const payload_3 = {
          owner: randomWallet.address,
          spender,
          value,
          deadline,
          signature: signature_3,
          data: invalidData,
        }
        const response_3 = await asyncRinkebySwapBOBAForETH(
          { body: JSON.stringify(payload_3) },
          null
        )
        const errorMessage_3 = JSON.parse(response_3.body).error
        expect(response_3.statusCode).to.equal(400)
        expect(errorMessage_3).to.equal('Insufficient balance')

        // Get balance
        const BobaBalanceAfter = await L2Boba.balanceOf(env.l2Wallet_2.address)
        const ETHBalanceAfter = await env.l2Wallet_2.getBalance()
        const GPO_ETHBalanceAfter = await env.l2Provider.getBalance(
          Boba_GasPriceOracle.address
        )

        expect(BobaBalanceAfter).to.be.deep.eq(BobaBalanceBefore)
        expect(ETHBalanceAfter).to.be.deep.eq(ETHBalanceBefore)
        expect(GPO_ETHBalanceAfter).to.be.deep.eq(GPO_ETHBalanceBefore)
      })

      it('{tag:boba} should return reverted reason from API if Boba_GasPriceOracle has insufficient ETH', async () => {
        // withdraw ETH first
        await Boba_GasPriceOracle.connect(gasPriceOracleWallet).withdrawETH()
        const Boba_GasPriceOracleBalance = await env.l2Provider.getBalance(
          Boba_GasPriceOracle.address
        )
        expect(Boba_GasPriceOracleBalance).to.be.equal(BigNumber.from('0'))

        // should revert
        const owner = env.l2Wallet_2.address
        const spender = Boba_GasPriceOracle.address
        const value = (await Boba_GasPriceOracle.getBOBAForSwap()).toString()
        const nonce = (await L2Boba.nonces(env.l2Wallet_2.address)).toNumber()
        const deadline = Math.floor(Date.now() / 1000) + 90
        const verifyingContract = L2Boba.address

        const data: any = {
          primaryType: 'Permit',
          types: { EIP712Domain, Permit },
          domain: { name, version, chainId, verifyingContract },
          message: { owner, spender, value, nonce, deadline },
        }

        const signature = ethSigUtil.signTypedData(
          Buffer.from(env.l2Wallet_2.privateKey.slice(2), 'hex'),
          { data }
        )

        const payload = { owner, spender, value, deadline, signature, data }
        const asyncRinkebySwapBOBAForETH: any = util.promisify(
          rinkebySwapBOBAForETH
        )

        const BobaBalanceBefore = await L2Boba.balanceOf(env.l2Wallet_2.address)
        const ETHBalanceBefore = await env.l2Wallet_2.getBalance()
        const GPO_ETHBalanceBefore = await env.l2Provider.getBalance(
          Boba_GasPriceOracle.address
        )

        const response = await asyncRinkebySwapBOBAForETH(
          { body: JSON.stringify(payload) },
          null
        )

        const BobaBalanceAfter = await L2Boba.balanceOf(env.l2Wallet_2.address)
        const ETHBalanceAfter = await env.l2Wallet_2.getBalance()
        const GPO_ETHBalanceAfter = await env.l2Provider.getBalance(
          Boba_GasPriceOracle.address
        )

        expect(response.statusCode).to.equal(400)
        expect(
          JSON.parse(JSON.parse(response.body).error.error.error.body).error
            .message
        ).to.equal('execution reverted: Failed to send ETH')

        expect(BobaBalanceAfter).to.be.deep.eq(BobaBalanceBefore)
        expect(ETHBalanceAfter).to.be.deep.eq(ETHBalanceBefore)
        expect(GPO_ETHBalanceAfter).to.be.deep.eq(GPO_ETHBalanceBefore)

        // Add funds
        await env.l2Wallet.sendTransaction({
          to: Boba_GasPriceOracle.address,
          value: ethers.utils.parseEther('10'),
        })
      })
    })
  })
})
