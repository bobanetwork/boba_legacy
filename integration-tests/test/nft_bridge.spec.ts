import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
import { Contract, ContractFactory, utils, BigNumber } from 'ethers'

import { getFilteredLogIndex } from './shared/utils'

import L1NFTBridge from '@boba/contracts/artifacts/contracts/bridges/L1NFTBridge.sol/L1NFTBridge.json'
import L2NFTBridge from '@boba/contracts/artifacts/contracts/bridges/L2NFTBridge.sol/L2NFTBridge.json'
import L1ERC721Json from '@boba/contracts/artifacts/contracts/standards/L1StandardERC721.sol/L1StandardERC721.json'
import L2ERC721Json from '@boba/contracts/artifacts/contracts/standards/L2StandardERC721.sol/L2StandardERC721.json'
import ERC721Json from '@boba/contracts/artifacts/contracts/test-helpers/L1ERC721.sol/L1ERC721.json'
import ERC721UniqueDataJson from '../artifacts/contracts/TestUniqueDataERC721.sol/TestUniqueDataERC721.json'
import L1ERC721UniqueDataJson from '../artifacts/contracts/TestUniqueDataL1StandardERC721.sol/TestUniqueDataL1StandardERC721.json'
import L2ERC721UniqueDataJson from '../artifacts/contracts/TestUniqueDataL2StandardERC721.sol/TestUniqueDataL2StandardERC721.json'

import ERC721ExtraDataJson from '../artifacts/contracts/TestExtraDataERC721.sol/TestExtraDataERC721.json'
import L1ERC721ExtraDataJson from '../artifacts/contracts/TestExtraDataL1StandardERC721.sol/TestExtraDataL1StandardERC721.json'
import L2ERC721ExtraDataJson from '../artifacts/contracts/TestExtraDataL2StandardERC721.sol/TestExtraDataL2StandardERC721.json'
import L2BillingContractJson from '@boba/contracts/artifacts/contracts/L2BillingContract.sol/L2BillingContract.json'
import L2GovernanceERC20Json from '@boba/contracts/artifacts/contracts/standards/L2GovernanceERC20.sol/L2GovernanceERC20.json'

import { OptimismEnv } from './shared/env'
import { ethers } from 'hardhat'

