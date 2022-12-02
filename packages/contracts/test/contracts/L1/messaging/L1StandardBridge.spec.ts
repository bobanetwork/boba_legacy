import { expect } from '../../../setup'

/* External Imports */
import { ethers } from 'hardhat'
import { Signer, Contract, constants } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import { smock, FakeContract, MockContract } from '@defi-wonderland/smock'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
/* Internal Imports */
import { NON_NULL_BYTES32, NON_ZERO_ADDRESS } from '../../../helpers'
import { getContractInterface, predeploys } from '../../../../src'

const ERR_INVALID_MESSENGER = 'OVM_XCHAIN: messenger contract unauthenticated'
const ERR_INVALID_X_DOMAIN_MSG_SENDER =
  'OVM_XCHAIN: wrong sender of cross-domain message'
const ERR_ALREADY_INITIALIZED = 'Contract has already been initialized.'
const DUMMY_L2_ERC20_ADDRESS = ethers.utils.getAddress('0x' + 'abba'.repeat(10))
const DUMMY_L2_BRIDGE_ADDRESS = ethers.utils.getAddress(
  '0x' + 'acdc'.repeat(10)
)

const INITIAL_TOTAL_L1_SUPPLY = 5000
const FINALIZATION_GAS = 1_200_000

describe('L1StandardBridge', () => {
  // init signers
  let l1MessengerImpersonator: Signer
  let alice: SignerWithAddress
  let bob: SignerWithAddress
  let bobsAddress
  let aliceAddress

  // we can just make up this string since it's on the "other" Layer
  let Mock__OVM_ETH: FakeContract
  //let Factory__L1ERC20: ContractFactory
  let IL2ERC20Bridge: Interface
  before(async () => {
    ;[l1MessengerImpersonator, alice, bob] = await ethers.getSigners()

    Mock__OVM_ETH = await smock.fake<Contract>(
      await ethers.getContractFactory('OVM_ETH')
    )

    // // deploy an ERC20 contract on L1
    // Factory__L1ERC20 = await (
    //   await smock.mock(
    //   '@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20'
    // )

    // get an L2ER20Bridge Interface
    IL2ERC20Bridge = getContractInterface('IL2ERC20Bridge')

    aliceAddress = await alice.getAddress()
    bobsAddress = await bob.getAddress()
  })

  let L1ERC20: MockContract<Contract>
  let L1StandardBridge: Contract
  let Mock__L1CrossDomainMessenger: FakeContract
  beforeEach(async () => {
    // Get a new mock L1 messenger
    Mock__L1CrossDomainMessenger = await smock.fake<Contract>(
      'L1CrossDomainMessenger',
      { address: await l1MessengerImpersonator.getAddress() } // This allows us to use an ethers override {from: Mock__L2CrossDomainMessenger.address} to mock calls
    )

    // Deploy the contract under test
    L1StandardBridge = await (
      await ethers.getContractFactory('L1StandardBridge')
    ).deploy()
    await L1StandardBridge.initialize(
      Mock__L1CrossDomainMessenger.address,
      DUMMY_L2_BRIDGE_ADDRESS
    )

    L1ERC20 = await (
      await smock.mock('@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20')
    ).deploy('L1ERC20', 'ERC')
    await L1ERC20.setVariable('_totalSupply', INITIAL_TOTAL_L1_SUPPLY)
    await L1ERC20.setVariable('_balances', {
      [alice.address]: INITIAL_TOTAL_L1_SUPPLY,
    })
  })

  describe('initialize', () => {
    it('Should only be callable once', async () => {
      await expect(
        L1StandardBridge.initialize(
          ethers.constants.AddressZero,
          DUMMY_L2_BRIDGE_ADDRESS
        )
      ).to.be.revertedWith(ERR_ALREADY_INITIALIZED)
    })
  })

  describe('ETH deposits', () => {
    const depositAmount = 1_000

    it('depositETH() escrows the deposit amount and sends the correct deposit message', async () => {
      const initialBalance = await alice.getBalance()

      // alice calls deposit on the bridge and the L1 bridge calls transferFrom on the token
      const res = await L1StandardBridge.connect(alice).depositETH(
        FINALIZATION_GAS,
        NON_NULL_BYTES32,
        {
          value: depositAmount,
        }
      )

      expect(
        Mock__L1CrossDomainMessenger.sendMessage.getCall(0).args
      ).to.deep.equal([
        DUMMY_L2_BRIDGE_ADDRESS,
        getContractInterface('IL2ERC20Bridge').encodeFunctionData(
          'finalizeDeposit',
          [
            constants.AddressZero,
            predeploys.OVM_ETH,
            alice.address,
            alice.address,
            depositAmount,
            NON_NULL_BYTES32,
          ]
        ),
        FINALIZATION_GAS,
      ])

      const receipt = await res.wait()
      const depositerFeePaid = receipt.cumulativeGasUsed.mul(
        receipt.effectiveGasPrice
      )

      expect(await alice.getBalance()).to.equal(
        initialBalance.sub(depositAmount).sub(depositerFeePaid)
      )

      expect(
        await ethers.provider.getBalance(L1StandardBridge.address)
      ).to.equal(depositAmount)
    })

    it('depositETHTo() escrows the deposit amount and sends the correct deposit message', async () => {
      const initialBalance = await alice.getBalance()

      const res = await L1StandardBridge.connect(alice).depositETHTo(
        bob.address,
        FINALIZATION_GAS,
        NON_NULL_BYTES32,
        {
          value: depositAmount,
        }
      )

      expect(
        Mock__L1CrossDomainMessenger.sendMessage.getCall(0).args
      ).to.deep.equal([
        DUMMY_L2_BRIDGE_ADDRESS,
        getContractInterface('IL2ERC20Bridge').encodeFunctionData(
          'finalizeDeposit',
          [
            constants.AddressZero,
            predeploys.OVM_ETH,
            alice.address,
            bob.address,
            depositAmount,
            NON_NULL_BYTES32,
          ]
        ),
        FINALIZATION_GAS,
      ])

      const receipt = await res.wait()
      const depositerFeePaid = receipt.cumulativeGasUsed.mul(
        receipt.effectiveGasPrice
      )

      expect(await alice.getBalance()).to.equal(
        initialBalance.sub(depositAmount).sub(depositerFeePaid)
      )

      expect(
        await ethers.provider.getBalance(L1StandardBridge.address)
      ).to.equal(depositAmount)
    })

    it('cannot depositETH from a contract account', async () => {
      expect(
        L1StandardBridge.depositETH(FINALIZATION_GAS, NON_NULL_BYTES32, {
          value: depositAmount,
          gasPrice: 0,
        })
      ).to.be.revertedWith('Account not EOA')
    })
  })

  describe('ETH withdrawals', () => {
    it('onlyFromCrossDomainAccount: should revert on calls from a non-crossDomainMessenger L1 account', async () => {
      // Deploy new bridge, initialize with random messenger
      await expect(
        L1StandardBridge.connect(alice).finalizeETHWithdrawal(
          constants.AddressZero,
          constants.AddressZero,
          1,
          NON_NULL_BYTES32,
          {
            from: aliceAddress,
          }
        )
      ).to.be.revertedWith(ERR_INVALID_MESSENGER)
    })

    it('onlyFromCrossDomainAccount: should revert on calls from the right crossDomainMessenger, but wrong xDomainMessageSender (ie. not the L2ETHToken)', async () => {
      L1StandardBridge = await (
        await ethers.getContractFactory('L1StandardBridge')
      ).deploy()
      await L1StandardBridge.initialize(
        Mock__L1CrossDomainMessenger.address,
        DUMMY_L2_BRIDGE_ADDRESS
      )

      Mock__L1CrossDomainMessenger.xDomainMessageSender.returns(
        '0x' + '22'.repeat(20)
      )

      await expect(
        L1StandardBridge.finalizeETHWithdrawal(
          constants.AddressZero,
          constants.AddressZero,
          1,
          NON_NULL_BYTES32,
          {
            from: Mock__L1CrossDomainMessenger.address,
          }
        )
      ).to.be.revertedWith(ERR_INVALID_X_DOMAIN_MSG_SENDER)
    })

    it('should credit funds to the withdrawer and not use too much gas', async () => {
      // make sure no balance at start of test
      expect(await ethers.provider.getBalance(NON_ZERO_ADDRESS)).to.be.equal(0)

      const withdrawalAmount = 100
      Mock__L1CrossDomainMessenger.xDomainMessageSender.returns(
        () => DUMMY_L2_BRIDGE_ADDRESS
      )

      // thanks Alice
      await L1StandardBridge.connect(alice).depositETH(
        FINALIZATION_GAS,
        NON_NULL_BYTES32,
        {
          value: ethers.utils.parseEther('1.0'),
          gasPrice: 0,
        }
      )

      await L1StandardBridge.finalizeETHWithdrawal(
        NON_ZERO_ADDRESS,
        NON_ZERO_ADDRESS,
        withdrawalAmount,
        NON_NULL_BYTES32,
        {
          from: Mock__L1CrossDomainMessenger.address,
        }
      )

      expect(await ethers.provider.getBalance(NON_ZERO_ADDRESS)).to.be.equal(
        withdrawalAmount
      )
    })
  })

  describe('ERC20 deposits', () => {
    const depositAmount = 1_000

    beforeEach(async () => {
      await L1ERC20.connect(alice).approve(
        L1StandardBridge.address,
        depositAmount
      )
    })

    it('depositERC20() escrows the deposit amount and sends the correct deposit message', async () => {
      // alice calls deposit on the bridge and the L1 bridge calls transferFrom on the token
      await L1StandardBridge.connect(alice).depositERC20(
        L1ERC20.address,
        DUMMY_L2_ERC20_ADDRESS,
        depositAmount,
        FINALIZATION_GAS,
        NON_NULL_BYTES32
      )

      expect(
        Mock__L1CrossDomainMessenger.sendMessage.getCall(0).args
      ).to.deep.equal([
        DUMMY_L2_BRIDGE_ADDRESS,
        getContractInterface('IL2ERC20Bridge').encodeFunctionData(
          'finalizeDeposit',
          [
            L1ERC20.address,
            DUMMY_L2_ERC20_ADDRESS,
            alice.address,
            alice.address,
            depositAmount,
            NON_NULL_BYTES32,
          ]
        ),
        FINALIZATION_GAS,
      ])

      expect(await L1ERC20.balanceOf(alice.address)).to.equal(
        INITIAL_TOTAL_L1_SUPPLY - depositAmount
      )

      expect(await L1ERC20.balanceOf(L1StandardBridge.address)).to.equal(
        depositAmount
      )
    })

    it('depositERC20To() escrows the deposit amount and sends the correct deposit message', async () => {
      // depositor calls deposit on the bridge and the L1 bridge calls transferFrom on the token
      await L1StandardBridge.connect(alice).depositERC20To(
        L1ERC20.address,
        DUMMY_L2_ERC20_ADDRESS,
        bobsAddress,
        depositAmount,
        FINALIZATION_GAS,
        NON_NULL_BYTES32
      )
      expect(
        Mock__L1CrossDomainMessenger.sendMessage.getCall(0).args
      ).to.deep.equal([
        DUMMY_L2_BRIDGE_ADDRESS,
        getContractInterface('IL2ERC20Bridge').encodeFunctionData(
          'finalizeDeposit',
          [
            L1ERC20.address,
            DUMMY_L2_ERC20_ADDRESS,
            alice.address,
            bob.address,
            depositAmount,
            NON_NULL_BYTES32,
          ]
        ),
        FINALIZATION_GAS,
      ])

      expect(await L1ERC20.balanceOf(alice.address)).to.equal(
        INITIAL_TOTAL_L1_SUPPLY - depositAmount
      )

      expect(await L1ERC20.balanceOf(L1StandardBridge.address)).to.equal(
        depositAmount
      )
    })

    it('cannot depositERC20 from a contract account', async () => {
      expect(
        L1StandardBridge.depositERC20(
          L1ERC20.address,
          DUMMY_L2_ERC20_ADDRESS,
          depositAmount,
          FINALIZATION_GAS,
          NON_NULL_BYTES32
        )
      ).to.be.revertedWith('Account not EOA')
    })

    describe('Handling ERC20.transferFrom() failures that revert ', () => {
      let MOCK__L1ERC20: FakeContract

      before(async () => {
        // Deploy the L1 ERC20 token, Alice will receive the full initialSupply
        MOCK__L1ERC20 = await smock.fake<Contract>('ERC20')
        MOCK__L1ERC20.transferFrom.reverts()
      })

      it('depositERC20(): will revert if ERC20.transferFrom() reverts', async () => {
        await expect(
          L1StandardBridge.connect(alice).depositERC20(
            MOCK__L1ERC20.address,
            DUMMY_L2_ERC20_ADDRESS,
            depositAmount,
            FINALIZATION_GAS,
            NON_NULL_BYTES32
          )
        ).to.be.revertedWith('SafeERC20: low-level call failed')
      })

      it('depositERC20To(): will revert if ERC20.transferFrom() reverts', async () => {
        await expect(
          L1StandardBridge.connect(alice).depositERC20To(
            MOCK__L1ERC20.address,
            DUMMY_L2_ERC20_ADDRESS,
            bobsAddress,
            depositAmount,
            FINALIZATION_GAS,
            NON_NULL_BYTES32
          )
        ).to.be.revertedWith('SafeERC20: low-level call failed')
      })

      it('depositERC20To(): will revert if the L1 ERC20 has no code or is zero address', async () => {
        await expect(
          L1StandardBridge.connect(alice).depositERC20To(
            ethers.constants.AddressZero,
            DUMMY_L2_ERC20_ADDRESS,
            bobsAddress,
            depositAmount,
            FINALIZATION_GAS,
            NON_NULL_BYTES32
          )
        ).to.be.revertedWith('Address: call to non-contract')
      })
    })

    describe('Handling ERC20.transferFrom failures that return false', () => {
      let MOCK__L1ERC20: FakeContract
      before(async () => {
        MOCK__L1ERC20 = await smock.fake('ERC20')
        MOCK__L1ERC20.transferFrom.returns(false)
      })

      it('deposit(): will revert if ERC20.transferFrom() returns false', async () => {
        await expect(
          L1StandardBridge.connect(alice).depositERC20(
            MOCK__L1ERC20.address,
            DUMMY_L2_ERC20_ADDRESS,
            depositAmount,
            FINALIZATION_GAS,
            NON_NULL_BYTES32
          )
        ).to.be.revertedWith('SafeERC20: ERC20 operation did not succeed')
      })

      it('depositTo(): will revert if ERC20.transferFrom() returns false', async () => {
        await expect(
          L1StandardBridge.depositERC20To(
            MOCK__L1ERC20.address,
            DUMMY_L2_ERC20_ADDRESS,
            bobsAddress,
            depositAmount,
            FINALIZATION_GAS,
            NON_NULL_BYTES32
          )
        ).to.be.revertedWith('SafeERC20: ERC20 operation did not succeed')
      })
    })
  })

  describe('ERC20 withdrawals', () => {
    it('onlyFromCrossDomainAccount: should revert on calls from a non-crossDomainMessenger L1 account', async () => {
      await expect(
        L1StandardBridge.connect(alice).finalizeERC20Withdrawal(
          L1ERC20.address,
          DUMMY_L2_ERC20_ADDRESS,
          constants.AddressZero,
          constants.AddressZero,
          1,
          NON_NULL_BYTES32
        )
      ).to.be.revertedWith(ERR_INVALID_MESSENGER)
    })

    it('onlyFromCrossDomainAccount: should revert on calls from the right crossDomainMessenger, but wrong xDomainMessageSender (ie. not the L2DepositedERC20)', async () => {
      Mock__L1CrossDomainMessenger.xDomainMessageSender.returns(
        '0x' + '22'.repeat(20)
      )

      await expect(
        L1StandardBridge.finalizeERC20Withdrawal(
          L1ERC20.address,
          DUMMY_L2_ERC20_ADDRESS,
          constants.AddressZero,
          constants.AddressZero,
          1,
          NON_NULL_BYTES32,
          {
            from: Mock__L1CrossDomainMessenger.address,
          }
        )
      ).to.be.revertedWith(ERR_INVALID_X_DOMAIN_MSG_SENDER)
    })

    it('should credit funds to the withdrawer and not use too much gas', async () => {
      // First Alice will 'donate' some tokens so that there's a balance to be withdrawn
      const withdrawalAmount = 10
      await L1ERC20.connect(alice).approve(
        L1StandardBridge.address,
        withdrawalAmount
      )

      await L1StandardBridge.connect(alice).depositERC20(
        L1ERC20.address,
        DUMMY_L2_ERC20_ADDRESS,
        withdrawalAmount,
        FINALIZATION_GAS,
        NON_NULL_BYTES32
      )

      expect(await L1ERC20.balanceOf(L1StandardBridge.address)).to.be.equal(
        withdrawalAmount
      )

      // make sure no balance at start of test
      expect(await L1ERC20.balanceOf(NON_ZERO_ADDRESS)).to.be.equal(0)

      Mock__L1CrossDomainMessenger.xDomainMessageSender.returns(
        () => DUMMY_L2_BRIDGE_ADDRESS
      )

      await L1StandardBridge.finalizeERC20Withdrawal(
        L1ERC20.address,
        DUMMY_L2_ERC20_ADDRESS,
        NON_ZERO_ADDRESS,
        NON_ZERO_ADDRESS,
        withdrawalAmount,
        NON_NULL_BYTES32,
        { from: Mock__L1CrossDomainMessenger.address }
      )

      expect(await L1ERC20.balanceOf(NON_ZERO_ADDRESS)).to.be.equal(
        withdrawalAmount
      )
    })
  })
})
