import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
import { Contract, ContractFactory, utils, BigNumber } from 'ethers'

import L1NFTBridge from '@boba/contracts/artifacts/contracts/bridges/L1NFTBridge.sol/L1NFTBridge.json'
import L2NFTBridge from '@boba/contracts/artifacts/contracts/bridges/L2NFTBridge.sol/L2NFTBridge.json'
import L1ERC721Json from '@boba/contracts/artifacts/contracts/standards/L1StandardERC721.sol/L1StandardERC721.json'
import L2ERC721Json from '@boba/contracts/artifacts/contracts/standards/L2StandardERC721.sol/L2StandardERC721.json'
import ERC721Json from '@boba/contracts/artifacts/contracts/test-helpers/L1ERC721.sol/L1ERC721.json'

import { OptimismEnv } from './shared/env'

describe('NFT Bridge Test', async () => {
  let Factory__L1ERC721: ContractFactory
  let Factory__L2ERC721: ContractFactory
  let L1Bridge: Contract
  let L2Bridge: Contract
  let L1ERC721: Contract
  let L2ERC721: Contract

  let env: OptimismEnv

  const DUMMY_TOKEN_ID = 1234

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
        L1Bridge.depositNFT(
          L1ERC721.address,
          DUMMY_TOKEN_ID,
          9999999,
          utils.formatBytes32String(new Date().getTime().toString())
        )
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
          9999999,
          utils.formatBytes32String(new Date().getTime().toString())
        )
      ).to.be.reverted
    })

    it('{tag:boba} should withdraw NFT', async () => {
      const approveTX = await L2ERC721.connect(env.l2Wallet_2).approve(
        L2Bridge.address,
        DUMMY_TOKEN_ID
      )
      await approveTX.wait()
      await env.waitForXDomainTransaction(
        L2Bridge.connect(env.l2Wallet_2).withdraw(
          L2ERC721.address,
          DUMMY_TOKEN_ID,
          9999999,
          utils.formatBytes32String(new Date().getTime().toString())
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
          9999999,
          utils.formatBytes32String(new Date().getTime().toString())
        )
      )

      const ownerL1 = await L1ERC721.ownerOf(DUMMY_TOKEN_ID)
      const ownerL2 = await L2ERC721.ownerOf(DUMMY_TOKEN_ID)

      expect(ownerL1).to.deep.eq(L1Bridge.address)
      expect(ownerL2).to.deep.eq(env.l2Wallet.address)
    })

    it('{tag:boba} should withdraw NFT to another L1 wallet', async () => {
      const approveTX = await L2ERC721.connect(env.l2Wallet).approve(
        L2Bridge.address,
        DUMMY_TOKEN_ID
      )
      await approveTX.wait()
      await env.waitForXDomainTransaction(
        L2Bridge.connect(env.l2Wallet).withdrawTo(
          L2ERC721.address,
          env.l2Wallet_2.address,
          DUMMY_TOKEN_ID,
          9999999,
          utils.formatBytes32String(new Date().getTime().toString())
        )
      )

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
        L1Bridge.depositNFT(
          L1ERC721Test.address,
          DUMMY_TOKEN_ID,
          9999999,
          utils.formatBytes32String(new Date().getTime().toString())
        )
      ).to.be.revertedWith("Can't Find L2 NFT Contract")
      await expect(
        L1Bridge.depositNFTTo(
          L1ERC721Test.address,
          env.l2Wallet_2.address,
          DUMMY_TOKEN_ID,
          9999999,
          utils.formatBytes32String(new Date().getTime().toString())
        )
      ).to.be.revertedWith("Can't Find L2 NFT Contract")
    })

    it('{tag:boba} should not be able to mint NFT on L2', async () => {
      await expect(
        L2ERC721.mint(env.l2Wallet.address, DUMMY_TOKEN_ID + 1)
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

    it('{tag:boba} should exit NFT from L2', async () => {
      // mint nft
      const mintTx = await L2ERC721.mint(env.l2Wallet.address, DUMMY_TOKEN_ID)
      await mintTx.wait()

      const approveTx = await L2ERC721.approve(L2Bridge.address, DUMMY_TOKEN_ID)
      await approveTx.wait()

      await env.waitForXDomainTransaction(
        L2Bridge.withdraw(
          L2ERC721.address,
          DUMMY_TOKEN_ID,
          9999999,
          utils.formatBytes32String(new Date().getTime().toString())
        )
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
          9999999,
          utils.formatBytes32String(new Date().getTime().toString())
        )
      ).to.be.reverted
    })

    it('{tag:boba} should deposit NFT to L2', async () => {
      const approveTx = await L1ERC721.approve(L1Bridge.address, DUMMY_TOKEN_ID)
      await approveTx.wait()

      await env.waitForXDomainTransaction(
        L1Bridge.depositNFT(
          L1ERC721.address,
          DUMMY_TOKEN_ID,
          9999999,
          utils.formatBytes32String(new Date().getTime().toString())
        )
      )

      await expect(L1ERC721.ownerOf(DUMMY_TOKEN_ID)).to.be.revertedWith(
        'ERC721: owner query for nonexistent token'
      )

      const ownerL2 = await L2ERC721.ownerOf(DUMMY_TOKEN_ID)
      expect(ownerL2).to.deep.eq(env.l2Wallet.address)
    })

    it('{tag:boba} should exit NFT to another L1 wallet', async () => {
      const approveTx = await L2ERC721.approve(L2Bridge.address, DUMMY_TOKEN_ID)
      await approveTx.wait()

      await env.waitForXDomainTransaction(
        L2Bridge.withdrawTo(
          L2ERC721.address,
          env.l2Wallet_2.address,
          DUMMY_TOKEN_ID,
          9999999,
          utils.formatBytes32String(new Date().getTime().toString())
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

      await env.waitForXDomainTransaction(
        L1Bridge.connect(env.l1Wallet_2).depositNFTTo(
          L1ERC721.address,
          env.l2Wallet.address,
          DUMMY_TOKEN_ID,
          9999999,
          utils.formatBytes32String(new Date().getTime().toString())
        )
      )

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

      await expect(
        L2Bridge.withdraw(
          L2ERC721Test.address,
          DUMMY_TOKEN_ID,
          9999999,
          utils.formatBytes32String(new Date().getTime().toString())
        )
      ).to.be.revertedWith("Can't Find L1 NFT Contract")
      await expect(
        L2Bridge.withdrawTo(
          L2ERC721Test.address,
          env.l2Wallet_2.address,
          DUMMY_TOKEN_ID,
          9999999,
          utils.formatBytes32String(new Date().getTime().toString())
        )
      ).to.be.revertedWith("Can't Find L1 NFT Contract")
    })

    it('{tag:boba} should not be able to mint NFT on L1', async () => {
      await expect(
        L1ERC721.mint(env.l1Wallet.address, DUMMY_TOKEN_ID + 1)
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
        L1Bridge.depositNFT(
          L1ERC721.address,
          DUMMY_TOKEN_ID,
          9999999,
          utils.formatBytes32String(new Date().getTime().toString())
        )
      )
    })

    it('{tag:boba} should withdraw NFT when approved for all', async () => {
      const approveTX = await L2ERC721.setApprovalForAll(
        env.l2Wallet_2.address,
        true
      )
      await approveTX.wait()
      await env.waitForXDomainTransaction(
        L2Bridge.connect(env.l2Wallet_2).withdraw(
          L2ERC721.address,
          DUMMY_TOKEN_ID,
          9999999,
          utils.formatBytes32String(new Date().getTime().toString())
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

      await env.waitForXDomainTransaction(
        L2Bridge.withdraw(
          L2ERC721.address,
          DUMMY_TOKEN_ID,
          9999999,
          utils.formatBytes32String(new Date().getTime().toString())
        )
      )
    })

    it('{tag:boba} should deposit NFT to L2 when approved for all', async () => {
      await L1ERC721.setApprovalForAll(env.l1Wallet_2.address, true)
      await env.waitForXDomainTransaction(
        L1Bridge.connect(env.l1Wallet_2).depositNFT(
          L1ERC721.address,
          DUMMY_TOKEN_ID,
          9999999,
          utils.formatBytes32String(new Date().getTime().toString())
        )
      )

      await expect(L1ERC721.ownerOf(DUMMY_TOKEN_ID)).to.be.revertedWith(
        'ERC721: owner query for nonexistent token'
      )

      const ownerL2 = await L2ERC721.ownerOf(DUMMY_TOKEN_ID)
      expect(ownerL2).to.deep.eq(env.l2Wallet_2.address)
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
        L1Bridge.depositNFT(
          L1ERC721.address,
          DUMMY_TOKEN_ID,
          9999999,
          utils.formatBytes32String(new Date().getTime().toString())
        )
      ).to.be.revertedWith('Pausable: paused')

      await expect(
        L1Bridge.depositNFTTo(
          L1ERC721.address,
          env.l1Wallet_2.address,
          DUMMY_TOKEN_ID,
          9999999,
          utils.formatBytes32String(new Date().getTime().toString())
        )
      ).to.be.revertedWith('Pausable: paused')

      const unpauseL1Tx = await L1Bridge.unpause()
      await unpauseL1Tx.wait()

      await env.waitForXDomainTransaction(
        L1Bridge.depositNFT(
          L1ERC721.address,
          DUMMY_TOKEN_ID,
          9999999,
          utils.formatBytes32String(new Date().getTime().toString())
        )
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
        L2Bridge.withdraw(
          L2ERC721.address,
          DUMMY_TOKEN_ID,
          9999999,
          utils.formatBytes32String(new Date().getTime().toString())
        )
      ).to.be.revertedWith('Pausable: paused')

      await expect(
        L2Bridge.withdrawTo(
          L2ERC721.address,
          env.l1Wallet_2.address,
          DUMMY_TOKEN_ID,
          9999999,
          utils.formatBytes32String(new Date().getTime().toString())
        )
      ).to.be.revertedWith('Pausable: paused')

      const unpauseL2Tx = await L2Bridge.unpause()
      await unpauseL2Tx.wait()

      await env.waitForXDomainTransaction(
        L2Bridge.withdraw(
          L2ERC721.address,
          DUMMY_TOKEN_ID,
          9999999,
          utils.formatBytes32String(new Date().getTime().toString())
        )
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

  describe('Relay gas burn tests', async () => {
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

    it('{tag:boba} should not allow updating extraGasRelay for non-owner', async () => {
      const newExtraGasRelay = 500000
      await expect(
        L2Bridge.connect(env.l2Wallet_2).configureExtraGasRelay(
          newExtraGasRelay
        )
      ).to.be.revertedWith('Caller is not the gasPriceOracle owner')
    })

    it('{tag:boba} should allow updating extraGasRelay for owner', async () => {
      const mintTx = await L2ERC721.mint(env.l2Wallet.address, DUMMY_TOKEN_ID)
      await mintTx.wait()
      const approveTx = await L2ERC721.approve(L2Bridge.address, DUMMY_TOKEN_ID)
      await approveTx.wait()

      const estimatedGas = await L2Bridge.estimateGas.withdraw(
        L2ERC721.address,
        DUMMY_TOKEN_ID,
        9999999,
        utils.formatBytes32String(new Date().getTime().toString())
      )

      const newExtraGasRelay = estimatedGas.mul(2)
      const configureTx = await L2Bridge.connect(
        env.l2Wallet_4
      ).configureExtraGasRelay(newExtraGasRelay)
      await configureTx.wait()

      const updatedExtraGasRelay = await L2Bridge.extraGasRelay()
      expect(updatedExtraGasRelay).to.eq(newExtraGasRelay)
    })

    it('{tag:boba} should be able to exit with the correct added gas', async () => {
      const extraGas = 1000000

      const resetGasTx = await L2Bridge.connect(
        env.l2Wallet_4
      ).configureExtraGasRelay(0)
      await resetGasTx.wait()

      const preGas = await L2Bridge.estimateGas.withdraw(
        L2ERC721.address,
        DUMMY_TOKEN_ID,
        9999999,
        utils.formatBytes32String(new Date().getTime().toString())
      )

      const addGasTx = await L2Bridge.connect(
        env.l2Wallet_4
      ).configureExtraGasRelay(extraGas)
      await addGasTx.wait()

      const afterGas = await L2Bridge.estimateGas.withdraw(
        L2ERC721.address,
        DUMMY_TOKEN_ID,
        9999999,
        utils.formatBytes32String(new Date().getTime().toString())
      )

      expect(afterGas).to.be.gt(preGas.add(BigNumber.from(extraGas)))
    })
  })
})
