import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
import { Contract, ContractFactory, utils } from 'ethers'

import { getFilteredLogIndex } from './shared/utils'

import L1ERC1155BridgeJson from '@boba/contracts/artifacts/contracts/ERC1155Bridges/L1ERC1155Bridge.sol/L1ERC1155Bridge.json'
import L2ERC1155BridgeJson from '@boba/contracts/artifacts/contracts/ERC1155Bridges/L2ERC1155Bridge.sol/L2ERC1155Bridge.json'
import ERC1155Json from '@boba/contracts/artifacts/contracts/test-helpers/L1ERC1155.sol/L1ERC1155.json'
import L1StandardERC1155Json from '@boba/contracts/artifacts/contracts/standards/L1StandardERC1155.sol/L1StandardERC1155.json'
import L2StandardERC1155Json from '@boba/contracts/artifacts/contracts/standards/L2StandardERC1155.sol/L2StandardERC1155.json'

import L2BillingContractJson from '@boba/contracts/artifacts/contracts/L2BillingContract.sol/L2BillingContract.json'
import L2GovernanceERC20Json from '@boba/contracts/artifacts/contracts/standards/L2GovernanceERC20.sol/L2GovernanceERC20.json'

import L1ERC1155FailingMintJson from '../artifacts/contracts/TestFailingMintL1StandardERC1155.sol/TestFailingMintL1StandardERC1155.json'
import L2ERC1155FailingMintJson from '../artifacts/contracts/TestFailingMintL2StandardERC1155.sol/TestFailingMintL2StandardERC1155.json'

import { OptimismEnv } from './shared/env'
import { ethers } from 'hardhat'