describe('NFT Bridge Test', async () => {
  let Factory__L1ERC721: ContractFactory
  let Factory__L2ERC721: ContractFactory
  let L1Bridge: Contract
  let L2Bridge: Contract
  let L1ERC721: Contract
  let L2ERC721: Contract

  let L2BOBAToken: Contract
  let BOBABillingContract: Contract

  let env: OptimismEnv

  const DUMMY_TOKEN_ID = 1234
  const DUMMY_TOKEN_ID_2 = 5678
  const DUMMY_URI_1 = 'first-unique-uri'

  before(async () => {
    env = await OptimismEnv.new()

    L1Bridge = new Contract(
      env.addressesBOBA.Proxy__L1NFTBridge,
      L1NFTBridge.abi,
      env.l1Wallet
    )

    L2Bridge = new Contract(
      env.addressesBOBA.Proxy__L2NFTBridge,
      L2NFTBridge.abi,
      env.l2Wallet
    )

    L2BOBAToken = new Contract(
      env.addressesBOBA.TOKENS.BOBA.L2,
      L2GovernanceERC20Json.abi,
      env.l2Wallet
    )

    BOBABillingContract = new Contract(
      env.addressesBOBA.Proxy__BobaBillingContract,
      L2BillingContractJson.abi,
      env.l2Wallet
    )
  })

  describe('L1 native NFT tests', async () => {
    before(async () => {
      Factory__L1ERC721 = new ContractFactory(
        ERC721Json.abi,
        ERC721Json.bytecode,
        env.l1Wallet
      )

      Factory__L2ERC721 = new ContractFactory(
        L2ERC721Json.abi,
        L2ERC721Json.bytecode,
        env.l2Wallet
      )

      // deploy a L1 native NFT token each time if existing contracts are used for tests
      L1ERC721 = await Factory__L1ERC721.deploy('Test', 'TST')

      await L1ERC721.deployTransaction.wait()

      L2ERC721 = await Factory__L2ERC721.deploy(
        L2Bridge.address,
        L1ERC721.address,
        'Test',
        'TST',
        '' // base-uri
      )

      await L2ERC721.deployTransaction.wait()

      // register NFT
      const registerL1BridgeTx = await L1Bridge.registerNFTPair(
        L1ERC721.address,
        L2ERC721.address,
        'L1'
      )
      await registerL1BridgeTx.wait()

      const registerL2BridgeTx = await L2Bridge.registerNFTPair(
        L1ERC721.address,
        L2ERC721.address,
        'L1'
      )
      await registerL2BridgeTx.wait()
    })

    it('{tag:boba} should deposit NFT to L2', async () => {
      // mint nft
      const mintTx = await L1ERC721.mint(env.l1Wallet.address, DUMMY_TOKEN_ID)
      await mintTx.wait()

      const approveTx = await L1ERC721.approve(L1Bridge.address, DUMMY_TOKEN_ID)
      await approveTx.wait()

      await env.waitForXDomainTransaction(
        L1Bridge.depositNFT(L1ERC721.address, DUMMY_TOKEN_ID, 9999999)
      )

      const ownerL1 = await L1ERC721.ownerOf(DUMMY_TOKEN_ID)
      const ownerL2 = await L2ERC721.ownerOf(DUMMY_TOKEN_ID)

      expect(ownerL1).to.deep.eq(L1Bridge.address)
      expect(ownerL2).to.deep.eq(env.l2Wallet.address)
    })

    it('{tag:boba} should be able to transfer NFT on L2', async () => {
      const transferTx = await L2ERC721.transferFrom(
        env.l2Wallet.address,
        env.l2Wallet_2.address,
        DUMMY_TOKEN_ID
      )
      await transferTx.wait()

      const ownerL2 = await L2ERC721.ownerOf(DUMMY_TOKEN_ID)
      expect(ownerL2).to.deep.eq(env.l2Wallet_2.address)
    })

    it('{tag:boba} should not be able to withdraw non-owned NFT', async () => {
      await expect(
        L2Bridge.connect(env.l2Wallet).withdraw(
          L2ERC721.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      ).to.be.reverted
    })

    it('{tag:boba} should fail to withdraw NFT if not enough Boba balance', async () => {
      const newWallet = ethers.Wallet.createRandom().connect(env.l2Provider)
      await env.l2Wallet.sendTransaction({
        to: newWallet.address,
        value: ethers.utils.parseEther('1'),
      })

      await expect(
        L2Bridge.connect(newWallet).withdraw(
          L2ERC721.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      ).to.be.revertedWith(
        'execution reverted: ERC20: transfer amount exceeds balance'
      )
    })

    it('{tag:boba} should fail to withdraw NFT if not approving Boba', async () => {
      await expect(
        L2Bridge.connect(env.l2Wallet_2).withdraw(
          L2ERC721.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      ).to.be.revertedWith(
        'execution reverted: ERC20: transfer amount exceeds allowance'
      )
    })

    it('{tag:boba} should withdraw NFT', async () => {
      const approveTX = await L2ERC721.connect(env.l2Wallet_2).approve(
        L2Bridge.address,
        DUMMY_TOKEN_ID
      )
      await approveTX.wait()

      // Approve BOBA
      const exitFee = await BOBABillingContract.exitFee()
      const approveBOBATX = await L2BOBAToken.connect(env.l2Wallet_2).approve(
        L2Bridge.address,
        exitFee
      )
      await approveBOBATX.wait()

      await env.waitForXDomainTransaction(
        L2Bridge.connect(env.l2Wallet_2).withdraw(
          L2ERC721.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      )

      await expect(L2ERC721.ownerOf(DUMMY_TOKEN_ID)).to.be.reverted

      const ownerL1 = await L1ERC721.ownerOf(DUMMY_TOKEN_ID)
      expect(ownerL1).to.be.deep.eq(env.l2Wallet_2.address)
    })

    it('{tag:boba} should deposit NFT to another L2 wallet', async () => {
      const approveTx = await L1ERC721.connect(env.l1Wallet_2).approve(
        L1Bridge.address,
        DUMMY_TOKEN_ID
      )
      await approveTx.wait()

      await env.waitForXDomainTransaction(
        L1Bridge.connect(env.l1Wallet_2).depositNFTTo(
          L1ERC721.address,
          env.l1Wallet.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      )

      const ownerL1 = await L1ERC721.ownerOf(DUMMY_TOKEN_ID)
      const ownerL2 = await L2ERC721.ownerOf(DUMMY_TOKEN_ID)

      expect(ownerL1).to.deep.eq(L1Bridge.address)
      expect(ownerL2).to.deep.eq(env.l2Wallet.address)
    })

    it('{tag:boba} should fail to withdraw NFT to another wallet if not enough Boba balance', async () => {
      const newWallet = ethers.Wallet.createRandom().connect(env.l2Provider)
      await env.l2Wallet.sendTransaction({
        to: newWallet.address,
        value: ethers.utils.parseEther('1'),
      })

      await expect(
        L2Bridge.connect(newWallet).withdrawTo(
          L2ERC721.address,
          env.l2Wallet_2.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      ).to.be.revertedWith(
        'execution reverted: ERC20: transfer amount exceeds balance'
      )
    })

    it('{tag:boba} should fail to withdraw NFT to another wallet if not approving Boba', async () => {
      await expect(
        L2Bridge.connect(env.l2Wallet_2).withdrawTo(
          L2ERC721.address,
          env.l2Wallet_2.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      ).to.be.revertedWith(
        'execution reverted: ERC20: transfer amount exceeds allowance'
      )
    })

    it('{tag:boba} should withdraw NFT to another L1 wallet', async () => {
      const approveTX = await L2ERC721.connect(env.l2Wallet).approve(
        L2Bridge.address,
        DUMMY_TOKEN_ID
      )
      await approveTX.wait()

      // Approve BOBA
      const exitFee = await BOBABillingContract.exitFee()
      const approveBOBATX = await L2BOBAToken.connect(env.l2Wallet).approve(
        L2Bridge.address,
        exitFee
      )
      await approveBOBATX.wait()

      await env.waitForXDomainTransaction(
        L2Bridge.connect(env.l2Wallet).withdrawTo(
          L2ERC721.address,
          env.l2Wallet_2.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      )

      await expect(L2ERC721.ownerOf(DUMMY_TOKEN_ID)).to.be.reverted

      const ownerL1 = await L1ERC721.ownerOf(DUMMY_TOKEN_ID)
      expect(ownerL1).to.be.deep.eq(env.l1Wallet_2.address)
    })

    it('{tag:boba} should be able to attempt metadata bridge to L2', async () => {
      const approveTx = await L1ERC721.connect(env.l1Wallet_2).approve(
        L1Bridge.address,
        DUMMY_TOKEN_ID
      )
      await approveTx.wait()

      const depositTx = await env.waitForXDomainTransaction(
        L1Bridge.connect(env.l1Wallet_2).depositNFTWithExtraData(
          L1ERC721.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      )

      const returnedlogIndex = await getFilteredLogIndex(
        depositTx.receipt,
        L1NFTBridge.abi,
        L1Bridge.address,
        'NFTDepositInitiated'
      )
      const ifaceL1NFTBridge = new ethers.utils.Interface(L1NFTBridge.abi)
      const log = ifaceL1NFTBridge.parseLog(
        depositTx.receipt.logs[returnedlogIndex]
      )

      const expectedData = utils.defaultAbiCoder.encode(['string'], [''])

      // this extra data will be ignored by the L2StandardERC721 contract
      expect(log.args._data).to.deep.eq(expectedData)

      const ownerL1 = await L1ERC721.ownerOf(DUMMY_TOKEN_ID)
      const ownerL2 = await L2ERC721.ownerOf(DUMMY_TOKEN_ID)

      expect(ownerL1).to.deep.eq(L1Bridge.address)
      expect(ownerL2).to.deep.eq(env.l2Wallet_2.address)
    })

    it('{tag:boba} should fail to withdraw NFT with metadata if not enough Boba balance', async () => {
      const newWallet = ethers.Wallet.createRandom().connect(env.l2Provider)
      await env.l2Wallet.sendTransaction({
        to: newWallet.address,
        value: ethers.utils.parseEther('1'),
      })

      await expect(
        L2Bridge.connect(newWallet).withdrawWithExtraData(
          L2ERC721.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      ).to.be.revertedWith(
        'execution reverted: ERC20: transfer amount exceeds balance'
      )
    })

    it('{tag:boba} should fail to withdraw NFT with metadata if not approving Boba', async () => {
      await expect(
        L2Bridge.connect(env.l2Wallet_2).withdrawWithExtraData(
          L2ERC721.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      ).to.be.revertedWith(
        'execution reverted: ERC20: transfer amount exceeds allowance'
      )
    })

    it('{tag:boba} should be able to attempt withdraw NFT with metadata', async () => {
      const approveTX = await L2ERC721.connect(env.l2Wallet_2).approve(
        L2Bridge.address,
        DUMMY_TOKEN_ID
      )
      await approveTX.wait()

      // Approve BOBA
      const exitFee = await BOBABillingContract.exitFee()
      const approveBOBATX = await L2BOBAToken.connect(env.l2Wallet_2).approve(
        L2Bridge.address,
        exitFee
      )
      await approveBOBATX.wait()

      const withdrawTx = await env.waitForXDomainTransaction(
        L2Bridge.connect(env.l2Wallet_2).withdrawWithExtraData(
          L2ERC721.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      )

      // check event WithdrawalInitiated is emitted with empty data
      const returnedlogIndex = await getFilteredLogIndex(
        withdrawTx.receipt,
        L2NFTBridge.abi,
        L2Bridge.address,
        'WithdrawalInitiated'
      )
      const ifaceL2NFTBridge = new ethers.utils.Interface(L2NFTBridge.abi)
      const log = ifaceL2NFTBridge.parseLog(
        withdrawTx.receipt.logs[returnedlogIndex]
      )

      expect(log.args._data).to.deep.eq('0x')

      await expect(L2ERC721.ownerOf(DUMMY_TOKEN_ID)).to.be.reverted

      const ownerL1 = await L1ERC721.ownerOf(DUMMY_TOKEN_ID)
      expect(ownerL1).to.be.deep.eq(env.l1Wallet_2.address)
    })

    it('{tag:boba} should not be able to deposit unregistered NFT ', async () => {
      const L1ERC721Test = await Factory__L1ERC721.deploy('Test', 'TST')
      await L1ERC721Test.deployTransaction.wait()

      const mintTx = await L1ERC721Test.mint(
        env.l1Wallet.address,
        DUMMY_TOKEN_ID
      )
      await mintTx.wait()
      const approveTx = await L1ERC721Test.approve(
        L1Bridge.address,
        DUMMY_TOKEN_ID
      )
      await approveTx.wait()

      await expect(
        L1Bridge.depositNFT(L1ERC721Test.address, DUMMY_TOKEN_ID, 9999999)
      ).to.be.revertedWith("Can't Find L2 NFT Contract")
      await expect(
        L1Bridge.depositNFTTo(
          L1ERC721Test.address,
          env.l2Wallet_2.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      ).to.be.revertedWith("Can't Find L2 NFT Contract")
    })

    it('{tag:boba} should not be able to mint NFT on L2', async () => {
      await expect(
        L2ERC721.mint(env.l2Wallet.address, DUMMY_TOKEN_ID + 1, '0x')
      ).to.be.revertedWith('Only L2 Bridge can mint and burn')
    })

    it('{tag:boba} should not be able to burn NFT on L2', async () => {
      await expect(L2ERC721.burn(DUMMY_TOKEN_ID + 1)).to.be.revertedWith(
        'Only L2 Bridge can mint and burn'
      )
    })
  })

  describe('L2 native NFT tests', async () => {
    before(async () => {
      Factory__L2ERC721 = new ContractFactory(
        ERC721Json.abi,
        ERC721Json.bytecode,
        env.l2Wallet
      )

      Factory__L1ERC721 = new ContractFactory(
        L1ERC721Json.abi,
        L1ERC721Json.bytecode,
        env.l1Wallet
      )

      // deploy a L2 native NFT token each time if existing contracts are used for tests
      L2ERC721 = await Factory__L2ERC721.deploy('Test', 'TST')

      await L2ERC721.deployTransaction.wait()

      L1ERC721 = await Factory__L1ERC721.deploy(
        L1Bridge.address,
        L2ERC721.address,
        'Test',
        'TST',
        '' // base-uri
      )

      await L1ERC721.deployTransaction.wait()

      // register NFT
      const registerL1BridgeTx = await L1Bridge.registerNFTPair(
        L1ERC721.address,
        L2ERC721.address,
        'L2'
      )
      await registerL1BridgeTx.wait()

      const registerL2BridgeTx = await L2Bridge.registerNFTPair(
        L1ERC721.address,
        L2ERC721.address,
        'L2'
      )
      await registerL2BridgeTx.wait()
    })

    it('{tag:boba} should fail to exit NFT if not enough Boba balance', async () => {
      const newWallet = ethers.Wallet.createRandom().connect(env.l2Provider)
      await env.l2Wallet.sendTransaction({
        to: newWallet.address,
        value: ethers.utils.parseEther('1'),
      })

      await expect(
        L2Bridge.connect(newWallet).withdraw(
          L2ERC721.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      ).to.be.revertedWith(
        'execution reverted: ERC20: transfer amount exceeds balance'
      )
    })

    it('{tag:boba} should fail to exit NFT if not approving Boba', async () => {
      // Reset allowance
      const approveBOBATX = await L2BOBAToken.connect(env.l2Wallet_2).approve(
        L2Bridge.address,
        0
      )
      await approveBOBATX.wait()

      await expect(
        L2Bridge.connect(env.l2Wallet_2).withdraw(
          L2ERC721.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      ).to.be.revertedWith(
        'execution reverted: ERC20: transfer amount exceeds allowance'
      )
    })

    it('{tag:boba} should exit NFT from L2', async () => {
      // mint nft
      const mintTx = await L2ERC721.mint(env.l2Wallet.address, DUMMY_TOKEN_ID)
      await mintTx.wait()

      const approveTx = await L2ERC721.approve(L2Bridge.address, DUMMY_TOKEN_ID)
      await approveTx.wait()

      // Approve BOBA
      const exitFee = await BOBABillingContract.exitFee()
      const approveBOBATX = await L2BOBAToken.connect(env.l2Wallet).approve(
        L2Bridge.address,
        exitFee
      )
      await approveBOBATX.wait()

      await env.waitForXDomainTransaction(
        L2Bridge.withdraw(L2ERC721.address, DUMMY_TOKEN_ID, 9999999)
      )

      const ownerL1 = await L1ERC721.ownerOf(DUMMY_TOKEN_ID)
      const ownerL2 = await L2ERC721.ownerOf(DUMMY_TOKEN_ID)

      expect(ownerL1).to.deep.eq(env.l2Wallet.address)
      expect(ownerL2).to.deep.eq(L2Bridge.address)
    })

    it('{tag:boba} should be able to transfer NFT on L1', async () => {
      const transferTx = await L1ERC721.transferFrom(
        env.l1Wallet.address,
        env.l1Wallet_2.address,
        DUMMY_TOKEN_ID
      )
      await transferTx.wait()

      const ownerL1 = await L1ERC721.ownerOf(DUMMY_TOKEN_ID)
      expect(ownerL1).to.deep.eq(env.l1Wallet_2.address)

      const transferBackTx = await L1ERC721.connect(
        env.l1Wallet_2
      ).transferFrom(
        env.l1Wallet_2.address,
        env.l1Wallet.address,
        DUMMY_TOKEN_ID
      )
      await transferBackTx.wait()

      const ownerL1Back = await L1ERC721.ownerOf(DUMMY_TOKEN_ID)
      expect(ownerL1Back).to.deep.eq(env.l1Wallet.address)
    })

    it('{tag:boba} should not be able to deposit non-owned NFT to L2', async () => {
      await expect(
        L1Bridge.connect(env.l1Wallet_2).depositNFT(
          L1ERC721.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      ).to.be.reverted
    })

    it('{tag:boba} should deposit NFT to L2', async () => {
      const approveTx = await L1ERC721.approve(L1Bridge.address, DUMMY_TOKEN_ID)
      await approveTx.wait()

      await env.waitForXDomainTransaction(
        L1Bridge.depositNFT(L1ERC721.address, DUMMY_TOKEN_ID, 9999999)
      )

      await expect(L1ERC721.ownerOf(DUMMY_TOKEN_ID)).to.be.revertedWith(
        'ERC721: owner query for nonexistent token'
      )

      const ownerL2 = await L2ERC721.ownerOf(DUMMY_TOKEN_ID)
      expect(ownerL2).to.deep.eq(env.l2Wallet.address)
    })

    it('{tag:boba} should fail to exit NFT to another L1 wallet if not enough Boba balance', async () => {
      const newWallet = ethers.Wallet.createRandom().connect(env.l2Provider)
      await env.l2Wallet.sendTransaction({
        to: newWallet.address,
        value: ethers.utils.parseEther('1'),
      })

      await expect(
        L2Bridge.connect(newWallet).withdrawTo(
          L2ERC721.address,
          env.l2Wallet_2.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      ).to.be.revertedWith(
        'execution reverted: ERC20: transfer amount exceeds balance'
      )
    })

    it('{tag:boba} should fail to exit NFT to another L1 wallet if not approving Boba', async () => {
      // Reset allowance
      const approveBOBATX = await L2BOBAToken.connect(env.l2Wallet_2).approve(
        L2Bridge.address,
        0
      )
      await approveBOBATX.wait()

      await expect(
        L2Bridge.connect(env.l2Wallet_2).withdrawTo(
          L2ERC721.address,
          env.l2Wallet_2.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      ).to.be.revertedWith(
        'execution reverted: ERC20: transfer amount exceeds allowance'
      )
    })

    it('{tag:boba} should exit NFT to another L1 wallet', async () => {
      const approveTx = await L2ERC721.approve(L2Bridge.address, DUMMY_TOKEN_ID)
      await approveTx.wait()

      // Approve BOBA
      const exitFee = await BOBABillingContract.exitFee()
      const approveBOBATX = await L2BOBAToken.connect(env.l2Wallet).approve(
        L2Bridge.address,
        exitFee
      )
      await approveBOBATX.wait()

      await env.waitForXDomainTransaction(
        L2Bridge.withdrawTo(
          L2ERC721.address,
          env.l2Wallet_2.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      )

      const ownerL1 = await L1ERC721.ownerOf(DUMMY_TOKEN_ID)
      const ownerL2 = await L2ERC721.ownerOf(DUMMY_TOKEN_ID)

      expect(ownerL1).to.deep.eq(env.l2Wallet_2.address)
      expect(ownerL2).to.deep.eq(L2Bridge.address)
    })

    it('{tag:boba} should deposit NFT to another L2 wallet', async () => {
      const approveTx = await L1ERC721.connect(env.l1Wallet_2).approve(
        L1Bridge.address,
        DUMMY_TOKEN_ID
      )
      await approveTx.wait()

      // Approve BOBA
      const exitFee = await BOBABillingContract.exitFee()
      const approveBOBATX = await L2BOBAToken.connect(env.l2Wallet_2).approve(
        L2Bridge.address,
        exitFee
      )
      await approveBOBATX.wait()

      await env.waitForXDomainTransaction(
        L1Bridge.connect(env.l1Wallet_2).depositNFTTo(
          L1ERC721.address,
          env.l2Wallet.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      )

      await expect(L1ERC721.ownerOf(DUMMY_TOKEN_ID)).to.be.revertedWith(
        'ERC721: owner query for nonexistent token'
      )

      const ownerL2 = await L2ERC721.ownerOf(DUMMY_TOKEN_ID)
      expect(ownerL2).to.deep.eq(env.l2Wallet.address)
    })

    it('{tag:boba} should fail to exit NFT with metadata if not enough Boba balance', async () => {
      const newWallet = ethers.Wallet.createRandom().connect(env.l2Provider)
      await env.l2Wallet.sendTransaction({
        to: newWallet.address,
        value: ethers.utils.parseEther('1'),
      })

      await expect(
        L2Bridge.connect(newWallet).withdrawWithExtraData(
          L2ERC721.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      ).to.be.revertedWith(
        'execution reverted: ERC20: transfer amount exceeds balance'
      )
    })

    it('{tag:boba} should fail to exit NFT with metadata if not approving Boba', async () => {
      // Reset allowance
      const approveBOBATX = await L2BOBAToken.connect(env.l2Wallet_2).approve(
        L2Bridge.address,
        0
      )
      await approveBOBATX.wait()

      await expect(
        L2Bridge.connect(env.l2Wallet_2).withdrawWithExtraData(
          L2ERC721.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      ).to.be.revertedWith(
        'execution reverted: ERC20: transfer amount exceeds allowance'
      )
    })

    it('{tag:boba} should be able to attempt exit NFT with metadata from L2', async () => {
      const approveTx = await L2ERC721.approve(L2Bridge.address, DUMMY_TOKEN_ID)
      await approveTx.wait()

      // Approve BOBA
      const exitFee = await BOBABillingContract.exitFee()
      const approveBOBATX = await L2BOBAToken.connect(env.l2Wallet).approve(
        L2Bridge.address,
        exitFee
      )
      await approveBOBATX.wait()

      const withdrawTx = await env.waitForXDomainTransaction(
        L2Bridge.withdrawWithExtraData(
          L2ERC721.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      )

      const returnedlogIndex = await getFilteredLogIndex(
        withdrawTx.receipt,
        L2NFTBridge.abi,
        L2Bridge.address,
        'WithdrawalInitiated'
      )
      const ifaceL2NFTBridge = new ethers.utils.Interface(L2NFTBridge.abi)
      const log = ifaceL2NFTBridge.parseLog(
        withdrawTx.receipt.logs[returnedlogIndex]
      )

      const expectedData = utils.defaultAbiCoder.encode(['string'], [''])

      // this extra data will be ignored by the L2StandardERC721 contract
      expect(log.args._data).to.deep.eq(expectedData)

      const ownerL1 = await L1ERC721.ownerOf(DUMMY_TOKEN_ID)
      const ownerL2 = await L2ERC721.ownerOf(DUMMY_TOKEN_ID)

      expect(ownerL1).to.deep.eq(env.l1Wallet.address)
      expect(ownerL2).to.deep.eq(L2Bridge.address)
    })

    it('{tag:boba} should be able to attempt deposit NFT with metadata', async () => {
      const approveTx = await L1ERC721.connect(env.l1Wallet).approve(
        L1Bridge.address,
        DUMMY_TOKEN_ID
      )
      await approveTx.wait()

      const depositTx = await env.waitForXDomainTransaction(
        L1Bridge.connect(env.l1Wallet).depositNFTWithExtraData(
          L1ERC721.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      )

      // check event NFTDepositInitiated is emitted with empty data
      const returnedlogIndex = await getFilteredLogIndex(
        depositTx.receipt,
        L1NFTBridge.abi,
        L1Bridge.address,
        'NFTDepositInitiated'
      )
      const ifaceL1NFTBridge = new ethers.utils.Interface(L1NFTBridge.abi)
      const log = ifaceL1NFTBridge.parseLog(
        depositTx.receipt.logs[returnedlogIndex]
      )

      expect(log.args._data).to.deep.eq('0x')

      await expect(L1ERC721.ownerOf(DUMMY_TOKEN_ID)).to.be.revertedWith(
        'ERC721: owner query for nonexistent token'
      )

      const ownerL2 = await L2ERC721.ownerOf(DUMMY_TOKEN_ID)
      expect(ownerL2).to.deep.eq(env.l2Wallet.address)
    })

    it('{tag:boba} should not be able to withdraw unregistered NFT ', async () => {
      const L2ERC721Test = await Factory__L2ERC721.deploy('Test', 'TST')
      await L2ERC721Test.deployTransaction.wait()

      const mintTx = await L2ERC721Test.mint(
        env.l2Wallet.address,
        DUMMY_TOKEN_ID
      )
      await mintTx.wait()
      const approveTx = await L2ERC721Test.approve(
        L2Bridge.address,
        DUMMY_TOKEN_ID
      )
      await approveTx.wait()

      // Approve BOBA
      const exitFee = await BOBABillingContract.exitFee()
      const approveBOBATX = await L2BOBAToken.connect(env.l2Wallet).approve(
        L2Bridge.address,
        exitFee
      )
      await approveBOBATX.wait()

      await expect(
        L2Bridge.withdraw(L2ERC721Test.address, DUMMY_TOKEN_ID, 9999999)
      ).to.be.revertedWith("Can't Find L1 NFT Contract")
      await expect(
        L2Bridge.withdrawTo(
          L2ERC721Test.address,
          env.l2Wallet_2.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      ).to.be.revertedWith("Can't Find L1 NFT Contract")
    })

    it('{tag:boba} should not be able to mint NFT on L1', async () => {
      await expect(
        L1ERC721.mint(env.l1Wallet.address, DUMMY_TOKEN_ID + 1, '0x')
      ).to.be.revertedWith('Only L1 Bridge can mint and burn')
    })

    it('{tag:boba} should not be able to burn NFT on L1', async () => {
      await expect(L1ERC721.burn(DUMMY_TOKEN_ID + 1)).to.be.revertedWith(
        'Only L1 Bridge can mint and burn'
      )
    })
  })

  describe('Approved NFT withdrawals - L1 NFT', async () => {
    before(async () => {
      Factory__L1ERC721 = new ContractFactory(
        ERC721Json.abi,
        ERC721Json.bytecode,
        env.l1Wallet
      )

      Factory__L2ERC721 = new ContractFactory(
        L2ERC721Json.abi,
        L2ERC721Json.bytecode,
        env.l2Wallet
      )

      // deploy a L1 native NFT token each time if existing contracts are used for tests
      L1ERC721 = await Factory__L1ERC721.deploy('Test', 'TST')

      await L1ERC721.deployTransaction.wait()

      L2ERC721 = await Factory__L2ERC721.deploy(
        L2Bridge.address,
        L1ERC721.address,
        'Test',
        'TST',
        '' // base-uri
      )

      await L2ERC721.deployTransaction.wait()

      // register NFT
      const registerL1BridgeTx = await L1Bridge.registerNFTPair(
        L1ERC721.address,
        L2ERC721.address,
        'L1'
      )
      await registerL1BridgeTx.wait()

      const registerL2BridgeTx = await L2Bridge.registerNFTPair(
        L1ERC721.address,
        L2ERC721.address,
        'L1'
      )
      await registerL2BridgeTx.wait()

      // mint nft
      const mintTx = await L1ERC721.mint(env.l1Wallet.address, DUMMY_TOKEN_ID)
      await mintTx.wait()

      const approveTx = await L1ERC721.approve(L1Bridge.address, DUMMY_TOKEN_ID)
      await approveTx.wait()

      await env.waitForXDomainTransaction(
        L1Bridge.depositNFT(L1ERC721.address, DUMMY_TOKEN_ID, 9999999)
      )
    })

    it('{tag:boba} should withdraw NFT when approved for all', async () => {
      const approveTX = await L2ERC721.setApprovalForAll(
        env.l2Wallet_2.address,
        true
      )
      await approveTX.wait()

      // Approve BOBA
      const exitFee = await BOBABillingContract.exitFee()
      const approveBOBATX = await L2BOBAToken.connect(env.l2Wallet_2).approve(
        L2Bridge.address,
        exitFee
      )
      await approveBOBATX.wait()

      await env.waitForXDomainTransaction(
        L2Bridge.connect(env.l2Wallet_2).withdraw(
          L2ERC721.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      )

      await expect(L2ERC721.ownerOf(DUMMY_TOKEN_ID)).to.be.reverted

      const ownerL1 = await L1ERC721.ownerOf(DUMMY_TOKEN_ID)
      expect(ownerL1).to.be.deep.eq(env.l2Wallet_2.address)
    })
  })

  describe('Approved NFT withdrawals - L2 NFT', async () => {
    before(async () => {
      Factory__L2ERC721 = new ContractFactory(
        ERC721Json.abi,
        ERC721Json.bytecode,
        env.l2Wallet
      )

      Factory__L1ERC721 = new ContractFactory(
        L1ERC721Json.abi,
        L1ERC721Json.bytecode,
        env.l1Wallet
      )

      // deploy a L2 native NFT token each time if existing contracts are used for tests
      L2ERC721 = await Factory__L2ERC721.deploy('Test', 'TST')

      await L2ERC721.deployTransaction.wait()

      L1ERC721 = await Factory__L1ERC721.deploy(
        L1Bridge.address,
        L2ERC721.address,
        'Test',
        'TST',
        '' // base-uri
      )

      await L1ERC721.deployTransaction.wait()

      // register NFT
      const registerL1BridgeTx = await L1Bridge.registerNFTPair(
        L1ERC721.address,
        L2ERC721.address,
        'L2'
      )
      await registerL1BridgeTx.wait()

      const registerL2BridgeTx = await L2Bridge.registerNFTPair(
        L1ERC721.address,
        L2ERC721.address,
        'L2'
      )
      await registerL2BridgeTx.wait()

      // mint nft
      const mintTx = await L2ERC721.mint(env.l2Wallet.address, DUMMY_TOKEN_ID)
      await mintTx.wait()

      const approveTx = await L2ERC721.approve(L2Bridge.address, DUMMY_TOKEN_ID)
      await approveTx.wait()

      // Approve BOBA
      const exitFee = await BOBABillingContract.exitFee()
      const approveBOBATX = await L2BOBAToken.connect(env.l2Wallet).approve(
        L2Bridge.address,
        exitFee
      )
      await approveBOBATX.wait()

      await env.waitForXDomainTransaction(
        L2Bridge.withdraw(L2ERC721.address, DUMMY_TOKEN_ID, 9999999)
      )
    })

    it('{tag:boba} should deposit NFT to L2 when approved for all', async () => {
      await L1ERC721.setApprovalForAll(env.l1Wallet_2.address, true)
      await env.waitForXDomainTransaction(
        L1Bridge.connect(env.l1Wallet_2).depositNFT(
          L1ERC721.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      )

      await expect(L1ERC721.ownerOf(DUMMY_TOKEN_ID)).to.be.revertedWith(
        'ERC721: owner query for nonexistent token'
      )

      const ownerL2 = await L2ERC721.ownerOf(DUMMY_TOKEN_ID)
      expect(ownerL2).to.deep.eq(env.l2Wallet_2.address)
    })
  })

  describe('L1 native NFT - with Unique Data tests', async () => {
    before(async () => {
      Factory__L1ERC721 = new ContractFactory(
        ERC721UniqueDataJson.abi,
        ERC721UniqueDataJson.bytecode,
        env.l1Wallet
      )

      Factory__L2ERC721 = new ContractFactory(
        L2ERC721UniqueDataJson.abi,
        L2ERC721UniqueDataJson.bytecode,
        env.l2Wallet
      )

      // deploy a L1 native NFT token each time if existing contracts are used for tests
      L1ERC721 = await Factory__L1ERC721.deploy('Test', 'TST')

      await L1ERC721.deployTransaction.wait()

      L2ERC721 = await Factory__L2ERC721.deploy(
        L2Bridge.address,
        L1ERC721.address,
        'Test',
        'TST',
        '' // base-uri
      )

      await L2ERC721.deployTransaction.wait()

      // register NFT
      const registerL1BridgeTx = await L1Bridge.registerNFTPair(
        L1ERC721.address,
        L2ERC721.address,
        'L1'
      )
      await registerL1BridgeTx.wait()

      const registerL2BridgeTx = await L2Bridge.registerNFTPair(
        L1ERC721.address,
        L2ERC721.address,
        'L1'
      )
      await registerL2BridgeTx.wait()
    })

    it('{tag:boba} should deposit NFT with metadata to L2', async () => {
      // mint nft
      const mintTx = await L1ERC721.mint(
        env.l1Wallet.address,
        DUMMY_TOKEN_ID,
        DUMMY_URI_1
      )
      await mintTx.wait()

      const approveTx = await L1ERC721.approve(L1Bridge.address, DUMMY_TOKEN_ID)
      await approveTx.wait()

      const depositTx = await env.waitForXDomainTransaction(
        L1Bridge.depositNFTWithExtraData(
          L1ERC721.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      )

      const returnedlogIndex = await getFilteredLogIndex(
        depositTx.receipt,
        L1NFTBridge.abi,
        L1Bridge.address,
        'NFTDepositInitiated'
      )
      const ifaceL1NFTBridge = new ethers.utils.Interface(L1NFTBridge.abi)
      const log = ifaceL1NFTBridge.parseLog(
        depositTx.receipt.logs[returnedlogIndex]
      )

      const expectedData = utils.defaultAbiCoder.encode(
        ['string'],
        [DUMMY_URI_1]
      )

      expect(log.args._data).to.deep.eq(expectedData)

      const ownerL1 = await L1ERC721.ownerOf(DUMMY_TOKEN_ID)
      const ownerL2 = await L2ERC721.ownerOf(DUMMY_TOKEN_ID)

      expect(ownerL1).to.deep.eq(L1Bridge.address)
      expect(ownerL2).to.deep.eq(env.l2Wallet.address)
    })

    it('{tag:boba} metaData of minted NFT should match', async () => {
      const l1TokenURI = await L1ERC721.tokenURI(DUMMY_TOKEN_ID)
      const l2TokenURI = await L2ERC721.tokenURI(DUMMY_TOKEN_ID)

      expect(l2TokenURI).to.deep.eq(l1TokenURI)
    })

    it('{tag:boba} should withdraw NFT without sending data for non-native token', async () => {
      const approveTX = await L2ERC721.connect(env.l2Wallet).approve(
        L2Bridge.address,
        DUMMY_TOKEN_ID
      )
      await approveTX.wait()

      // Approve BOBA
      const exitFee = await BOBABillingContract.exitFee()
      const approveBOBATX = await L2BOBAToken.connect(env.l2Wallet).approve(
        L2Bridge.address,
        exitFee
      )
      await approveBOBATX.wait()

      // withdraw with metadata does not provide any advantage for non-native token
      const withdrawTx = await env.waitForXDomainTransaction(
        L2Bridge.connect(env.l2Wallet).withdrawWithExtraData(
          L2ERC721.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      )

      // check event WithdrawalInitiated is emitted with empty data
      const returnedlogIndex = await getFilteredLogIndex(
        withdrawTx.receipt,
        L2NFTBridge.abi,
        L2Bridge.address,
        'WithdrawalInitiated'
      )
      const ifaceL2NFTBridge = new ethers.utils.Interface(L2NFTBridge.abi)
      const log = ifaceL2NFTBridge.parseLog(
        withdrawTx.receipt.logs[returnedlogIndex]
      )

      expect(log.args._data).to.deep.eq('0x')

      await expect(L2ERC721.ownerOf(DUMMY_TOKEN_ID)).to.be.reverted
      await expect(L2ERC721.tokenURI(DUMMY_TOKEN_ID)).to.be.reverted

      const ownerL1 = await L1ERC721.ownerOf(DUMMY_TOKEN_ID)
      const tokenURI = await L1ERC721.tokenURI(DUMMY_TOKEN_ID)
      expect(ownerL1).to.be.deep.eq(env.l2Wallet.address)
      expect(tokenURI).to.be.deep.eq(DUMMY_URI_1)
    })

    it('{tag:boba} should deposit NFT with metadata to another L2 wallet', async () => {
      const approveTx = await L1ERC721.approve(L1Bridge.address, DUMMY_TOKEN_ID)
      await approveTx.wait()

      const depositTx = await env.waitForXDomainTransaction(
        L1Bridge.depositNFTWithExtraDataTo(
          L1ERC721.address,
          env.l1Wallet_2.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      )

      const returnedlogIndex = await getFilteredLogIndex(
        depositTx.receipt,
        L1NFTBridge.abi,
        L1Bridge.address,
        'NFTDepositInitiated'
      )
      const ifaceL1NFTBridge = new ethers.utils.Interface(L1NFTBridge.abi)
      const log = ifaceL1NFTBridge.parseLog(
        depositTx.receipt.logs[returnedlogIndex]
      )

      const expectedData = utils.defaultAbiCoder.encode(
        ['string'],
        [DUMMY_URI_1]
      )

      expect(log.args._data).to.deep.eq(expectedData)

      const ownerL1 = await L1ERC721.ownerOf(DUMMY_TOKEN_ID)
      const ownerL2 = await L2ERC721.ownerOf(DUMMY_TOKEN_ID)

      expect(ownerL1).to.deep.eq(L1Bridge.address)
      expect(ownerL2).to.deep.eq(env.l1Wallet_2.address)
    })

    it('{tag:boba} metaData of minted NFT should match', async () => {
      const l1TokenURI = await L1ERC721.tokenURI(DUMMY_TOKEN_ID)
      const l2TokenURI = await L2ERC721.tokenURI(DUMMY_TOKEN_ID)

      expect(l2TokenURI).to.deep.eq(l1TokenURI)
    })

    it('{tag:boba} should withdraw NFT back', async () => {
      const approveTX = await L2ERC721.connect(env.l2Wallet_2).approve(
        L2Bridge.address,
        DUMMY_TOKEN_ID
      )
      await approveTX.wait()

      // Approve BOBA
      const exitFee = await BOBABillingContract.exitFee()
      const approveBOBATX = await L2BOBAToken.connect(env.l2Wallet_2).approve(
        L2Bridge.address,
        exitFee
      )
      await approveBOBATX.wait()

      await env.waitForXDomainTransaction(
        L2Bridge.connect(env.l2Wallet_2).withdrawWithExtraDataTo(
          L2ERC721.address,
          env.l2Wallet.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      )

      await expect(L2ERC721.ownerOf(DUMMY_TOKEN_ID)).to.be.reverted

      const ownerL1 = await L1ERC721.ownerOf(DUMMY_TOKEN_ID)
      expect(ownerL1).to.be.deep.eq(env.l1Wallet.address)
    })

    it('{tag:boba} should be able to deposit NFT without metadata to L2', async () => {
      const approveTx = await L1ERC721.approve(L1Bridge.address, DUMMY_TOKEN_ID)
      await approveTx.wait()

      const depositTx = await env.waitForXDomainTransaction(
        L1Bridge.depositNFT(L1ERC721.address, DUMMY_TOKEN_ID, 9999999)
      )

      const returnedlogIndex = await getFilteredLogIndex(
        depositTx.receipt,
        L1NFTBridge.abi,
        L1Bridge.address,
        'NFTDepositInitiated'
      )
      const ifaceL1NFTBridge = new ethers.utils.Interface(L1NFTBridge.abi)
      const log = ifaceL1NFTBridge.parseLog(
        depositTx.receipt.logs[returnedlogIndex]
      )

      expect(log.args._data).to.deep.eq('0x')

      const ownerL1 = await L1ERC721.ownerOf(DUMMY_TOKEN_ID)
      const ownerL2 = await L2ERC721.ownerOf(DUMMY_TOKEN_ID)

      expect(ownerL1).to.deep.eq(L1Bridge.address)
      expect(ownerL2).to.deep.eq(env.l2Wallet.address)
    })

    it('{tag:boba} metaData of minted NFT should not match', async () => {
      const l1TokenURI = await L1ERC721.tokenURI(DUMMY_TOKEN_ID)
      const l2TokenURI = await L2ERC721.tokenURI(DUMMY_TOKEN_ID)

      expect(l2TokenURI).to.deep.eq('')
      expect(l1TokenURI).to.deep.eq(DUMMY_URI_1)
    })

    it('{tag:boba} should withdraw NFT without sending data for non-native token', async () => {
      const approveTX = await L2ERC721.connect(env.l2Wallet).approve(
        L2Bridge.address,
        DUMMY_TOKEN_ID
      )
      await approveTX.wait()

      // Approve BOBA
      const exitFee = await BOBABillingContract.exitFee()
      const approveBOBATX = await L2BOBAToken.connect(env.l2Wallet).approve(
        L2Bridge.address,
        exitFee
      )
      await approveBOBATX.wait()

      // withdraw with metadata does not provide any advantage for non-native token
      const withdrawTx = await env.waitForXDomainTransaction(
        L2Bridge.connect(env.l2Wallet).withdrawWithExtraData(
          L2ERC721.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      )

      // check event WithdrawalInitiated is emitted with empty data
      const returnedlogIndex = await getFilteredLogIndex(
        withdrawTx.receipt,
        L2NFTBridge.abi,
        L2Bridge.address,
        'WithdrawalInitiated'
      )
      const ifaceL2NFTBridge = new ethers.utils.Interface(L2NFTBridge.abi)
      const log = ifaceL2NFTBridge.parseLog(
        withdrawTx.receipt.logs[returnedlogIndex]
      )

      expect(log.args._data).to.deep.eq('0x')

      await expect(L2ERC721.ownerOf(DUMMY_TOKEN_ID)).to.be.reverted
      await expect(L2ERC721.tokenURI(DUMMY_TOKEN_ID)).to.be.reverted

      const ownerL1 = await L1ERC721.ownerOf(DUMMY_TOKEN_ID)
      const tokenURI = await L1ERC721.tokenURI(DUMMY_TOKEN_ID)
      expect(ownerL1).to.be.deep.eq(env.l2Wallet.address)
      expect(tokenURI).to.be.deep.eq(DUMMY_URI_1)
    })
  })

  describe('L1 native NFT - with Extra Generative Data tests', async () => {
    before(async () => {
      Factory__L1ERC721 = new ContractFactory(
        ERC721ExtraDataJson.abi,
        ERC721ExtraDataJson.bytecode,
        env.l1Wallet
      )

      Factory__L2ERC721 = new ContractFactory(
        L2ERC721ExtraDataJson.abi,
        L2ERC721ExtraDataJson.bytecode,
        env.l2Wallet
      )

      // deploy a L1 native NFT token each time if existing contracts are used for tests
      L1ERC721 = await Factory__L1ERC721.deploy('Test', 'TST')

      await L1ERC721.deployTransaction.wait()

      L2ERC721 = await Factory__L2ERC721.deploy(
        L2Bridge.address,
        L1ERC721.address,
        'Test',
        'TST',
        '' // base-uri
      )

      await L2ERC721.deployTransaction.wait()

      // register NFT
      const registerL1BridgeTx = await L1Bridge.registerNFTPair(
        L1ERC721.address,
        L2ERC721.address,
        'L1'
      )
      await registerL1BridgeTx.wait()

      const registerL2BridgeTx = await L2Bridge.registerNFTPair(
        L1ERC721.address,
        L2ERC721.address,
        'L1'
      )
      await registerL2BridgeTx.wait()
    })

    it('{tag:boba} should deposit NFT with generative data to L2', async () => {
      // mint nft
      const mintTx = await L1ERC721.mint(
        env.l1Wallet.address,
        DUMMY_TOKEN_ID,
        DUMMY_URI_1 // gen seed
      )
      await mintTx.wait()

      const approveTx = await L1ERC721.approve(L1Bridge.address, DUMMY_TOKEN_ID)
      await approveTx.wait()

      const depositTx = await env.waitForXDomainTransaction(
        L1Bridge.depositNFTWithExtraData(
          L1ERC721.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      )

      const returnedlogIndex = await getFilteredLogIndex(
        depositTx.receipt,
        L1NFTBridge.abi,
        L1Bridge.address,
        'NFTDepositInitiated'
      )
      const ifaceL1NFTBridge = new ethers.utils.Interface(L1NFTBridge.abi)
      const log = ifaceL1NFTBridge.parseLog(
        depositTx.receipt.logs[returnedlogIndex]
      )

      const expectedData = utils.defaultAbiCoder.encode(
        ['string'],
        [DUMMY_URI_1]
      )

      const tokenURI = await L1ERC721.tokenURI(DUMMY_TOKEN_ID)

      expect(log.args._data).to.deep.eq(expectedData)
      expect(log.args._data).to.deep.eq(
        await L1ERC721.bridgeExtraData(DUMMY_TOKEN_ID)
      )

      // seed should be communicated because of the bridgeExtraData override
      expect(log.args._data).to.not.eq(tokenURI)

      const ownerL1 = await L1ERC721.ownerOf(DUMMY_TOKEN_ID)
      const ownerL2 = await L2ERC721.ownerOf(DUMMY_TOKEN_ID)

      expect(ownerL1).to.deep.eq(L1Bridge.address)
      expect(ownerL2).to.deep.eq(env.l2Wallet.address)
    })

    it('{tag:boba} metaData of minted NFT should be derivable from communicated seed', async () => {
      const l1TokenURI = await L1ERC721.tokenURI(DUMMY_TOKEN_ID)
      const l2TokenURI = await L2ERC721.tokenURI(DUMMY_TOKEN_ID)

      expect(l2TokenURI).to.deep.eq(l1TokenURI)
    })

    it('{tag:boba} should withdraw NFT without sending data for non-native token', async () => {
      const approveTX = await L2ERC721.connect(env.l2Wallet).approve(
        L2Bridge.address,
        DUMMY_TOKEN_ID
      )
      await approveTX.wait()

      // Approve BOBA
      const exitFee = await BOBABillingContract.exitFee()
      const approveBOBATX = await L2BOBAToken.connect(env.l2Wallet).approve(
        L2Bridge.address,
        exitFee
      )
      await approveBOBATX.wait()

      // withdraw with metadata does not provide any advantage for non-native token
      const withdrawTx = await env.waitForXDomainTransaction(
        L2Bridge.connect(env.l2Wallet).withdrawWithExtraData(
          L2ERC721.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      )

      // check event WithdrawalInitiated is emitted with empty data
      const returnedlogIndex = await getFilteredLogIndex(
        withdrawTx.receipt,
        L2NFTBridge.abi,
        L2Bridge.address,
        'WithdrawalInitiated'
      )
      const ifaceL2NFTBridge = new ethers.utils.Interface(L2NFTBridge.abi)
      const log = ifaceL2NFTBridge.parseLog(
        withdrawTx.receipt.logs[returnedlogIndex]
      )

      expect(log.args._data).to.deep.eq('0x')

      await expect(L2ERC721.ownerOf(DUMMY_TOKEN_ID)).to.be.reverted
      await expect(L2ERC721.tokenURI(DUMMY_TOKEN_ID)).to.be.reverted

      const ownerL1 = await L1ERC721.ownerOf(DUMMY_TOKEN_ID)
      const tokenURI = await L1ERC721.tokenURI(DUMMY_TOKEN_ID)
      expect(ownerL1).to.be.deep.eq(env.l2Wallet.address)
      expect(tokenURI).to.be.deep.eq(DUMMY_URI_1 + 'xyz')
    })

    it('{tag:boba} should deposit NFT with generative data to another L2 wallet', async () => {
      const approveTx = await L1ERC721.approve(L1Bridge.address, DUMMY_TOKEN_ID)
      await approveTx.wait()

      const depositTx = await env.waitForXDomainTransaction(
        L1Bridge.depositNFTWithExtraDataTo(
          L1ERC721.address,
          env.l1Wallet_2.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      )

      const returnedlogIndex = await getFilteredLogIndex(
        depositTx.receipt,
        L1NFTBridge.abi,
        L1Bridge.address,
        'NFTDepositInitiated'
      )
      const ifaceL1NFTBridge = new ethers.utils.Interface(L1NFTBridge.abi)
      const log = ifaceL1NFTBridge.parseLog(
        depositTx.receipt.logs[returnedlogIndex]
      )

      const expectedData = utils.defaultAbiCoder.encode(
        ['string'],
        [DUMMY_URI_1]
      )

      expect(log.args._data).to.deep.eq(expectedData)
      expect(log.args._data).to.deep.eq(
        await L1ERC721.bridgeExtraData(DUMMY_TOKEN_ID)
      )

      const ownerL1 = await L1ERC721.ownerOf(DUMMY_TOKEN_ID)
      const ownerL2 = await L2ERC721.ownerOf(DUMMY_TOKEN_ID)

      expect(ownerL1).to.deep.eq(L1Bridge.address)
      expect(ownerL2).to.deep.eq(env.l1Wallet_2.address)
    })

    it('{tag:boba} metaData of minted NFT should match', async () => {
      const l1TokenURI = await L1ERC721.tokenURI(DUMMY_TOKEN_ID)
      const l2TokenURI = await L2ERC721.tokenURI(DUMMY_TOKEN_ID)

      expect(l2TokenURI).to.deep.eq(l1TokenURI)
    })

    it('{tag:boba} should withdraw NFT back', async () => {
      const approveTX = await L2ERC721.connect(env.l2Wallet_2).approve(
        L2Bridge.address,
        DUMMY_TOKEN_ID
      )
      await approveTX.wait()

      // Approve BOBA
      const exitFee = await BOBABillingContract.exitFee()
      const approveBOBATX = await L2BOBAToken.connect(env.l2Wallet_2).approve(
        L2Bridge.address,
        exitFee
      )
      await approveBOBATX.wait()

      await env.waitForXDomainTransaction(
        L2Bridge.connect(env.l2Wallet_2).withdrawWithExtraDataTo(
          L2ERC721.address,
          env.l2Wallet.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      )

      await expect(L2ERC721.ownerOf(DUMMY_TOKEN_ID)).to.be.reverted

      const ownerL1 = await L1ERC721.ownerOf(DUMMY_TOKEN_ID)
      expect(ownerL1).to.be.deep.eq(env.l1Wallet.address)
    })

    it('{tag:boba} should be able to deposit NFT without metadata to L2', async () => {
      const approveTx = await L1ERC721.approve(L1Bridge.address, DUMMY_TOKEN_ID)
      await approveTx.wait()

      const depositTx = await env.waitForXDomainTransaction(
        L1Bridge.depositNFT(L1ERC721.address, DUMMY_TOKEN_ID, 9999999)
      )

      const returnedlogIndex = await getFilteredLogIndex(
        depositTx.receipt,
        L1NFTBridge.abi,
        L1Bridge.address,
        'NFTDepositInitiated'
      )
      const ifaceL1NFTBridge = new ethers.utils.Interface(L1NFTBridge.abi)
      const log = ifaceL1NFTBridge.parseLog(
        depositTx.receipt.logs[returnedlogIndex]
      )

      expect(log.args._data).to.deep.eq('0x')

      const ownerL1 = await L1ERC721.ownerOf(DUMMY_TOKEN_ID)
      const ownerL2 = await L2ERC721.ownerOf(DUMMY_TOKEN_ID)

      expect(ownerL1).to.deep.eq(L1Bridge.address)
      expect(ownerL2).to.deep.eq(env.l2Wallet.address)
    })

    it('{tag:boba} metaData of minted NFT should not match', async () => {
      const l1TokenURI = await L1ERC721.tokenURI(DUMMY_TOKEN_ID)
      const l2TokenURI = await L2ERC721.tokenURI(DUMMY_TOKEN_ID)

      expect(l2TokenURI).to.deep.eq('')
      expect(l1TokenURI).to.deep.eq(DUMMY_URI_1 + 'xyz')
    })

    it('{tag:boba} should withdraw NFT without sending data for non-native token', async () => {
      const approveTX = await L2ERC721.connect(env.l2Wallet).approve(
        L2Bridge.address,
        DUMMY_TOKEN_ID
      )
      await approveTX.wait()

      // Approve BOBA
      const exitFee = await BOBABillingContract.exitFee()
      const approveBOBATX = await L2BOBAToken.connect(env.l2Wallet).approve(
        L2Bridge.address,
        exitFee
      )
      await approveBOBATX.wait()

      // withdraw with metadata does not provide any advantage for non-native token
      const withdrawTx = await env.waitForXDomainTransaction(
        L2Bridge.connect(env.l2Wallet).withdrawWithExtraData(
          L2ERC721.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      )

      // check event WithdrawalInitiated is emitted with empty data
      const returnedlogIndex = await getFilteredLogIndex(
        withdrawTx.receipt,
        L2NFTBridge.abi,
        L2Bridge.address,
        'WithdrawalInitiated'
      )
      const ifaceL2NFTBridge = new ethers.utils.Interface(L2NFTBridge.abi)
      const log = ifaceL2NFTBridge.parseLog(
        withdrawTx.receipt.logs[returnedlogIndex]
      )

      expect(log.args._data).to.deep.eq('0x')

      await expect(L2ERC721.ownerOf(DUMMY_TOKEN_ID)).to.be.reverted
      await expect(L2ERC721.tokenURI(DUMMY_TOKEN_ID)).to.be.reverted

      const ownerL1 = await L1ERC721.ownerOf(DUMMY_TOKEN_ID)
      const tokenURI = await L1ERC721.tokenURI(DUMMY_TOKEN_ID)
      expect(ownerL1).to.be.deep.eq(env.l2Wallet.address)
      expect(tokenURI).to.be.deep.eq(DUMMY_URI_1 + 'xyz')
    })
  })

  describe('L2 native NFT - with Unique Data tests', async () => {
    before(async () => {
      Factory__L2ERC721 = new ContractFactory(
        ERC721UniqueDataJson.abi,
        ERC721UniqueDataJson.bytecode,
        env.l2Wallet
      )

      Factory__L1ERC721 = new ContractFactory(
        L1ERC721UniqueDataJson.abi,
        L1ERC721UniqueDataJson.bytecode,
        env.l1Wallet
      )

      // deploy a L2 native NFT token each time if existing contracts are used for tests
      L2ERC721 = await Factory__L2ERC721.deploy('Test', 'TST')

      await L2ERC721.deployTransaction.wait()

      L1ERC721 = await Factory__L1ERC721.deploy(
        L1Bridge.address,
        L2ERC721.address,
        'Test',
        'TST',
        '' // base-uri
      )

      await L1ERC721.deployTransaction.wait()

      // register NFT
      const registerL1BridgeTx = await L1Bridge.registerNFTPair(
        L1ERC721.address,
        L2ERC721.address,
        'L2'
      )
      await registerL1BridgeTx.wait()

      const registerL2BridgeTx = await L2Bridge.registerNFTPair(
        L1ERC721.address,
        L2ERC721.address,
        'L2'
      )
      await registerL2BridgeTx.wait()
    })

    it('{tag:boba} should withdraw NFT with metadata to L1', async () => {
      // mint nft
      const mintTx = await L2ERC721.mint(
        env.l2Wallet.address,
        DUMMY_TOKEN_ID,
        DUMMY_URI_1
      )
      await mintTx.wait()

      const approveTx = await L2ERC721.approve(L2Bridge.address, DUMMY_TOKEN_ID)
      await approveTx.wait()

      // Approve BOBA
      const exitFee = await BOBABillingContract.exitFee()
      const approveBOBATX = await L2BOBAToken.connect(env.l2Wallet).approve(
        L2Bridge.address,
        exitFee
      )
      await approveBOBATX.wait()

      const withdrawTx = await env.waitForXDomainTransaction(
        L2Bridge.withdrawWithExtraData(
          L2ERC721.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      )

      const returnedlogIndex = await getFilteredLogIndex(
        withdrawTx.receipt,
        L2NFTBridge.abi,
        L2Bridge.address,
        'WithdrawalInitiated'
      )
      const ifaceL2NFTBridge = new ethers.utils.Interface(L2NFTBridge.abi)
      const log = ifaceL2NFTBridge.parseLog(
        withdrawTx.receipt.logs[returnedlogIndex]
      )

      const expectedData = utils.defaultAbiCoder.encode(
        ['string'],
        [DUMMY_URI_1]
      )

      expect(log.args._data).to.deep.eq(expectedData)

      const ownerL1 = await L1ERC721.ownerOf(DUMMY_TOKEN_ID)
      const ownerL2 = await L2ERC721.ownerOf(DUMMY_TOKEN_ID)

      expect(ownerL1).to.deep.eq(env.l2Wallet.address)
      expect(ownerL2).to.deep.eq(L2Bridge.address)
    })

    it('{tag:boba} metaData of minted NFT should match', async () => {
      const l1TokenURI = await L1ERC721.tokenURI(DUMMY_TOKEN_ID)
      const l2TokenURI = await L2ERC721.tokenURI(DUMMY_TOKEN_ID)

      expect(l2TokenURI).to.deep.eq(l1TokenURI)
    })

    it('{tag:boba} should deposit NFT back without sending data for non-native token', async () => {
      const approveTX = await L1ERC721.connect(env.l2Wallet).approve(
        L1Bridge.address,
        DUMMY_TOKEN_ID
      )
      await approveTX.wait()

      // deposit with metadata does not provide any advantage for non-native token
      const depositTx = await env.waitForXDomainTransaction(
        L1Bridge.connect(env.l1Wallet).depositNFTWithExtraData(
          L1ERC721.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      )

      // check event NFTDepositInitiated is emitted with empty data
      const returnedlogIndex = await getFilteredLogIndex(
        depositTx.receipt,
        L1NFTBridge.abi,
        L1Bridge.address,
        'NFTDepositInitiated'
      )
      const ifaceL1NFTBridge = new ethers.utils.Interface(L1NFTBridge.abi)
      const log = ifaceL1NFTBridge.parseLog(
        depositTx.receipt.logs[returnedlogIndex]
      )

      expect(log.args._data).to.deep.eq('0x')

      await expect(L1ERC721.ownerOf(DUMMY_TOKEN_ID)).to.be.reverted
      await expect(L1ERC721.tokenURI(DUMMY_TOKEN_ID)).to.be.reverted

      const ownerL2 = await L2ERC721.ownerOf(DUMMY_TOKEN_ID)
      const tokenURI = await L2ERC721.tokenURI(DUMMY_TOKEN_ID)
      expect(ownerL2).to.be.deep.eq(env.l2Wallet.address)
      expect(tokenURI).to.be.deep.eq(DUMMY_URI_1)
    })

    it('{tag:boba} should withdraw NFT with metadata to another L1 wallet', async () => {
      const approveTx = await L2ERC721.approve(L2Bridge.address, DUMMY_TOKEN_ID)
      await approveTx.wait()

      // Approve BOBA
      const exitFee = await BOBABillingContract.exitFee()
      const approveBOBATX = await L2BOBAToken.connect(env.l2Wallet).approve(
        L2Bridge.address,
        exitFee
      )
      await approveBOBATX.wait()

      const withdrawTx = await env.waitForXDomainTransaction(
        L2Bridge.withdrawWithExtraDataTo(
          L2ERC721.address,
          env.l1Wallet_2.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      )

      const returnedlogIndex = await getFilteredLogIndex(
        withdrawTx.receipt,
        L2NFTBridge.abi,
        L2Bridge.address,
        'WithdrawalInitiated'
      )
      const ifaceL2NFTBridge = new ethers.utils.Interface(L2NFTBridge.abi)
      const log = ifaceL2NFTBridge.parseLog(
        withdrawTx.receipt.logs[returnedlogIndex]
      )

      const expectedData = utils.defaultAbiCoder.encode(
        ['string'],
        [DUMMY_URI_1]
      )

      expect(log.args._data).to.deep.eq(expectedData)

      const ownerL1 = await L1ERC721.ownerOf(DUMMY_TOKEN_ID)
      const ownerL2 = await L2ERC721.ownerOf(DUMMY_TOKEN_ID)

      expect(ownerL1).to.deep.eq(env.l1Wallet_2.address)
      expect(ownerL2).to.deep.eq(L2Bridge.address)
    })

    it('{tag:boba} metaData of minted NFT should match', async () => {
      const l1TokenURI = await L1ERC721.tokenURI(DUMMY_TOKEN_ID)
      const l2TokenURI = await L2ERC721.tokenURI(DUMMY_TOKEN_ID)

      expect(l2TokenURI).to.deep.eq(l1TokenURI)
    })

    it('{tag:boba} should deposit NFT back', async () => {
      const approveTX = await L1ERC721.connect(env.l1Wallet_2).approve(
        L1Bridge.address,
        DUMMY_TOKEN_ID
      )
      await approveTX.wait()
      await env.waitForXDomainTransaction(
        L1Bridge.connect(env.l1Wallet_2).depositNFTWithExtraDataTo(
          L1ERC721.address,
          env.l2Wallet.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      )

      await expect(L1ERC721.ownerOf(DUMMY_TOKEN_ID)).to.be.reverted

      const ownerL2 = await L2ERC721.ownerOf(DUMMY_TOKEN_ID)
      expect(ownerL2).to.be.deep.eq(env.l2Wallet.address)
    })

    it('{tag:boba} should be able to withdraw NFT without metadata to L1', async () => {
      const approveTx = await L2ERC721.approve(L2Bridge.address, DUMMY_TOKEN_ID)
      await approveTx.wait()

      // Approve BOBA
      const exitFee = await BOBABillingContract.exitFee()
      const approveBOBATX = await L2BOBAToken.connect(env.l2Wallet).approve(
        L2Bridge.address,
        exitFee
      )
      await approveBOBATX.wait()

      const withdrawTx = await env.waitForXDomainTransaction(
        L2Bridge.withdraw(L2ERC721.address, DUMMY_TOKEN_ID, 9999999)
      )

      const returnedlogIndex = await getFilteredLogIndex(
        withdrawTx.receipt,
        L2NFTBridge.abi,
        L2Bridge.address,
        'WithdrawalInitiated'
      )
      const ifaceL2NFTBridge = new ethers.utils.Interface(L2NFTBridge.abi)
      const log = ifaceL2NFTBridge.parseLog(
        withdrawTx.receipt.logs[returnedlogIndex]
      )

      expect(log.args._data).to.deep.eq('0x')

      const ownerL1 = await L1ERC721.ownerOf(DUMMY_TOKEN_ID)
      const ownerL2 = await L2ERC721.ownerOf(DUMMY_TOKEN_ID)

      expect(ownerL1).to.deep.eq(env.l1Wallet.address)
      expect(ownerL2).to.deep.eq(L2Bridge.address)
    })

    it('{tag:boba} metaData of minted NFT should not match', async () => {
      const l1TokenURI = await L1ERC721.tokenURI(DUMMY_TOKEN_ID)
      const l2TokenURI = await L2ERC721.tokenURI(DUMMY_TOKEN_ID)

      expect(l2TokenURI).to.deep.eq(DUMMY_URI_1)
      expect(l1TokenURI).to.deep.eq('')
    })

    it('{tag:boba} should deposit NFT back without sending data for non-native token', async () => {
      const approveTX = await L1ERC721.connect(env.l1Wallet).approve(
        L1Bridge.address,
        DUMMY_TOKEN_ID
      )
      await approveTX.wait()

      // deposit with metadata does not provide any advantage for non-native token
      const depositTx = await env.waitForXDomainTransaction(
        L1Bridge.connect(env.l1Wallet).depositNFTWithExtraData(
          L1ERC721.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      )

      // check event NFTDepositInitiated is emitted with empty data
      const returnedlogIndex = await getFilteredLogIndex(
        depositTx.receipt,
        L1NFTBridge.abi,
        L1Bridge.address,
        'NFTDepositInitiated'
      )
      const ifaceL1NFTBridge = new ethers.utils.Interface(L1NFTBridge.abi)
      const log = ifaceL1NFTBridge.parseLog(
        depositTx.receipt.logs[returnedlogIndex]
      )

      expect(log.args._data).to.deep.eq('0x')

      await expect(L1ERC721.ownerOf(DUMMY_TOKEN_ID)).to.be.reverted
      await expect(L1ERC721.tokenURI(DUMMY_TOKEN_ID)).to.be.reverted

      const ownerL2 = await L2ERC721.ownerOf(DUMMY_TOKEN_ID)
      const tokenURI = await L2ERC721.tokenURI(DUMMY_TOKEN_ID)
      expect(ownerL2).to.be.deep.eq(env.l2Wallet.address)
      expect(tokenURI).to.be.deep.eq(DUMMY_URI_1)
    })
  })

  describe('L2 native NFT - with Extra Generative Data tests', async () => {
    before(async () => {
      Factory__L2ERC721 = new ContractFactory(
        ERC721ExtraDataJson.abi,
        ERC721ExtraDataJson.bytecode,
        env.l2Wallet
      )

      Factory__L1ERC721 = new ContractFactory(
        L1ERC721ExtraDataJson.abi,
        L1ERC721ExtraDataJson.bytecode,
        env.l1Wallet
      )

      // deploy a L2 native NFT token each time if existing contracts are used for tests
      L2ERC721 = await Factory__L2ERC721.deploy('Test', 'TST')

      await L2ERC721.deployTransaction.wait()

      L1ERC721 = await Factory__L1ERC721.deploy(
        L1Bridge.address,
        L2ERC721.address,
        'Test',
        'TST',
        '' // base-uri
      )

      await L1ERC721.deployTransaction.wait()

      // register NFT
      const registerL1BridgeTx = await L1Bridge.registerNFTPair(
        L1ERC721.address,
        L2ERC721.address,
        'L2'
      )
      await registerL1BridgeTx.wait()

      const registerL2BridgeTx = await L2Bridge.registerNFTPair(
        L1ERC721.address,
        L2ERC721.address,
        'L2'
      )
      await registerL2BridgeTx.wait()
    })

    it('{tag:boba} should withdraw NFT with generative data to L1', async () => {
      // mint nft
      const mintTx = await L2ERC721.mint(
        env.l2Wallet.address,
        DUMMY_TOKEN_ID,
        DUMMY_URI_1 // gen seed
      )
      await mintTx.wait()

      const approveTx = await L2ERC721.approve(L2Bridge.address, DUMMY_TOKEN_ID)
      await approveTx.wait()

      // Approve BOBA
      const exitFee = await BOBABillingContract.exitFee()
      const approveBOBATX = await L2BOBAToken.connect(env.l2Wallet).approve(
        L2Bridge.address,
        exitFee
      )
      await approveBOBATX.wait()

      const withdrawTx = await env.waitForXDomainTransaction(
        L2Bridge.withdrawWithExtraData(
          L2ERC721.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      )

      const returnedlogIndex = await getFilteredLogIndex(
        withdrawTx.receipt,
        L2NFTBridge.abi,
        L2Bridge.address,
        'WithdrawalInitiated'
      )
      const ifaceL2NFTBridge = new ethers.utils.Interface(L2NFTBridge.abi)
      const log = ifaceL2NFTBridge.parseLog(
        withdrawTx.receipt.logs[returnedlogIndex]
      )

      const expectedData = utils.defaultAbiCoder.encode(
        ['string'],
        [DUMMY_URI_1]
      )

      const tokenURI = await L2ERC721.tokenURI(DUMMY_TOKEN_ID)

      expect(log.args._data).to.deep.eq(expectedData)
      expect(log.args._data).to.deep.eq(
        await L2ERC721.bridgeExtraData(DUMMY_TOKEN_ID)
      )

      // seed should be communicated because of the bridgeExtraData override
      expect(log.args._data).to.not.eq(tokenURI)

      const ownerL1 = await L1ERC721.ownerOf(DUMMY_TOKEN_ID)
      const ownerL2 = await L2ERC721.ownerOf(DUMMY_TOKEN_ID)

      expect(ownerL1).to.deep.eq(env.l2Wallet.address)
      expect(ownerL2).to.deep.eq(L2Bridge.address)
    })

    it('{tag:boba} metaData of minted NFT should match', async () => {
      const l1TokenURI = await L1ERC721.tokenURI(DUMMY_TOKEN_ID)
      const l2TokenURI = await L2ERC721.tokenURI(DUMMY_TOKEN_ID)

      expect(l2TokenURI).to.deep.eq(l1TokenURI)
    })

    it('{tag:boba} should deposit NFT back without sending data for non-native token', async () => {
      const approveTX = await L1ERC721.connect(env.l2Wallet).approve(
        L1Bridge.address,
        DUMMY_TOKEN_ID
      )
      await approveTX.wait()

      // deposit with metadata does not provide any advantage for non-native token
      const depositTx = await env.waitForXDomainTransaction(
        L1Bridge.connect(env.l1Wallet).depositNFTWithExtraData(
          L1ERC721.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      )

      // check event NFTDepositInitiated is emitted with empty data
      const returnedlogIndex = await getFilteredLogIndex(
        depositTx.receipt,
        L1NFTBridge.abi,
        L1Bridge.address,
        'NFTDepositInitiated'
      )
      const ifaceL1NFTBridge = new ethers.utils.Interface(L1NFTBridge.abi)
      const log = ifaceL1NFTBridge.parseLog(
        depositTx.receipt.logs[returnedlogIndex]
      )

      expect(log.args._data).to.deep.eq('0x')

      await expect(L1ERC721.ownerOf(DUMMY_TOKEN_ID)).to.be.reverted
      await expect(L1ERC721.tokenURI(DUMMY_TOKEN_ID)).to.be.reverted

      const ownerL2 = await L2ERC721.ownerOf(DUMMY_TOKEN_ID)
      const tokenURI = await L2ERC721.tokenURI(DUMMY_TOKEN_ID)
      expect(ownerL2).to.be.deep.eq(env.l2Wallet.address)
      expect(tokenURI).to.be.deep.eq(DUMMY_URI_1 + 'xyz')
    })

    it('{tag:boba} should withdraw NFT with generative data to another L1 wallet', async () => {
      const approveTx = await L2ERC721.approve(L2Bridge.address, DUMMY_TOKEN_ID)
      await approveTx.wait()

      // Approve BOBA
      const exitFee = await BOBABillingContract.exitFee()
      const approveBOBATX = await L2BOBAToken.connect(env.l2Wallet).approve(
        L2Bridge.address,
        exitFee
      )
      await approveBOBATX.wait()

      const withdrawTx = await env.waitForXDomainTransaction(
        L2Bridge.withdrawWithExtraDataTo(
          L2ERC721.address,
          env.l1Wallet_2.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      )

      const returnedlogIndex = await getFilteredLogIndex(
        withdrawTx.receipt,
        L2NFTBridge.abi,
        L2Bridge.address,
        'WithdrawalInitiated'
      )
      const ifaceL2NFTBridge = new ethers.utils.Interface(L2NFTBridge.abi)
      const log = ifaceL2NFTBridge.parseLog(
        withdrawTx.receipt.logs[returnedlogIndex]
      )

      const expectedData = utils.defaultAbiCoder.encode(
        ['string'],
        [DUMMY_URI_1]
      )

      expect(log.args._data).to.deep.eq(expectedData)
      expect(log.args._data).to.deep.eq(
        await L2ERC721.bridgeExtraData(DUMMY_TOKEN_ID)
      )

      const ownerL1 = await L1ERC721.ownerOf(DUMMY_TOKEN_ID)
      const ownerL2 = await L2ERC721.ownerOf(DUMMY_TOKEN_ID)

      expect(ownerL1).to.deep.eq(env.l1Wallet_2.address)
      expect(ownerL2).to.deep.eq(L2Bridge.address)
    })

    it('{tag:boba} metaData of minted NFT should match', async () => {
      const l1TokenURI = await L1ERC721.tokenURI(DUMMY_TOKEN_ID)
      const l2TokenURI = await L2ERC721.tokenURI(DUMMY_TOKEN_ID)

      expect(l2TokenURI).to.deep.eq(l1TokenURI)
    })

    it('{tag:boba} should deposit NFT back', async () => {
      const approveTX = await L1ERC721.connect(env.l1Wallet_2).approve(
        L1Bridge.address,
        DUMMY_TOKEN_ID
      )
      await approveTX.wait()
      await env.waitForXDomainTransaction(
        L1Bridge.connect(env.l1Wallet_2).depositNFTWithExtraDataTo(
          L1ERC721.address,
          env.l2Wallet.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      )

      await expect(L1ERC721.ownerOf(DUMMY_TOKEN_ID)).to.be.reverted

      const ownerL2 = await L2ERC721.ownerOf(DUMMY_TOKEN_ID)
      expect(ownerL2).to.be.deep.eq(env.l2Wallet.address)
    })

    it('{tag:boba} should be able to withdraw NFT without metadata to L1', async () => {
      const approveTx = await L2ERC721.approve(L2Bridge.address, DUMMY_TOKEN_ID)
      await approveTx.wait()

      // Approve BOBA
      const exitFee = await BOBABillingContract.exitFee()
      const approveBOBATX = await L2BOBAToken.connect(env.l2Wallet).approve(
        L2Bridge.address,
        exitFee
      )
      await approveBOBATX.wait()

      const withdrawTx = await env.waitForXDomainTransaction(
        L2Bridge.withdraw(L2ERC721.address, DUMMY_TOKEN_ID, 9999999)
      )

      const returnedlogIndex = await getFilteredLogIndex(
        withdrawTx.receipt,
        L2NFTBridge.abi,
        L2Bridge.address,
        'WithdrawalInitiated'
      )
      const ifaceL2NFTBridge = new ethers.utils.Interface(L2NFTBridge.abi)
      const log = ifaceL2NFTBridge.parseLog(
        withdrawTx.receipt.logs[returnedlogIndex]
      )

      expect(log.args._data).to.deep.eq('0x')

      const ownerL1 = await L1ERC721.ownerOf(DUMMY_TOKEN_ID)
      const ownerL2 = await L2ERC721.ownerOf(DUMMY_TOKEN_ID)

      expect(ownerL1).to.deep.eq(env.l1Wallet.address)
      expect(ownerL2).to.deep.eq(L2Bridge.address)
    })

    it('{tag:boba} metaData of minted NFT should not match', async () => {
      const l1TokenURI = await L1ERC721.tokenURI(DUMMY_TOKEN_ID)
      const l2TokenURI = await L2ERC721.tokenURI(DUMMY_TOKEN_ID)

      expect(l2TokenURI).to.deep.eq(DUMMY_URI_1 + 'xyz')
      expect(l1TokenURI).to.deep.eq('')
    })

    it('{tag:boba} should deposit NFT back without sending data for non-native token', async () => {
      const approveTX = await L1ERC721.connect(env.l1Wallet).approve(
        L1Bridge.address,
        DUMMY_TOKEN_ID
      )
      await approveTX.wait()

      // deposit with metadata does not provide any advantage for non-native token
      const depositTx = await env.waitForXDomainTransaction(
        L1Bridge.connect(env.l1Wallet).depositNFTWithExtraData(
          L1ERC721.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      )

      // check event NFTDepositInitiated is emitted with empty data
      const returnedlogIndex = await getFilteredLogIndex(
        depositTx.receipt,
        L1NFTBridge.abi,
        L1Bridge.address,
        'NFTDepositInitiated'
      )
      const ifaceL1NFTBridge = new ethers.utils.Interface(L1NFTBridge.abi)
      const log = ifaceL1NFTBridge.parseLog(
        depositTx.receipt.logs[returnedlogIndex]
      )

      expect(log.args._data).to.deep.eq('0x')

      await expect(L1ERC721.ownerOf(DUMMY_TOKEN_ID)).to.be.reverted
      await expect(L1ERC721.tokenURI(DUMMY_TOKEN_ID)).to.be.reverted

      const ownerL2 = await L2ERC721.ownerOf(DUMMY_TOKEN_ID)
      const tokenURI = await L2ERC721.tokenURI(DUMMY_TOKEN_ID)
      expect(ownerL2).to.be.deep.eq(env.l2Wallet.address)
      expect(tokenURI).to.be.deep.eq(DUMMY_URI_1 + 'xyz')
    })
  })

  describe('Bridges pause tests', async () => {
    before(async () => {
      Factory__L1ERC721 = new ContractFactory(
        ERC721Json.abi,
        ERC721Json.bytecode,
        env.l1Wallet
      )

      Factory__L2ERC721 = new ContractFactory(
        L2ERC721Json.abi,
        L2ERC721Json.bytecode,
        env.l2Wallet
      )

      // deploy a L1 native NFT token each time if existing contracts are used for tests
      L1ERC721 = await Factory__L1ERC721.deploy('Test', 'TST')

      await L1ERC721.deployTransaction.wait()

      L2ERC721 = await Factory__L2ERC721.deploy(
        L2Bridge.address,
        L1ERC721.address,
        'Test',
        'TST',
        '' // base-uri
      )

      await L2ERC721.deployTransaction.wait()

      // register NFT
      const registerL1BridgeTx = await L1Bridge.registerNFTPair(
        L1ERC721.address,
        L2ERC721.address,
        'L1'
      )
      await registerL1BridgeTx.wait()

      const registerL2BridgeTx = await L2Bridge.registerNFTPair(
        L1ERC721.address,
        L2ERC721.address,
        'L1'
      )
      await registerL2BridgeTx.wait()
    })

    it('{tag:boba} should pause and unpause L1 bridge', async () => {
      const mintTx = await L1ERC721.mint(env.l1Wallet.address, DUMMY_TOKEN_ID)
      await mintTx.wait()
      const approveTx = await L1ERC721.approve(L1Bridge.address, DUMMY_TOKEN_ID)
      await approveTx.wait()

      const pauseL1Tx = await L1Bridge.pause()
      await pauseL1Tx.wait()

      await expect(
        L1Bridge.depositNFT(L1ERC721.address, DUMMY_TOKEN_ID, 9999999)
      ).to.be.revertedWith('Pausable: paused')

      await expect(
        L1Bridge.depositNFTTo(
          L1ERC721.address,
          env.l1Wallet_2.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      ).to.be.revertedWith('Pausable: paused')

      const unpauseL1Tx = await L1Bridge.unpause()
      await unpauseL1Tx.wait()

      await env.waitForXDomainTransaction(
        L1Bridge.depositNFT(L1ERC721.address, DUMMY_TOKEN_ID, 9999999)
      )

      const ownerL1 = await L1ERC721.ownerOf(DUMMY_TOKEN_ID)
      const ownerL2 = await L2ERC721.ownerOf(DUMMY_TOKEN_ID)

      expect(ownerL1).to.deep.eq(L1Bridge.address)
      expect(ownerL2).to.deep.eq(env.l2Wallet.address)
    })

    it('{tag:boba} should pause and unpause L2 bridge', async () => {
      const approveTx = await L2ERC721.approve(L2Bridge.address, DUMMY_TOKEN_ID)
      await approveTx.wait()

      const pauseL2Tx = await L2Bridge.pause()
      await pauseL2Tx.wait()

      await expect(
        L2Bridge.withdraw(L2ERC721.address, DUMMY_TOKEN_ID, 9999999)
      ).to.be.revertedWith('Pausable: paused')

      await expect(
        L2Bridge.withdrawTo(
          L2ERC721.address,
          env.l1Wallet_2.address,
          DUMMY_TOKEN_ID,
          9999999
        )
      ).to.be.revertedWith('Pausable: paused')

      const unpauseL2Tx = await L2Bridge.unpause()
      await unpauseL2Tx.wait()

      // Approve BOBA
      const exitFee = await BOBABillingContract.exitFee()
      const approveBOBATX = await L2BOBAToken.connect(env.l2Wallet).approve(
        L2Bridge.address,
        exitFee
      )
      await approveBOBATX.wait()

      await env.waitForXDomainTransaction(
        L2Bridge.withdraw(L2ERC721.address, DUMMY_TOKEN_ID, 9999999)
      )

      await expect(L2ERC721.ownerOf(DUMMY_TOKEN_ID)).to.be.reverted

      const ownerL1 = await L1ERC721.ownerOf(DUMMY_TOKEN_ID)
      expect(ownerL1).to.be.deep.eq(env.l2Wallet.address)
    })

    it('{tag:boba} should not allow to pause bridges for non-owner', async () => {
      await expect(L1Bridge.connect(env.l1Wallet_2).pause()).to.be.revertedWith(
        'Caller is not the owner'
      )
      await expect(L2Bridge.connect(env.l2Wallet_2).pause()).to.be.revertedWith(
        'Caller is not the owner'
      )
    })

    it('{tag:boba} should not allow to unpause bridges for non-owner', async () => {
      await expect(
        L1Bridge.connect(env.l1Wallet_2).unpause()
      ).to.be.revertedWith('Caller is not the owner')
      await expect(
        L2Bridge.connect(env.l2Wallet_2).unpause()
      ).to.be.revertedWith('Caller is not the owner')
    })
  })

  describe('Configuration tests', async () => {
    it('{tag:boba} should not allow to configure billing contract address for non-owner', async () => {
      await expect(
        L2Bridge.connect(env.l2Wallet_2).configureBillingContractAddress(
          env.addressesBOBA.Proxy__BobaBillingContract
        )
      ).to.be.revertedWith('Caller is not the owner')
    })

    it('{tag:boba} should not allow to configure billing contract address to zero address', async () => {
      await expect(
        L2Bridge.connect(env.l2Wallet).configureBillingContractAddress(
          ethers.constants.AddressZero
        )
      ).to.be.revertedWith('Billing contract address cannot be zero')
    })
  })
})