describe('ERC1155 Bridge Test', async () => {
  let Factory__L1ERC1155: ContractFactory
  let Factory__L2ERC1155: ContractFactory
  let L1Bridge: Contract
  let L2Bridge: Contract
  let L1ERC1155: Contract
  let L2ERC1155: Contract

  let L2BOBAToken: Contract
  let BOBABillingContract: Contract

  let env: OptimismEnv

  const DUMMY_URI_1 = 'first-unique-uri'
  const DUMMY_TOKEN_ID_1 = 1
  const DUMMY_TOKEN_ID_2 = 2
  const DUMMY_TOKEN_ID_3 = 3
  const DUMMY_TOKEN_AMOUNT_1 = 100
  const DUMMY_TOKEN_AMOUNT_2 = 200
  const DUMMY_TOKEN_AMOUNT_3 = 300

  before(async () => {
    env = await OptimismEnv.new()

    L1Bridge = new Contract(
      env.addressesBOBA.Proxy__L1ERC1155Bridge,
      L1ERC1155BridgeJson.abi,
      env.l1Wallet
    )

    L2Bridge = new Contract(
      env.addressesBOBA.Proxy__L2ERC1155Bridge,
      L2ERC1155BridgeJson.abi,
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

  describe('L1 native ERC1155 token tests', async () => {
    before(async () => {
      Factory__L1ERC1155 = new ContractFactory(
        ERC1155Json.abi,
        ERC1155Json.bytecode,
        env.l1Wallet
      )

      Factory__L2ERC1155 = new ContractFactory(
        L2StandardERC1155Json.abi,
        L2StandardERC1155Json.bytecode,
        env.l2Wallet
      )

      // deploy a L1 native token token each time if existing contracts are used for tests
      L1ERC1155 = await Factory__L1ERC1155.deploy(DUMMY_URI_1)

      await L1ERC1155.deployTransaction.wait()

      L2ERC1155 = await Factory__L2ERC1155.deploy(
        L2Bridge.address,
        L1ERC1155.address,
        DUMMY_URI_1
      )
      await L2ERC1155.deployTransaction.wait()

      // register token
      const registerL1BridgeTx = await L1Bridge.registerPair(
        L1ERC1155.address,
        L2ERC1155.address,
        'L1'
      )
      await registerL1BridgeTx.wait()

      const registerL2BridgeTx = await L2Bridge.registerPair(
        L1ERC1155.address,
        L2ERC1155.address,
        'L1'
      )
      await registerL2BridgeTx.wait()
    })

    it('should deposit token to L2', async () => {
      // mint token
      const mintTx = await L1ERC1155.mint(
        env.l1Wallet.address,
        DUMMY_TOKEN_ID_1,
        DUMMY_TOKEN_AMOUNT_3
      )
      await mintTx.wait()

      const preL1Balance = await L1ERC1155.balanceOf(
        env.l1Wallet.address,
        DUMMY_TOKEN_ID_1
      )
      const preL2Balance = await L2ERC1155.balanceOf(
        env.l1Wallet.address,
        DUMMY_TOKEN_ID_1
      )

      const approveTx = await L1ERC1155.setApprovalForAll(
        L1Bridge.address,
        DUMMY_TOKEN_ID_1
      )
      await approveTx.wait()

      await env.waitForXDomainTransaction(
        L1Bridge.deposit(
          L1ERC1155.address,
          DUMMY_TOKEN_ID_1,
          DUMMY_TOKEN_AMOUNT_3,
          '0x',
          999999
        )
      )

      const postL1Balance = await L1ERC1155.balanceOf(
        env.l1Wallet.address,
        DUMMY_TOKEN_ID_1
      )
      const postL2Balance = await L2ERC1155.balanceOf(
        env.l1Wallet.address,
        DUMMY_TOKEN_ID_1
      )

      expect(postL1Balance).to.deep.eq(preL1Balance.sub(DUMMY_TOKEN_AMOUNT_3))
      expect(postL2Balance).to.deep.eq(preL2Balance.add(DUMMY_TOKEN_AMOUNT_3))
    })

    it('should be able to transfer tokens on L2', async () => {
      const preOwnerBalance = await L2ERC1155.balanceOf(
        env.l2Wallet.address,
        DUMMY_TOKEN_ID_1
      )
      const preBalance = await L2ERC1155.balanceOf(
        env.l2Wallet_2.address,
        DUMMY_TOKEN_ID_1
      )
      const transferTx = await L2ERC1155.safeTransferFrom(
        env.l2Wallet.address,
        env.l2Wallet_2.address,
        DUMMY_TOKEN_ID_1,
        DUMMY_TOKEN_AMOUNT_1,
        '0x'
      )
      await transferTx.wait()

      const postOwnerBalance = await L2ERC1155.balanceOf(
        env.l2Wallet.address,
        DUMMY_TOKEN_ID_1
      )
      const postBalance = await L2ERC1155.balanceOf(
        env.l2Wallet_2.address,
        DUMMY_TOKEN_ID_1
      )
      expect(postBalance).to.deep.eq(preBalance.add(DUMMY_TOKEN_AMOUNT_1))
      expect(preOwnerBalance).to.deep.eq(
        postOwnerBalance.add(DUMMY_TOKEN_AMOUNT_1)
      )
    })

    it('should not be able to withdraw non-owned tokens', async () => {
      await expect(
        L2Bridge.connect(env.l2Wallet).withdraw(
          L2ERC1155.address,
          DUMMY_TOKEN_ID_1,
          DUMMY_TOKEN_AMOUNT_3,
          '0x',
          999999
        )
      ).to.be.reverted
      await expect(
        L2Bridge.connect(env.l2Wallet).withdraw(
          L2ERC1155.address,
          DUMMY_TOKEN_ID_2,
          DUMMY_TOKEN_AMOUNT_3,
          '0x',
          999999
        )
      ).to.be.reverted
    })

    it('should fail to withdraw the token if not enough Boba balance', async () => {
      const newWallet = ethers.Wallet.createRandom().connect(env.l2Provider)
      await env.l2Wallet.sendTransaction({
        to: newWallet.address,
        value: ethers.utils.parseEther('1'),
      })

      await expect(
        L2Bridge.connect(newWallet).withdraw(
          L2ERC1155.address,
          DUMMY_TOKEN_ID_1,
          DUMMY_TOKEN_AMOUNT_1,
          '0x',
          999999
        )
      ).to.be.reverted
    })

    it('should fail to withdraw the token if not approving Boba', async () => {
      await L2BOBAToken.connect(env.l2Wallet_2).approve(L2Bridge.address, 0)
      await expect(
        L2Bridge.connect(env.l2Wallet_2).withdraw(
          L2ERC1155.address,
          DUMMY_TOKEN_ID_1,
          DUMMY_TOKEN_AMOUNT_1,
          '0x',
          999999
        )
      ).to.be.reverted
    })

    it('should fail to withdraw the token if the amount is 0', async () => {
      const approveTX = await L2ERC1155.connect(
        env.l2Wallet_2
      ).setApprovalForAll(L2Bridge.address, true)
      await approveTX.wait()

      // Approve BOBA
      const exitFee = await BOBABillingContract.exitFee()
      const approveBOBATX = await L2BOBAToken.connect(env.l2Wallet_2).approve(
        L2Bridge.address,
        exitFee
      )
      await approveBOBATX.wait()
      await expect(
        L2Bridge.connect(env.l2Wallet_2).withdraw(
          L2ERC1155.address,
          DUMMY_TOKEN_ID_1,
          0,
          '0x',
          999999
        )
      ).to.be.revertedWith('Amount should be greater than 0')
    })

    it('should be able to withdraw tokens to L1', async () => {
      const preL1Balance = await L1ERC1155.balanceOf(
        env.l2Wallet_2.address,
        DUMMY_TOKEN_ID_1
      )
      const preL2Balance = await L2ERC1155.balanceOf(
        env.l2Wallet_2.address,
        DUMMY_TOKEN_ID_1
      )

      const approveTX = await L2ERC1155.connect(
        env.l2Wallet_2
      ).setApprovalForAll(L2Bridge.address, true)
      await approveTX.wait()

      // Approve BOBA
      const exitFee = await BOBABillingContract.exitFee()
      const approveBOBATX = await L2BOBAToken.connect(env.l2Wallet_2).approve(
        L2Bridge.address,
        exitFee
      )
      await approveBOBATX.wait()

      const withdrawTx = await env.waitForXDomainTransaction(
        L2Bridge.connect(env.l2Wallet_2).withdraw(
          L2ERC1155.address,
          DUMMY_TOKEN_ID_1,
          DUMMY_TOKEN_AMOUNT_1,
          '0x',
          999999
        )
      )

      // check event WithdrawalInitiated is emitted with empty data
      const returnedlogIndex = await getFilteredLogIndex(
        withdrawTx.receipt,
        L2ERC1155BridgeJson.abi,
        L2Bridge.address,
        'WithdrawalInitiated'
      )
      const ifaceL2Bridge = new ethers.utils.Interface(L2ERC1155BridgeJson.abi)
      const log = ifaceL2Bridge.parseLog(
        withdrawTx.receipt.logs[returnedlogIndex]
      )

      expect(log.args._data).to.deep.eq('0x')

      const postL1Balance = await L1ERC1155.balanceOf(
        env.l2Wallet_2.address,
        DUMMY_TOKEN_ID_1
      )
      const postL2Balance = await L2ERC1155.balanceOf(
        env.l2Wallet_2.address,
        DUMMY_TOKEN_ID_1
      )
      expect(postL2Balance).to.deep.eq(preL2Balance.sub(DUMMY_TOKEN_AMOUNT_1))
      expect(postL1Balance).to.deep.eq(preL1Balance.add(DUMMY_TOKEN_AMOUNT_1))
    })

    it('should not be able to deposit unregistered token ', async () => {
      const L1ERC721Test = await Factory__L1ERC1155.deploy(DUMMY_URI_1)
      await L1ERC721Test.deployTransaction.wait()

      const mintTx = await L1ERC721Test.mint(
        env.l1Wallet.address,
        DUMMY_TOKEN_ID_1,
        DUMMY_TOKEN_AMOUNT_1
      )
      await mintTx.wait()
      const approveTx = await L1ERC721Test.setApprovalForAll(
        L1Bridge.address,
        true
      )
      await approveTx.wait()

      await expect(
        L1Bridge.deposit(
          L1ERC721Test.address,
          DUMMY_TOKEN_ID_1,
          DUMMY_TOKEN_AMOUNT_1,
          '0x',
          999999
        )
      ).to.be.revertedWith("Can't Find L2 token Contract")
      await expect(
        L1Bridge.depositTo(
          L1ERC721Test.address,
          env.l2Wallet_2.address,
          DUMMY_TOKEN_ID_1,
          DUMMY_TOKEN_AMOUNT_1,
          '0x',
          999999
        )
      ).to.be.revertedWith("Can't Find L2 token Contract")
    })

    it('should not be able to mint token on L2', async () => {
      await expect(
        L2ERC1155.mint(
          env.l2Wallet.address,
          DUMMY_TOKEN_ID_2,
          DUMMY_TOKEN_AMOUNT_1,
          '0x'
        )
      ).to.be.revertedWith('Only L2 Bridge can mint and burn')
    })

    it('should not be able to burn token on L2', async () => {
      await expect(
        L2ERC1155.burn(
          env.l1Wallet.address,
          DUMMY_TOKEN_ID_1,
          DUMMY_TOKEN_AMOUNT_1
        )
      ).to.be.revertedWith('Only L2 Bridge can mint and burn')
    })

    it('should be able to deposit zero amount of token to L2', async () => {
      // mint token
      const mintTx = await L1ERC1155.mint(
        env.l1Wallet.address,
        DUMMY_TOKEN_ID_1,
        DUMMY_TOKEN_AMOUNT_3
      )
      await mintTx.wait()
      await expect(
        L1Bridge.deposit(L1ERC1155.address, DUMMY_TOKEN_ID_1, 0, '0x', 999999)
      ).to.be.revertedWith('Amount should be greater than 0')
    })

    it('should be able to deposit token to another wallet on L2', async () => {
      const preOwnerL1Balance = await L1ERC1155.balanceOf(
        env.l1Wallet.address,
        DUMMY_TOKEN_ID_1
      )
      const preL2Balance = await L2ERC1155.balanceOf(
        env.l2Wallet_2.address,
        DUMMY_TOKEN_ID_1
      )
      await env.waitForXDomainTransaction(
        L1Bridge.depositTo(
          L1ERC1155.address,
          env.l2Wallet_2.address,
          DUMMY_TOKEN_ID_1,
          DUMMY_TOKEN_AMOUNT_3,
          '0x',
          999999
        )
      )
      const postOwnerL1Balance = await L1ERC1155.balanceOf(
        env.l1Wallet.address,
        DUMMY_TOKEN_ID_1
      )
      const postL2Balance = await L2ERC1155.balanceOf(
        env.l2Wallet_2.address,
        DUMMY_TOKEN_ID_1
      )
      expect(postOwnerL1Balance).to.deep.eq(
        preOwnerL1Balance.sub(DUMMY_TOKEN_AMOUNT_3)
      )
      expect(postL2Balance).to.deep.eq(preL2Balance.add(DUMMY_TOKEN_AMOUNT_3))
    })

    it('should be able to withdraw token to another wallet on L1', async () => {
      const preOwnerL2Balance = await L2ERC1155.balanceOf(
        env.l1Wallet_2.address,
        DUMMY_TOKEN_ID_1
      )
      const preL1Balance = await L1ERC1155.balanceOf(
        env.l1Wallet.address,
        DUMMY_TOKEN_ID_1
      )

      const approveTX = await L2ERC1155.connect(
        env.l2Wallet_2
      ).setApprovalForAll(L2Bridge.address, true)
      await approveTX.wait()

      // Approve BOBA
      const exitFee = await BOBABillingContract.exitFee()
      const approveBOBATX = await L2BOBAToken.connect(env.l2Wallet_2).approve(
        L2Bridge.address,
        exitFee
      )
      await approveBOBATX.wait()

      await env.waitForXDomainTransaction(
        L2Bridge.connect(env.l2Wallet_2).withdrawTo(
          L2ERC1155.address,
          env.l1Wallet.address,
          DUMMY_TOKEN_ID_1,
          DUMMY_TOKEN_AMOUNT_1,
          '0x',
          999999
        )
      )

      const postOwnerL2Balance = await L2ERC1155.balanceOf(
        env.l1Wallet_2.address,
        DUMMY_TOKEN_ID_1
      )
      const postL1Balance = await L1ERC1155.balanceOf(
        env.l1Wallet.address,
        DUMMY_TOKEN_ID_1
      )
      expect(postOwnerL2Balance).to.deep.eq(
        preOwnerL2Balance.sub(DUMMY_TOKEN_AMOUNT_1)
      )
      expect(postL1Balance).to.deep.eq(preL1Balance.add(DUMMY_TOKEN_AMOUNT_1))
    })

    it('should be able to deposit a batch of tokens to L2', async () => {
      const mintType1Tx = await L1ERC1155.mint(
        env.l1Wallet.address,
        DUMMY_TOKEN_ID_1,
        DUMMY_TOKEN_AMOUNT_3
      )
      await mintType1Tx.wait()
      const mintType2Tx = await L1ERC1155.mint(
        env.l1Wallet.address,
        DUMMY_TOKEN_ID_2,
        DUMMY_TOKEN_AMOUNT_3
      )
      await mintType2Tx.wait()
      const mintType3Tx = await L1ERC1155.mint(
        env.l1Wallet.address,
        DUMMY_TOKEN_ID_3,
        DUMMY_TOKEN_AMOUNT_3
      )
      await mintType3Tx.wait()
      const [preL1Balance1, preL1Balance2, preL1Balance3] =
        await L1ERC1155.balanceOfBatch(
          [env.l1Wallet.address, env.l1Wallet.address, env.l1Wallet.address],
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3]
        )
      const [preL2Balance1, preL2Balance2, preL2Balance3] =
        await L2ERC1155.balanceOfBatch(
          [env.l2Wallet.address, env.l2Wallet.address, env.l2Wallet.address],
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3]
        )
      await env.waitForXDomainTransaction(
        L1Bridge.depositBatch(
          L1ERC1155.address,
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3],
          [DUMMY_TOKEN_AMOUNT_3, DUMMY_TOKEN_AMOUNT_3, DUMMY_TOKEN_AMOUNT_3],
          '0x',
          999999
        )
      )
      const [postL1Balance1, postL1Balance2, postL1Balance3] =
        await L1ERC1155.balanceOfBatch(
          [env.l1Wallet.address, env.l1Wallet.address, env.l1Wallet.address],
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3]
        )
      const [postL2Balance1, postL2Balance2, postL2Balance3] =
        await L2ERC1155.balanceOfBatch(
          [env.l2Wallet.address, env.l2Wallet.address, env.l2Wallet.address],
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3]
        )
      expect(postL2Balance1).to.deep.eq(preL2Balance1.add(DUMMY_TOKEN_AMOUNT_3))
      expect(postL2Balance2).to.deep.eq(preL2Balance2.add(DUMMY_TOKEN_AMOUNT_3))
      expect(postL2Balance3).to.deep.eq(preL2Balance3.add(DUMMY_TOKEN_AMOUNT_3))
      expect(postL1Balance1).to.deep.eq(preL1Balance1.sub(DUMMY_TOKEN_AMOUNT_3))
      expect(postL1Balance2).to.deep.eq(preL1Balance2.sub(DUMMY_TOKEN_AMOUNT_3))
      expect(postL1Balance3).to.deep.eq(preL1Balance3.sub(DUMMY_TOKEN_AMOUNT_3))
    })

    it('should not deposit a batch of tokens to L2 if the amount is zero', async () => {
      const mintType1Tx = await L1ERC1155.mint(
        env.l1Wallet.address,
        DUMMY_TOKEN_ID_1,
        DUMMY_TOKEN_AMOUNT_3
      )
      await mintType1Tx.wait()
      const mintType2Tx = await L1ERC1155.mint(
        env.l1Wallet.address,
        DUMMY_TOKEN_ID_2,
        DUMMY_TOKEN_AMOUNT_3
      )
      await mintType2Tx.wait()
      const mintType3Tx = await L1ERC1155.mint(
        env.l1Wallet.address,
        DUMMY_TOKEN_ID_3,
        DUMMY_TOKEN_AMOUNT_3
      )
      await mintType3Tx.wait()

      await expect(
        L1Bridge.depositBatch(
          L1ERC1155.address,
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3],
          [DUMMY_TOKEN_AMOUNT_3, 0, DUMMY_TOKEN_AMOUNT_3],
          '0x',
          999999
        )
      ).to.be.revertedWith('Amount should be greater than 0')
    })

    it('should withdraw a batch of tokens from L2 to L1', async () => {
      const [preL1Balance1, preL1Balance2, preL1Balance3] =
        await L1ERC1155.balanceOfBatch(
          [env.l1Wallet.address, env.l1Wallet.address, env.l1Wallet.address],
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3]
        )
      const [preL2Balance1, preL2Balance2, preL2Balance3] =
        await L2ERC1155.balanceOfBatch(
          [env.l2Wallet.address, env.l2Wallet.address, env.l2Wallet.address],
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3]
        )

      const approveTX = await L2ERC1155.connect(env.l2Wallet).setApprovalForAll(
        L2Bridge.address,
        true
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
        L2Bridge.withdrawBatch(
          L2ERC1155.address,
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3],
          [DUMMY_TOKEN_AMOUNT_1, DUMMY_TOKEN_AMOUNT_2, DUMMY_TOKEN_AMOUNT_3],
          '0x',
          999999
        )
      )

      const [postL1Balance1, postL1Balance2, postL1Balance3] =
        await L1ERC1155.balanceOfBatch(
          [env.l1Wallet.address, env.l1Wallet.address, env.l1Wallet.address],
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3]
        )
      const [postL2Balance1, postL2Balance2, postL2Balance3] =
        await L2ERC1155.balanceOfBatch(
          [env.l2Wallet.address, env.l2Wallet.address, env.l2Wallet.address],
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3]
        )
      expect(postL2Balance1).to.deep.eq(preL2Balance1.sub(DUMMY_TOKEN_AMOUNT_1))
      expect(postL2Balance2).to.deep.eq(preL2Balance2.sub(DUMMY_TOKEN_AMOUNT_2))
      expect(postL2Balance3).to.deep.eq(preL2Balance3.sub(DUMMY_TOKEN_AMOUNT_3))
      expect(postL1Balance1).to.deep.eq(preL1Balance1.add(DUMMY_TOKEN_AMOUNT_1))
      expect(postL1Balance2).to.deep.eq(preL1Balance2.add(DUMMY_TOKEN_AMOUNT_2))
      expect(postL1Balance3).to.deep.eq(preL1Balance3.add(DUMMY_TOKEN_AMOUNT_3))
    })

    it('should be able to deposit a batch of tokens to another wallet on L2', async () => {
      const mintType1Tx = await L1ERC1155.mint(
        env.l1Wallet.address,
        DUMMY_TOKEN_ID_1,
        DUMMY_TOKEN_AMOUNT_3
      )
      await mintType1Tx.wait()
      const mintType2Tx = await L1ERC1155.mint(
        env.l1Wallet.address,
        DUMMY_TOKEN_ID_2,
        DUMMY_TOKEN_AMOUNT_3
      )
      await mintType2Tx.wait()
      const mintType3Tx = await L1ERC1155.mint(
        env.l1Wallet.address,
        DUMMY_TOKEN_ID_3,
        DUMMY_TOKEN_AMOUNT_3
      )
      await mintType3Tx.wait()
      const [preL1Balance1, preL1Balance2, preL1Balance3] =
        await L1ERC1155.balanceOfBatch(
          [env.l1Wallet.address, env.l1Wallet.address, env.l1Wallet.address],
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3]
        )
      const [preL2Balance1, preL2Balance2, preL2Balance3] =
        await L2ERC1155.balanceOfBatch(
          [
            env.l2Wallet_2.address,
            env.l2Wallet_2.address,
            env.l2Wallet_2.address,
          ],
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3]
        )
      await env.waitForXDomainTransaction(
        L1Bridge.depositBatchTo(
          L1ERC1155.address,
          env.l2Wallet_2.address,
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3],
          [DUMMY_TOKEN_AMOUNT_3, DUMMY_TOKEN_AMOUNT_3, DUMMY_TOKEN_AMOUNT_3],
          '0x',
          999999
        )
      )
      const [postL1Balance1, postL1Balance2, postL1Balance3] =
        await L1ERC1155.balanceOfBatch(
          [env.l1Wallet.address, env.l1Wallet.address, env.l1Wallet.address],
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3]
        )
      const [postL2Balance1, postL2Balance2, postL2Balance3] =
        await L2ERC1155.balanceOfBatch(
          [
            env.l2Wallet_2.address,
            env.l2Wallet_2.address,
            env.l2Wallet_2.address,
          ],
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3]
        )
      expect(postL2Balance1).to.deep.eq(preL2Balance1.add(DUMMY_TOKEN_AMOUNT_3))
      expect(postL2Balance2).to.deep.eq(preL2Balance2.add(DUMMY_TOKEN_AMOUNT_3))
      expect(postL2Balance3).to.deep.eq(preL2Balance3.add(DUMMY_TOKEN_AMOUNT_3))
      expect(postL1Balance1).to.deep.eq(preL1Balance1.sub(DUMMY_TOKEN_AMOUNT_3))
      expect(postL1Balance2).to.deep.eq(preL1Balance2.sub(DUMMY_TOKEN_AMOUNT_3))
      expect(postL1Balance3).to.deep.eq(preL1Balance3.sub(DUMMY_TOKEN_AMOUNT_3))
    })

    it('should withdraw a batch of tokens to another wallet from L2 to L1', async () => {
      const [preL1Balance1, preL1Balance2, preL1Balance3] =
        await L1ERC1155.balanceOfBatch(
          [env.l1Wallet.address, env.l1Wallet.address, env.l1Wallet.address],
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3]
        )
      const [preL2Balance1, preL2Balance2, preL2Balance3] =
        await L2ERC1155.balanceOfBatch(
          [
            env.l2Wallet_2.address,
            env.l2Wallet_2.address,
            env.l2Wallet_2.address,
          ],
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3]
        )

      const approveTX = await L2ERC1155.connect(
        env.l2Wallet_2
      ).setApprovalForAll(L2Bridge.address, true)
      await approveTX.wait()

      // Approve BOBA
      const exitFee = await BOBABillingContract.exitFee()
      const approveBOBATX = await L2BOBAToken.connect(env.l2Wallet_2).approve(
        L2Bridge.address,
        exitFee
      )
      await approveBOBATX.wait()

      await env.waitForXDomainTransaction(
        L2Bridge.connect(env.l2Wallet_2).withdrawBatchTo(
          L2ERC1155.address,
          env.l1Wallet.address,
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3],
          [DUMMY_TOKEN_AMOUNT_1, DUMMY_TOKEN_AMOUNT_2, DUMMY_TOKEN_AMOUNT_3],
          '0x',
          999999
        )
      )

      const [postL1Balance1, postL1Balance2, postL1Balance3] =
        await L1ERC1155.balanceOfBatch(
          [env.l1Wallet.address, env.l1Wallet.address, env.l1Wallet.address],
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3]
        )
      const [postL2Balance1, postL2Balance2, postL2Balance3] =
        await L2ERC1155.balanceOfBatch(
          [
            env.l2Wallet_2.address,
            env.l2Wallet_2.address,
            env.l2Wallet_2.address,
          ],
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3]
        )
      expect(postL2Balance1).to.deep.eq(preL2Balance1.sub(DUMMY_TOKEN_AMOUNT_1))
      expect(postL2Balance2).to.deep.eq(preL2Balance2.sub(DUMMY_TOKEN_AMOUNT_2))
      expect(postL2Balance3).to.deep.eq(preL2Balance3.sub(DUMMY_TOKEN_AMOUNT_3))
      expect(postL1Balance1).to.deep.eq(preL1Balance1.add(DUMMY_TOKEN_AMOUNT_1))
      expect(postL1Balance2).to.deep.eq(preL1Balance2.add(DUMMY_TOKEN_AMOUNT_2))
      expect(postL1Balance3).to.deep.eq(preL1Balance3.add(DUMMY_TOKEN_AMOUNT_3))
    })
  })

  describe('L2 native ERC1155 token tests', async () => {
    before(async () => {
      Factory__L2ERC1155 = new ContractFactory(
        ERC1155Json.abi,
        ERC1155Json.bytecode,
        env.l2Wallet
      )

      Factory__L1ERC1155 = new ContractFactory(
        L1StandardERC1155Json.abi,
        L1StandardERC1155Json.bytecode,
        env.l1Wallet
      )

      // deploy a L2 native token token each time if existing contracts are used for tests
      L2ERC1155 = await Factory__L2ERC1155.deploy(DUMMY_URI_1)

      await L2ERC1155.deployTransaction.wait()

      L1ERC1155 = await Factory__L1ERC1155.deploy(
        L1Bridge.address,
        L2ERC1155.address,
        DUMMY_URI_1
      )
      await L1ERC1155.deployTransaction.wait()

      // register token
      const registerL1BridgeTx = await L1Bridge.registerPair(
        L1ERC1155.address,
        L2ERC1155.address,
        'L2'
      )
      await registerL1BridgeTx.wait()

      const registerL2BridgeTx = await L2Bridge.registerPair(
        L1ERC1155.address,
        L2ERC1155.address,
        'L2'
      )
      await registerL2BridgeTx.wait()
    })

    it('should withdraw token from L2 to L1', async () => {
      // mint token
      const mintTx = await L2ERC1155.mint(
        env.l2Wallet.address,
        DUMMY_TOKEN_ID_1,
        DUMMY_TOKEN_AMOUNT_3
      )
      await mintTx.wait()

      const preL1Balance = await L1ERC1155.balanceOf(
        env.l1Wallet.address,
        DUMMY_TOKEN_ID_1
      )
      const preL2Balance = await L2ERC1155.balanceOf(
        env.l1Wallet.address,
        DUMMY_TOKEN_ID_1
      )

      const approveTx = await L2ERC1155.setApprovalForAll(
        L2Bridge.address,
        DUMMY_TOKEN_ID_1
      )
      await approveTx.wait()

      // Approve BOBA
      const exitFee = await BOBABillingContract.exitFee()
      const approveBOBATX = await L2BOBAToken.approve(L2Bridge.address, exitFee)
      await approveBOBATX.wait()

      await env.waitForXDomainTransaction(
        L2Bridge.withdraw(
          L2ERC1155.address,
          DUMMY_TOKEN_ID_1,
          DUMMY_TOKEN_AMOUNT_3,
          '0x',
          999999
        )
      )

      const postL1Balance = await L1ERC1155.balanceOf(
        env.l1Wallet.address,
        DUMMY_TOKEN_ID_1
      )
      const postL2Balance = await L2ERC1155.balanceOf(
        env.l1Wallet.address,
        DUMMY_TOKEN_ID_1
      )

      expect(postL1Balance).to.deep.eq(preL1Balance.add(DUMMY_TOKEN_AMOUNT_3))
      expect(postL2Balance).to.deep.eq(preL2Balance.sub(DUMMY_TOKEN_AMOUNT_3))
    })

    it('should be able to transfer tokens on L1', async () => {
      const preOwnerBalance = await L1ERC1155.balanceOf(
        env.l1Wallet.address,
        DUMMY_TOKEN_ID_1
      )
      const preBalance = await L1ERC1155.balanceOf(
        env.l1Wallet_2.address,
        DUMMY_TOKEN_ID_1
      )
      const transferTx = await L1ERC1155.safeTransferFrom(
        env.l1Wallet.address,
        env.l1Wallet_2.address,
        DUMMY_TOKEN_ID_1,
        DUMMY_TOKEN_AMOUNT_1,
        '0x'
      )
      await transferTx.wait()

      const postOwnerBalance = await L1ERC1155.balanceOf(
        env.l1Wallet.address,
        DUMMY_TOKEN_ID_1
      )
      const postBalance = await L1ERC1155.balanceOf(
        env.l1Wallet_2.address,
        DUMMY_TOKEN_ID_1
      )
      expect(postBalance).to.deep.eq(preBalance.add(DUMMY_TOKEN_AMOUNT_1))
      expect(preOwnerBalance).to.deep.eq(
        postOwnerBalance.add(DUMMY_TOKEN_AMOUNT_1)
      )
    })

    it('should not be able to deposit non-owned tokens', async () => {
      await expect(
        L1Bridge.connect(env.l1Wallet).deposit(
          L1ERC1155.address,
          DUMMY_TOKEN_ID_1,
          DUMMY_TOKEN_AMOUNT_3,
          '0x',
          999999
        )
      ).to.be.reverted
      await expect(
        L1Bridge.connect(env.l1Wallet).deposit(
          L2ERC1155.address,
          DUMMY_TOKEN_ID_2,
          DUMMY_TOKEN_AMOUNT_3,
          '0x',
          999999
        )
      ).to.be.reverted
    })

    it('should fail to deposit the token if not enough Boba balance', async () => {
      const newWallet = ethers.Wallet.createRandom().connect(env.l2Provider)
      await env.l2Wallet.sendTransaction({
        to: newWallet.address,
        value: ethers.utils.parseEther('1'),
      })

      const mintTx = await L2ERC1155.mint(
        env.l2Wallet.address,
        DUMMY_TOKEN_ID_1,
        DUMMY_TOKEN_AMOUNT_3
      )
      await mintTx.wait()

      const transferTx = await L2ERC1155.safeTransferFrom(
        env.l2Wallet.address,
        newWallet.address,
        DUMMY_TOKEN_ID_1,
        DUMMY_TOKEN_AMOUNT_1,
        '0x'
      )
      await transferTx.wait()

      await expect(
        L2Bridge.connect(newWallet).withdraw(
          L2ERC1155.address,
          DUMMY_TOKEN_ID_1,
          DUMMY_TOKEN_AMOUNT_1,
          '0x',
          999999
        )
      ).to.be.revertedWith(
        'execution reverted: ERC20: transfer amount exceeds balance'
      )
    })

    it('should fail to withdraw the token if not approving Boba', async () => {
      const mintTx = await L2ERC1155.mint(
        env.l2Wallet.address,
        DUMMY_TOKEN_ID_1,
        DUMMY_TOKEN_AMOUNT_3
      )
      await mintTx.wait()

      const transferTx = await L2ERC1155.safeTransferFrom(
        env.l2Wallet.address,
        env.l2Wallet_2.address,
        DUMMY_TOKEN_ID_1,
        DUMMY_TOKEN_AMOUNT_1,
        '0x'
      )
      await transferTx.wait()

      await L2ERC1155.connect(env.l2Wallet_2).setApprovalForAll(
        L2Bridge.address,
        true
      )

      await L2BOBAToken.connect(env.l2Wallet_2).approve(L2Bridge.address, 0)

      await expect(
        L2Bridge.connect(env.l2Wallet_2).withdraw(
          L2ERC1155.address,
          DUMMY_TOKEN_ID_1,
          DUMMY_TOKEN_AMOUNT_1,
          '0x',
          999999
        )
      ).to.be.reverted
    })

    it('should fail to withdraw the token if the amount is 0', async () => {
      const approveTX = await L2ERC1155.connect(
        env.l2Wallet_2
      ).setApprovalForAll(L2Bridge.address, true)
      await approveTX.wait()

      // Approve BOBA
      const exitFee = await BOBABillingContract.exitFee()
      const approveBOBATX = await L2BOBAToken.connect(env.l2Wallet_2).approve(
        L2Bridge.address,
        exitFee
      )
      await approveBOBATX.wait()
      await expect(
        L2Bridge.connect(env.l2Wallet_2).withdraw(
          L2ERC1155.address,
          DUMMY_TOKEN_ID_1,
          0,
          '0x',
          999999
        )
      ).to.be.revertedWith('Amount should be greater than 0')
    })

    it('should be able to deposit tokens from L1 to L2', async () => {
      const preL1Balance = await L1ERC1155.balanceOf(
        env.l1Wallet.address,
        DUMMY_TOKEN_ID_1
      )
      const preL2Balance = await L2ERC1155.balanceOf(
        env.l2Wallet.address,
        DUMMY_TOKEN_ID_1
      )

      const depositTx = await env.waitForXDomainTransaction(
        L1Bridge.connect(env.l1Wallet).deposit(
          L1ERC1155.address,
          DUMMY_TOKEN_ID_1,
          DUMMY_TOKEN_AMOUNT_1,
          '0x',
          999999
        )
      )

      // check event WithdrawalInitiated is emitted with empty data
      const returnedlogIndex = await getFilteredLogIndex(
        depositTx.receipt,
        L1ERC1155BridgeJson.abi,
        L1Bridge.address,
        'DepositInitiated'
      )
      const ifaceL1Bridge = new ethers.utils.Interface(L1ERC1155BridgeJson.abi)
      const log = ifaceL1Bridge.parseLog(
        depositTx.receipt.logs[returnedlogIndex]
      )

      expect(log.args._data).to.deep.eq('0x')

      const postL1Balance = await L1ERC1155.balanceOf(
        env.l1Wallet.address,
        DUMMY_TOKEN_ID_1
      )
      const postL2Balance = await L2ERC1155.balanceOf(
        env.l2Wallet.address,
        DUMMY_TOKEN_ID_1
      )
      expect(postL2Balance).to.deep.eq(preL2Balance.add(DUMMY_TOKEN_AMOUNT_1))
      expect(postL1Balance).to.deep.eq(preL1Balance.sub(DUMMY_TOKEN_AMOUNT_1))
    })

    it('should not be able to withdraw unregistered token ', async () => {
      const L2ERC1155Test = await Factory__L2ERC1155.deploy(DUMMY_URI_1)
      await L2ERC1155Test.deployTransaction.wait()

      const mintTx = await L2ERC1155Test.mint(
        env.l2Wallet.address,
        DUMMY_TOKEN_ID_1,
        DUMMY_TOKEN_AMOUNT_1
      )
      await mintTx.wait()
      const approveTx = await L2ERC1155Test.setApprovalForAll(
        L1Bridge.address,
        true
      )
      await approveTx.wait()

      // Approve BOBA
      const exitFee = await BOBABillingContract.exitFee()
      const approveBOBATX = await L2BOBAToken.approve(L2Bridge.address, exitFee)
      await approveBOBATX.wait()

      await expect(
        L2Bridge.withdraw(
          L2ERC1155Test.address,
          DUMMY_TOKEN_ID_1,
          DUMMY_TOKEN_AMOUNT_1,
          '0x',
          999999
        )
      ).to.be.revertedWith("Can't Find L1 token Contract")
      await expect(
        L2Bridge.withdrawTo(
          L2ERC1155Test.address,
          env.l2Wallet_2.address,
          DUMMY_TOKEN_ID_1,
          DUMMY_TOKEN_AMOUNT_1,
          '0x',
          999999
        )
      ).to.be.revertedWith("Can't Find L1 token Contract")
    })

    it('should not be able to mint token on L1', async () => {
      await expect(
        L1ERC1155.mint(
          env.l2Wallet.address,
          DUMMY_TOKEN_ID_2,
          DUMMY_TOKEN_AMOUNT_1,
          '0x'
        )
      ).to.be.revertedWith('Only L1 Bridge can mint and burn')
    })

    it('should not be able to burn token on L1', async () => {
      await expect(
        L1ERC1155.burn(
          env.l1Wallet.address,
          DUMMY_TOKEN_ID_1,
          DUMMY_TOKEN_AMOUNT_1
        )
      ).to.be.revertedWith('Only L1 Bridge can mint and burn')
    })

    it('should be able to withdraw token to another wallet on L1', async () => {
      const preOwnerL2Balance = await L2ERC1155.balanceOf(
        env.l2Wallet.address,
        DUMMY_TOKEN_ID_1
      )
      const preL1Balance = await L1ERC1155.balanceOf(
        env.l1Wallet_2.address,
        DUMMY_TOKEN_ID_1
      )

      // Approve BOBA
      const exitFee = await BOBABillingContract.exitFee()
      const approveBOBATX = await L2BOBAToken.approve(L2Bridge.address, exitFee)
      await approveBOBATX.wait()

      await env.waitForXDomainTransaction(
        L2Bridge.withdrawTo(
          L2ERC1155.address,
          env.l2Wallet_2.address,
          DUMMY_TOKEN_ID_1,
          DUMMY_TOKEN_AMOUNT_3,
          '0x',
          999999
        )
      )
      const postOwnerL2Balance = await L2ERC1155.balanceOf(
        env.l2Wallet.address,
        DUMMY_TOKEN_ID_1
      )
      const postL1Balance = await L1ERC1155.balanceOf(
        env.l1Wallet_2.address,
        DUMMY_TOKEN_ID_1
      )
      expect(postOwnerL2Balance).to.deep.eq(
        preOwnerL2Balance.sub(DUMMY_TOKEN_AMOUNT_3)
      )
      expect(postL1Balance).to.deep.eq(preL1Balance.add(DUMMY_TOKEN_AMOUNT_3))
    })

    it('should be able to deposit token to another wallet on L2', async () => {
      const preOwnerL1Balance = await L1ERC1155.balanceOf(
        env.l1Wallet_2.address,
        DUMMY_TOKEN_ID_1
      )
      const preL2Balance = await L2ERC1155.balanceOf(
        env.l2Wallet.address,
        DUMMY_TOKEN_ID_1
      )

      const approveTX = await L1ERC1155.connect(
        env.l2Wallet_2
      ).setApprovalForAll(L1Bridge.address, true)
      await approveTX.wait()

      await env.waitForXDomainTransaction(
        L1Bridge.connect(env.l1Wallet_2).depositTo(
          L1ERC1155.address,
          env.l2Wallet.address,
          DUMMY_TOKEN_ID_1,
          DUMMY_TOKEN_AMOUNT_1,
          '0x',
          999999
        )
      )

      const postOwnerL1Balance = await L1ERC1155.balanceOf(
        env.l1Wallet_2.address,
        DUMMY_TOKEN_ID_1
      )
      const postL2Balance = await L2ERC1155.balanceOf(
        env.l2Wallet.address,
        DUMMY_TOKEN_ID_1
      )
      expect(postOwnerL1Balance).to.deep.eq(
        preOwnerL1Balance.sub(DUMMY_TOKEN_AMOUNT_1)
      )
      expect(postL2Balance).to.deep.eq(preL2Balance.add(DUMMY_TOKEN_AMOUNT_1))
    })

    it('should withdraw a batch of tokens from L2 to L1', async () => {
      const mintType1Tx = await L2ERC1155.mint(
        env.l2Wallet.address,
        DUMMY_TOKEN_ID_1,
        DUMMY_TOKEN_AMOUNT_3
      )
      await mintType1Tx.wait()
      const mintType2Tx = await L2ERC1155.mint(
        env.l2Wallet.address,
        DUMMY_TOKEN_ID_2,
        DUMMY_TOKEN_AMOUNT_3
      )
      await mintType2Tx.wait()
      const mintType3Tx = await L2ERC1155.mint(
        env.l2Wallet.address,
        DUMMY_TOKEN_ID_3,
        DUMMY_TOKEN_AMOUNT_3
      )
      await mintType3Tx.wait()

      const [preL1Balance1, preL1Balance2, preL1Balance3] =
        await L1ERC1155.balanceOfBatch(
          [env.l1Wallet.address, env.l1Wallet.address, env.l1Wallet.address],
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3]
        )
      const [preL2Balance1, preL2Balance2, preL2Balance3] =
        await L2ERC1155.balanceOfBatch(
          [env.l2Wallet.address, env.l2Wallet.address, env.l2Wallet.address],
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3]
        )

      const approveTX = await L2ERC1155.connect(env.l2Wallet).setApprovalForAll(
        L2Bridge.address,
        true
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
        L2Bridge.withdrawBatch(
          L2ERC1155.address,
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3],
          [DUMMY_TOKEN_AMOUNT_1, DUMMY_TOKEN_AMOUNT_2, DUMMY_TOKEN_AMOUNT_3],
          '0x',
          999999
        )
      )

      const [postL1Balance1, postL1Balance2, postL1Balance3] =
        await L1ERC1155.balanceOfBatch(
          [env.l1Wallet.address, env.l1Wallet.address, env.l1Wallet.address],
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3]
        )
      const [postL2Balance1, postL2Balance2, postL2Balance3] =
        await L2ERC1155.balanceOfBatch(
          [env.l2Wallet.address, env.l2Wallet.address, env.l2Wallet.address],
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3]
        )
      expect(postL2Balance1).to.deep.eq(preL2Balance1.sub(DUMMY_TOKEN_AMOUNT_1))
      expect(postL2Balance2).to.deep.eq(preL2Balance2.sub(DUMMY_TOKEN_AMOUNT_2))
      expect(postL2Balance3).to.deep.eq(preL2Balance3.sub(DUMMY_TOKEN_AMOUNT_3))
      expect(postL1Balance1).to.deep.eq(preL1Balance1.add(DUMMY_TOKEN_AMOUNT_1))
      expect(postL1Balance2).to.deep.eq(preL1Balance2.add(DUMMY_TOKEN_AMOUNT_2))
      expect(postL1Balance3).to.deep.eq(preL1Balance3.add(DUMMY_TOKEN_AMOUNT_3))
    })

    it('should not withdraw a batch of tokens to L1 if the amount is zero', async () => {
      const mintType1Tx = await L2ERC1155.mint(
        env.l1Wallet.address,
        DUMMY_TOKEN_ID_1,
        DUMMY_TOKEN_AMOUNT_3
      )
      await mintType1Tx.wait()
      const mintType2Tx = await L2ERC1155.mint(
        env.l1Wallet.address,
        DUMMY_TOKEN_ID_2,
        DUMMY_TOKEN_AMOUNT_3
      )
      await mintType2Tx.wait()
      const mintType3Tx = await L2ERC1155.mint(
        env.l1Wallet.address,
        DUMMY_TOKEN_ID_3,
        DUMMY_TOKEN_AMOUNT_3
      )
      await mintType3Tx.wait()

      // Approve BOBA
      const exitFee = await BOBABillingContract.exitFee()
      const approveBOBATX = await L2BOBAToken.connect(env.l2Wallet).approve(
        L2Bridge.address,
        exitFee
      )
      await approveBOBATX.wait()

      await expect(
        L2Bridge.withdrawBatch(
          L2ERC1155.address,
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3],
          [DUMMY_TOKEN_AMOUNT_3, 0, DUMMY_TOKEN_AMOUNT_3],
          '0x',
          999999
        )
      ).to.be.revertedWith('Amount should be greater than 0')
    })

    it('should be able to deposit a batch of tokens to L2', async () => {
      const [preL1Balance1, preL1Balance2, preL1Balance3] =
        await L1ERC1155.balanceOfBatch(
          [env.l1Wallet.address, env.l1Wallet.address, env.l1Wallet.address],
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3]
        )
      const [preL2Balance1, preL2Balance2, preL2Balance3] =
        await L2ERC1155.balanceOfBatch(
          [env.l2Wallet.address, env.l2Wallet.address, env.l2Wallet.address],
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3]
        )
      await L1ERC1155.setApprovalForAll(L1Bridge.address, true)
      await env.waitForXDomainTransaction(
        L1Bridge.depositBatch(
          L1ERC1155.address,
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3],
          [DUMMY_TOKEN_AMOUNT_1, DUMMY_TOKEN_AMOUNT_2, DUMMY_TOKEN_AMOUNT_3],
          '0x',
          999999
        )
      )
      const [postL1Balance1, postL1Balance2, postL1Balance3] =
        await L1ERC1155.balanceOfBatch(
          [env.l1Wallet.address, env.l1Wallet.address, env.l1Wallet.address],
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3]
        )
      const [postL2Balance1, postL2Balance2, postL2Balance3] =
        await L2ERC1155.balanceOfBatch(
          [env.l2Wallet.address, env.l2Wallet.address, env.l2Wallet.address],
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3]
        )
      expect(postL1Balance1).to.deep.eq(preL1Balance1.sub(DUMMY_TOKEN_AMOUNT_1))
      expect(postL1Balance2).to.deep.eq(preL1Balance2.sub(DUMMY_TOKEN_AMOUNT_2))
      expect(postL1Balance3).to.deep.eq(preL1Balance3.sub(DUMMY_TOKEN_AMOUNT_3))
      expect(postL2Balance1).to.deep.eq(preL2Balance1.add(DUMMY_TOKEN_AMOUNT_1))
      expect(postL2Balance2).to.deep.eq(preL2Balance2.add(DUMMY_TOKEN_AMOUNT_2))
      expect(postL2Balance3).to.deep.eq(preL2Balance3.add(DUMMY_TOKEN_AMOUNT_3))
    })

    it('should withdraw a batch of tokens to another wallet from L2 to L1', async () => {
      const mintType1Tx = await L2ERC1155.mint(
        env.l2Wallet.address,
        DUMMY_TOKEN_ID_1,
        DUMMY_TOKEN_AMOUNT_3
      )
      await mintType1Tx.wait()
      const mintType2Tx = await L2ERC1155.mint(
        env.l2Wallet.address,
        DUMMY_TOKEN_ID_2,
        DUMMY_TOKEN_AMOUNT_3
      )
      await mintType2Tx.wait()
      const mintType3Tx = await L2ERC1155.mint(
        env.l2Wallet.address,
        DUMMY_TOKEN_ID_3,
        DUMMY_TOKEN_AMOUNT_3
      )
      await mintType3Tx.wait()

      const [preL1Balance1, preL1Balance2, preL1Balance3] =
        await L1ERC1155.balanceOfBatch(
          [
            env.l1Wallet_2.address,
            env.l1Wallet_2.address,
            env.l1Wallet_2.address,
          ],
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3]
        )
      const [preL2Balance1, preL2Balance2, preL2Balance3] =
        await L2ERC1155.balanceOfBatch(
          [env.l2Wallet.address, env.l2Wallet.address, env.l2Wallet.address],
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3]
        )

      const approveTX = await L2ERC1155.setApprovalForAll(
        L2Bridge.address,
        true
      )
      await approveTX.wait()

      // Approve BOBA
      const exitFee = await BOBABillingContract.exitFee()
      const approveBOBATX = await L2BOBAToken.approve(L2Bridge.address, exitFee)
      await approveBOBATX.wait()

      await env.waitForXDomainTransaction(
        L2Bridge.withdrawBatchTo(
          L2ERC1155.address,
          env.l1Wallet_2.address,
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3],
          [DUMMY_TOKEN_AMOUNT_1, DUMMY_TOKEN_AMOUNT_2, DUMMY_TOKEN_AMOUNT_3],
          '0x',
          999999
        )
      )

      const [postL1Balance1, postL1Balance2, postL1Balance3] =
        await L1ERC1155.balanceOfBatch(
          [
            env.l1Wallet_2.address,
            env.l1Wallet_2.address,
            env.l1Wallet_2.address,
          ],
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3]
        )
      const [postL2Balance1, postL2Balance2, postL2Balance3] =
        await L2ERC1155.balanceOfBatch(
          [env.l2Wallet.address, env.l2Wallet.address, env.l2Wallet.address],
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3]
        )
      expect(postL2Balance1).to.deep.eq(preL2Balance1.sub(DUMMY_TOKEN_AMOUNT_1))
      expect(postL2Balance2).to.deep.eq(preL2Balance2.sub(DUMMY_TOKEN_AMOUNT_2))
      expect(postL2Balance3).to.deep.eq(preL2Balance3.sub(DUMMY_TOKEN_AMOUNT_3))
      expect(postL1Balance1).to.deep.eq(preL1Balance1.add(DUMMY_TOKEN_AMOUNT_1))
      expect(postL1Balance2).to.deep.eq(preL1Balance2.add(DUMMY_TOKEN_AMOUNT_2))
      expect(postL1Balance3).to.deep.eq(preL1Balance3.add(DUMMY_TOKEN_AMOUNT_3))
    })

    it('should be able to deposit a batch of tokens to another wallet on L2', async () => {
      const [preL1Balance1, preL1Balance2, preL1Balance3] =
        await L1ERC1155.balanceOfBatch(
          [
            env.l1Wallet_2.address,
            env.l1Wallet_2.address,
            env.l1Wallet_2.address,
          ],
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3]
        )
      const [preL2Balance1, preL2Balance2, preL2Balance3] =
        await L2ERC1155.balanceOfBatch(
          [env.l2Wallet.address, env.l2Wallet.address, env.l2Wallet.address],
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3]
        )
      await L1ERC1155.connect(env.l1Wallet_2).setApprovalForAll(
        L1Bridge.address,
        true
      )
      await env.waitForXDomainTransaction(
        L1Bridge.connect(env.l1Wallet_2).depositBatchTo(
          L1ERC1155.address,
          env.l2Wallet.address,
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3],
          [DUMMY_TOKEN_AMOUNT_1, DUMMY_TOKEN_AMOUNT_2, DUMMY_TOKEN_AMOUNT_3],
          '0x',
          999999
        )
      )
      const [postL1Balance1, postL1Balance2, postL1Balance3] =
        await L1ERC1155.balanceOfBatch(
          [
            env.l1Wallet_2.address,
            env.l1Wallet_2.address,
            env.l1Wallet_2.address,
          ],
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3]
        )
      const [postL2Balance1, postL2Balance2, postL2Balance3] =
        await L2ERC1155.balanceOfBatch(
          [env.l2Wallet.address, env.l2Wallet.address, env.l2Wallet.address],
          [DUMMY_TOKEN_ID_1, DUMMY_TOKEN_ID_2, DUMMY_TOKEN_ID_3]
        )
      expect(postL2Balance1).to.deep.eq(preL2Balance1.add(DUMMY_TOKEN_AMOUNT_1))
      expect(postL2Balance2).to.deep.eq(preL2Balance2.add(DUMMY_TOKEN_AMOUNT_2))
      expect(postL2Balance3).to.deep.eq(preL2Balance3.add(DUMMY_TOKEN_AMOUNT_3))
      expect(postL1Balance1).to.deep.eq(preL1Balance1.sub(DUMMY_TOKEN_AMOUNT_1))
      expect(postL1Balance2).to.deep.eq(preL1Balance2.sub(DUMMY_TOKEN_AMOUNT_2))
      expect(postL1Balance3).to.deep.eq(preL1Balance3.sub(DUMMY_TOKEN_AMOUNT_3))
    })
  })

  describe('L1 native token - failing mint on L2', async () => {
    before(async () => {
      Factory__L1ERC1155 = new ContractFactory(
        ERC1155Json.abi,
        ERC1155Json.bytecode,
        env.l1Wallet
      )

      Factory__L2ERC1155 = new ContractFactory(
        L2ERC1155FailingMintJson.abi,
        L2ERC1155FailingMintJson.bytecode,
        env.l2Wallet
      )

      // deploy a L1 native token token each time if existing contracts are used for tests
      L1ERC1155 = await Factory__L1ERC1155.deploy('uri')
      await L1ERC1155.deployTransaction.wait()

      L2ERC1155 = await Factory__L2ERC1155.deploy(
        L2Bridge.address,
        L1ERC1155.address,
        'uri'
      )
      await L2ERC1155.deployTransaction.wait()

      // register token
      const registerL1BridgeTx = await L1Bridge.registerPair(
        L1ERC1155.address,
        L2ERC1155.address,
        'L1'
      )
      await registerL1BridgeTx.wait()

      const registerL2BridgeTx = await L2Bridge.registerPair(
        L1ERC1155.address,
        L2ERC1155.address,
        'L1'
      )
      await registerL2BridgeTx.wait()
    })

    it('should try deposit token to L2', async () => {
      // mint token on L1
      const mintTx = await L1ERC1155.mint(
        env.l1Wallet.address,
        DUMMY_TOKEN_ID_1,
        DUMMY_TOKEN_AMOUNT_1
      )
      await mintTx.wait()

      const approveTx = await L1ERC1155.setApprovalForAll(
        L1Bridge.address,
        true
      )
      await approveTx.wait()

      const depositTx = await env.waitForXDomainTransaction(
        await L1Bridge.deposit(
          L1ERC1155.address,
          DUMMY_TOKEN_ID_1,
          DUMMY_TOKEN_AMOUNT_1,
          '0x',
          999999
        )
      )

      // submit a random l2 tx, so the relayer is unstuck for the tests
      await env.l2Wallet_2.sendTransaction({
        to: env.l2Wallet_2.address,
        value: utils.parseEther('0.01'),
        gasLimit: 1000000,
      })

      const backTx = await env.messenger.l2Provider.getTransaction(
        depositTx.remoteReceipt.transactionHash
      )
      await env.waitForXDomainTransaction(backTx)

      // check event DepositFailed is emittted
      const returnedlogIndex = await getFilteredLogIndex(
        depositTx.remoteReceipt,
        L2ERC1155BridgeJson.abi,
        L2Bridge.address,
        'DepositFailed'
      )
      const ifaceL2Bridge = new ethers.utils.Interface(L2ERC1155BridgeJson.abi)
      const log = ifaceL2Bridge.parseLog(
        depositTx.remoteReceipt.logs[returnedlogIndex]
      )
      expect(log.args._tokenId).to.deep.eq(DUMMY_TOKEN_ID_1)

      const balanceL1 = await L1ERC1155.balanceOf(
        env.l1Wallet.address,
        DUMMY_TOKEN_ID_1
      )
      const balanceL2 = await L2ERC1155.balanceOf(
        env.l2Wallet.address,
        DUMMY_TOKEN_ID_1
      )
      expect(balanceL1).to.deep.eq(DUMMY_TOKEN_AMOUNT_1)
      expect(balanceL2).to.deep.eq(0)
    }).timeout(100000)
  })

  describe('L2 native token - failing mint on L1', async () => {
    before(async () => {
      Factory__L1ERC1155 = new ContractFactory(
        L1ERC1155FailingMintJson.abi,
        L1ERC1155FailingMintJson.bytecode,
        env.l1Wallet
      )

      Factory__L2ERC1155 = new ContractFactory(
        ERC1155Json.abi,
        ERC1155Json.bytecode,
        env.l2Wallet
      )

      // deploy a L2 native token token each time if existing contracts are used for tests
      L2ERC1155 = await Factory__L2ERC1155.deploy('uri')
      await L2ERC1155.deployTransaction.wait()

      L1ERC1155 = await Factory__L1ERC1155.deploy(
        L1Bridge.address,
        L2ERC1155.address,
        'uri'
      )
      await L1ERC1155.deployTransaction.wait()

      // register token
      const registerL1BridgeTx = await L1Bridge.registerPair(
        L1ERC1155.address,
        L2ERC1155.address,
        'L2'
      )
      await registerL1BridgeTx.wait()

      const registerL2BridgeTx = await L2Bridge.registerPair(
        L1ERC1155.address,
        L2ERC1155.address,
        'L2'
      )
      await registerL2BridgeTx.wait()
    })

    it('should try withdraw token to L1', async () => {
      // mint token on L1
      const mintTx = await L2ERC1155.mint(
        env.l2Wallet.address,
        DUMMY_TOKEN_ID_1,
        DUMMY_TOKEN_AMOUNT_1
      )
      await mintTx.wait()

      const approveTx = await L2ERC1155.setApprovalForAll(
        L2Bridge.address,
        true
      )
      await approveTx.wait()

      // Approve BOBA
      const exitFee = await BOBABillingContract.exitFee()
      const approveBOBATX = await L2BOBAToken.approve(L2Bridge.address, exitFee)
      await approveBOBATX.wait()

      await env.waitForRevertXDomainTransactionL1(
        L2Bridge.withdraw(
          L2ERC1155.address,
          DUMMY_TOKEN_ID_1,
          DUMMY_TOKEN_AMOUNT_1,
          '0x',
          9999999
        )
      )

      const balanceL1 = await L1ERC1155.balanceOf(
        env.l1Wallet.address,
        DUMMY_TOKEN_ID_1
      )
      const balanceL2 = await L2ERC1155.balanceOf(
        env.l2Wallet.address,
        DUMMY_TOKEN_ID_1
      )
      expect(balanceL1).to.deep.eq(0)
      expect(balanceL2).to.deep.eq(DUMMY_TOKEN_AMOUNT_1)
    }).timeout(100000)
  })

  describe('Bridges pause tests', async () => {
    before(async () => {
      Factory__L1ERC1155 = new ContractFactory(
        ERC1155Json.abi,
        ERC1155Json.bytecode,
        env.l1Wallet
      )

      Factory__L2ERC1155 = new ContractFactory(
        L2StandardERC1155Json.abi,
        L2StandardERC1155Json.bytecode,
        env.l2Wallet
      )

      // deploy a L1 native token token each time if existing contracts are used for tests
      L1ERC1155 = await Factory__L1ERC1155.deploy('uri')

      await L1ERC1155.deployTransaction.wait()

      L2ERC1155 = await Factory__L2ERC1155.deploy(
        L2Bridge.address,
        L1ERC1155.address,
        'uri'
      )

      await L2ERC1155.deployTransaction.wait()

      // register token
      const registerL1BridgeTx = await L1Bridge.registerPair(
        L1ERC1155.address,
        L2ERC1155.address,
        'L1'
      )
      await registerL1BridgeTx.wait()

      const registerL2BridgeTx = await L2Bridge.registerPair(
        L1ERC1155.address,
        L2ERC1155.address,
        'L1'
      )
      await registerL2BridgeTx.wait()
    })

    it('should pause and unpause L1 bridge', async () => {
      const mintTx = await L1ERC1155.mint(
        env.l1Wallet.address,
        DUMMY_TOKEN_ID_1,
        DUMMY_TOKEN_AMOUNT_1
      )
      await mintTx.wait()
      const approveTx = await L1ERC1155.setApprovalForAll(
        L1Bridge.address,
        true
      )
      await approveTx.wait()

      const pauseL1Tx = await L1Bridge.pause()
      await pauseL1Tx.wait()

      await expect(
        L1Bridge.deposit(
          L1ERC1155.address,
          DUMMY_TOKEN_ID_1,
          DUMMY_TOKEN_AMOUNT_1,
          '0x',
          9999999
        )
      ).to.be.revertedWith('Pausable: paused')

      await expect(
        L1Bridge.depositTo(
          L1ERC1155.address,
          env.l1Wallet_2.address,
          DUMMY_TOKEN_ID_1,
          DUMMY_TOKEN_AMOUNT_1,
          '0x',
          9999999
        )
      ).to.be.revertedWith('Pausable: paused')

      const unpauseL1Tx = await L1Bridge.unpause()
      await unpauseL1Tx.wait()

      await env.waitForXDomainTransaction(
        L1Bridge.deposit(
          L1ERC1155.address,
          DUMMY_TOKEN_ID_1,
          DUMMY_TOKEN_AMOUNT_1,
          '0x',
          9999999
        )
      )

      const balanceL1 = await L1ERC1155.balanceOf(
        env.l1Wallet.address,
        DUMMY_TOKEN_ID_1
      )
      const balanceL2 = await L2ERC1155.balanceOf(
        env.l2Wallet.address,
        DUMMY_TOKEN_ID_1
      )

      expect(balanceL1).to.deep.eq(0)
      expect(balanceL2).to.deep.eq(DUMMY_TOKEN_AMOUNT_1)
    })

    it('should pause and unpause L2 bridge', async () => {
      const approveTx = await L2ERC1155.setApprovalForAll(
        L2Bridge.address,
        true
      )
      await approveTx.wait()

      const pauseL2Tx = await L2Bridge.pause()
      await pauseL2Tx.wait()

      await expect(
        L2Bridge.withdraw(
          L2ERC1155.address,
          DUMMY_TOKEN_ID_1,
          DUMMY_TOKEN_AMOUNT_1,
          '0x',
          9999999
        )
      ).to.be.revertedWith('Pausable: paused')

      await expect(
        L2Bridge.withdrawTo(
          L2ERC1155.address,
          env.l1Wallet_2.address,
          DUMMY_TOKEN_ID_1,
          DUMMY_TOKEN_AMOUNT_1,
          '0x',
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
        L2Bridge.withdraw(
          L2ERC1155.address,
          DUMMY_TOKEN_ID_1,
          DUMMY_TOKEN_AMOUNT_1,
          '0x',
          9999999
        )
      )

      const balanceL1 = await L1ERC1155.balanceOf(
        env.l1Wallet.address,
        DUMMY_TOKEN_ID_1
      )
      const balanceL2 = await L2ERC1155.balanceOf(
        env.l2Wallet.address,
        DUMMY_TOKEN_ID_1
      )
      expect(balanceL1).to.be.eq(DUMMY_TOKEN_AMOUNT_1)
      expect(balanceL2).to.be.eq(0)
    })

    it('should not allow to pause bridges for non-owner', async () => {
      await expect(L1Bridge.connect(env.l1Wallet_2).pause()).to.be.revertedWith(
        'Caller is not the owner'
      )
      await expect(L2Bridge.connect(env.l2Wallet_2).pause()).to.be.revertedWith(
        'Caller is not the owner'
      )
    })

    it('should not allow to unpause bridges for non-owner', async () => {
      await expect(
        L1Bridge.connect(env.l1Wallet_2).unpause()
      ).to.be.revertedWith('Caller is not the owner')
      await expect(
        L2Bridge.connect(env.l2Wallet_2).unpause()
      ).to.be.revertedWith('Caller is not the owner')
    })
  })

  describe('Configuration tests', async () => {
    it('should not allow to configure billing contract address for non-owner', async () => {
      await expect(
        L2Bridge.connect(env.l2Wallet_2).configureBillingContractAddress(
          env.addressesBOBA.Proxy__BobaBillingContract
        )
      ).to.be.revertedWith('Caller is not the owner')
    })

    it('should not allow to configure billing contract address to zero address', async () => {
      await expect(
        L2Bridge.connect(env.l2Wallet).configureBillingContractAddress(
          ethers.constants.AddressZero
        )
      ).to.be.revertedWith('Billing contract address cannot be zero')
    })
  })
})
