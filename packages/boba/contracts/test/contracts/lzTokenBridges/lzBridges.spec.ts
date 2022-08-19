import { ethers } from 'hardhat'
import { Contract, utils, BigNumber } from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'
import { expect } from '../../setup'
import { bytes32ify } from '@eth-optimism/core-utils'

describe('LayerZero Bridges', () => {
  let EthBridge: Contract
  let AltL1Bridge: Contract
  let L1Boba: Contract
  let AltL1Boba: Contract

  const initialSupply = utils.parseEther('10000000000')
  const tokenName = 'BOBA'
  const tokenSymbol = 'BOBA'

  beforeEach(async function () {
    ;[this.owner] = await ethers.getSigners()
    this.chainIdEth = 1
    this.chainIdAltL1 = 2

    // create a LayerZero Endpoint mock for testing
    const LZEndpointMock = await ethers.getContractFactory('LZEndpointMock')
    this.layerZeroEndpointMockSrc = await LZEndpointMock.deploy(this.chainIdEth)
    this.layerZeroEndpointMockDst = await LZEndpointMock.deploy(
      this.chainIdAltL1
    )
    this.mockEstimatedNativeFee = ethers.utils.parseEther('0.001')
    this.mockEstimatedZroFee = ethers.utils.parseEther('0.00025')
    await this.layerZeroEndpointMockSrc.setEstimatedFees(
      this.mockEstimatedNativeFee,
      this.mockEstimatedZroFee
    )
    await this.layerZeroEndpointMockDst.setEstimatedFees(
      this.mockEstimatedNativeFee,
      this.mockEstimatedZroFee
    )

    const Factory__EthBridge = await ethers.getContractFactory('EthBridge')
    const Factory__AltL1Bridge = await ethers.getContractFactory('AltL1Bridge')
    EthBridge = await Factory__EthBridge.deploy()
    AltL1Bridge = await Factory__AltL1Bridge.deploy()

    // initialize
    await EthBridge.initialize(
      this.layerZeroEndpointMockSrc.address,
      this.chainIdAltL1,
      AltL1Bridge.address
    )
    await AltL1Bridge.initialize(
      this.layerZeroEndpointMockDst.address,
      this.chainIdEth,
      EthBridge.address
    )

    this.layerZeroEndpointMockSrc.setDestLzEndpoint(
      AltL1Bridge.address,
      this.layerZeroEndpointMockDst.address
    )
    this.layerZeroEndpointMockDst.setDestLzEndpoint(
      EthBridge.address,
      this.layerZeroEndpointMockSrc.address
    )

    // deploy sample token
    L1Boba = await (
      await ethers.getContractFactory('L1ERC20')
    ).deploy(initialSupply, tokenName, tokenSymbol, 18)

    AltL1Boba = await getContractFactory('L2StandardERC20')
      .connect(this.owner)
      .deploy(AltL1Bridge.address, L1Boba.address, tokenName, tokenSymbol, 18)
  })

  it('should not allow to initialize again', async function () {
    await expect(
      EthBridge.initialize(
        this.layerZeroEndpointMockSrc.address,
        this.chainIdAltL1,
        AltL1Bridge.address
      )
    ).to.be.revertedWith('Initializable: contract is already initialized')

    await expect(
      AltL1Bridge.initialize(
        this.layerZeroEndpointMockDst.address,
        this.chainIdEth,
        EthBridge.address
      )
    ).to.be.revertedWith('Initializable: contract is already initialized')
  })

  it('should set transferTimestampCheckPoint and maxTransferAmountPerDay', async () => {
    const EthBridgetransferTimestampCheckPoint =
      await EthBridge.transferTimestampCheckPoint()
    const EthMaxTransferAmountPerDay = await EthBridge.maxTransferAmountPerDay()
    expect(EthBridgetransferTimestampCheckPoint).not.to.be.eq(BigNumber.from('0'))
    expect(EthMaxTransferAmountPerDay).to.eq(
      BigNumber.from(utils.parseEther('500000'))
    )

    const AlttransferTimestampCheckPoint = await AltL1Bridge.transferTimestampCheckPoint()
    const AltMaxTransferAmountPerDay =
      await AltL1Bridge.maxTransferAmountPerDay()
    expect(AlttransferTimestampCheckPoint).not.to.be.eq(BigNumber.from('0'))
    expect(AltMaxTransferAmountPerDay).to.eq(
      BigNumber.from(utils.parseEther('500000'))
    )
  })

  it('should estimate correct fee and send message', async function () {
    // approve tokens to EthBridge
    const depositAmount = utils.parseEther('100')
    await L1Boba.approve(EthBridge.address, depositAmount)

    const priorDeposits = await EthBridge.deposits(
      L1Boba.address,
      AltL1Boba.address
    )

    // users would need to supply native fees in order to send xDomain messages through LayerZero
    const payload = utils.defaultAbiCoder.encode(
      ['address', 'address', 'address', 'address', 'uint256', 'bytes'],
      [
        L1Boba.address,
        AltL1Boba.address,
        this.owner.address,
        this.owner.address,
        depositAmount,
        '0x',
      ]
    )
    const estimatedFee = await this.layerZeroEndpointMockSrc.estimateFees(
      this.chainIdAltL1, // destination chainId
      EthBridge.address, //address that calls send()
      payload, // payload
      false, // pay in ZRO token
      '0x' // adapterParams
    )
    await EthBridge.depositERC20(
      L1Boba.address,
      AltL1Boba.address,
      depositAmount,
      ethers.constants.AddressZero,
      '0x', // adapterParams
      '0x', // data
      { value: estimatedFee._nativeFee }
    )
    expect(
      await EthBridge.deposits(L1Boba.address, AltL1Boba.address)
    ).to.be.deep.eq(priorDeposits.add(depositAmount))

    expect(await EthBridge.transferredAmount()).to.be.eq(
      BigNumber.from(depositAmount)
    )
  })

  it('should deposit and receive token on alt L1', async function () {
    // approve tokens to EthBridge
    const depositAmount = utils.parseEther('100')
    await L1Boba.approve(EthBridge.address, depositAmount)

    const priorL1Balance = await L1Boba.balanceOf(this.owner.address)
    const priorAltL1Balance = await AltL1Boba.balanceOf(this.owner.address)

    // users would need to supply native fees in order to send xDomain messages through LayerZero
    const payload = utils.defaultAbiCoder.encode(
      ['address', 'address', 'address', 'address', 'uint256', 'bytes'],
      [
        L1Boba.address,
        AltL1Boba.address,
        this.owner.address,
        this.owner.address,
        depositAmount,
        '0x',
      ]
    )
    const estimatedFee = await this.layerZeroEndpointMockSrc.estimateFees(
      this.chainIdAltL1,
      EthBridge.address,
      payload,
      false,
      '0x'
    )
    await EthBridge.depositERC20(
      L1Boba.address,
      AltL1Boba.address,
      depositAmount,
      ethers.constants.AddressZero,
      '0x', // adapterParams
      '0x',
      { value: estimatedFee._nativeFee }
    )
    const postL1Balance = await L1Boba.balanceOf(this.owner.address)
    const postAltL1Balance = await AltL1Boba.balanceOf(this.owner.address)

    expect(postL1Balance).to.deep.eq(priorL1Balance.sub(depositAmount))
    expect(postAltL1Balance).to.deep.eq(priorAltL1Balance.add(depositAmount))
  })

  it('should not be able to deposit token to the zero address', async function () {
    // approve tokens to EthBridge
    const depositAmount = utils.parseEther('100')
    await L1Boba.approve(EthBridge.address, depositAmount)

    // users would need to supply native fees in order to send xDomain messages through LayerZero
    const payload = utils.defaultAbiCoder.encode(
      ['address', 'address', 'address', 'address', 'uint256', 'bytes'],
      [
        L1Boba.address,
        AltL1Boba.address,
        this.owner.address,
        this.owner.address,
        depositAmount,
        '0x',
      ]
    )
    const estimatedFee = await this.layerZeroEndpointMockSrc.estimateFees(
      this.chainIdAltL1,
      EthBridge.address,
      payload,
      false,
      '0x'
    )

    await expect(
      EthBridge.depositERC20To(
        L1Boba.address,
        AltL1Boba.address,
        ethers.constants.AddressZero,
        depositAmount,
        ethers.constants.AddressZero,
        '0x', // adapterParams
        '0x',
        { value: estimatedFee._nativeFee }
      )
    ).to.be.revertedWith('_to cannot be zero address')
  })

  it('should block deposit if the total amount is larger than the maximum transfer amount per day', async function () {
    // approve tokens to EthBridge
    const depositAmount = utils.parseEther('500001')
    await L1Boba.approve(EthBridge.address, depositAmount)

    // users would need to supply native fees in order to send xDomain messages through LayerZero
    const payload = utils.defaultAbiCoder.encode(
      ['address', 'address', 'address', 'address', 'uint256', 'bytes'],
      [
        L1Boba.address,
        AltL1Boba.address,
        this.owner.address,
        this.owner.address,
        depositAmount,
        '0x',
      ]
    )
    const estimatedFee = await this.layerZeroEndpointMockSrc.estimateFees(
      this.chainIdAltL1,
      EthBridge.address,
      payload,
      false,
      '0x'
    )
    await expect(
      EthBridge.depositERC20(
        L1Boba.address,
        AltL1Boba.address,
        depositAmount,
        ethers.constants.AddressZero,
        '0x', // adapterParams
        '0x',
        { value: estimatedFee._nativeFee }
      )
    ).to.be.revertedWith('max amount per day exceeded')
  })

  it('should be able to withdraw back to L1', async function () {
    // approve tokens to EthBridge
    const depositAmount = utils.parseEther('100')
    await L1Boba.approve(EthBridge.address, depositAmount)

    // users would need to supply native fees in order to send xDomain messages through LayerZero
    const payload = utils.defaultAbiCoder.encode(
      ['address', 'address', 'address', 'address', 'uint256', 'bytes'],
      [
        L1Boba.address,
        AltL1Boba.address,
        this.owner.address,
        this.owner.address,
        depositAmount,
        '0x',
      ]
    )
    const estimatedFee = await this.layerZeroEndpointMockSrc.estimateFees(
      this.chainIdAltL1,
      EthBridge.address,
      payload,
      false,
      '0x'
    )
    await EthBridge.depositERC20(
      L1Boba.address,
      AltL1Boba.address,
      depositAmount,
      ethers.constants.AddressZero,
      '0x', // adapterParams
      '0x',
      { value: estimatedFee._nativeFee }
    )

    const priorAltL1Balance = await AltL1Boba.balanceOf(this.owner.address)
    const priorL1Balance = await L1Boba.balanceOf(this.owner.address)

    // assuming the payload size is the same on withdraw
    const payloadWithdraw = payload
    const estimatedFeeWithdraw =
      await this.layerZeroEndpointMockSrc.estimateFees(
        this.chainIdEth,
        AltL1Bridge.address,
        payloadWithdraw,
        false,
        '0x'
      )
    const withdrawAmount = depositAmount
    await AltL1Bridge.withdraw(
      AltL1Boba.address,
      withdrawAmount,
      ethers.constants.AddressZero,
      '0x', // adapterParams
      '0x',
      {
        value: estimatedFeeWithdraw._nativeFee,
      }
    )

    const postAltL1Balance = await AltL1Boba.balanceOf(this.owner.address)
    const postL1Balance = await L1Boba.balanceOf(this.owner.address)

    expect(postAltL1Balance).to.deep.eq(0)
    expect(await AltL1Boba.totalSupply()).to.deep.eq(0)
    expect(postAltL1Balance).to.deep.eq(priorAltL1Balance.sub(withdrawAmount))
    expect(postL1Balance).to.deep.eq(priorL1Balance.add(withdrawAmount))
    expect(await AltL1Bridge.transferredAmount()).to.be.eq(
      BigNumber.from(depositAmount)
    )
  })

  it('should not be able to withdraw token to the zero address', async function () {
    // approve tokens to EthBridge
    const depositAmount = utils.parseEther('100')
    await L1Boba.approve(EthBridge.address, depositAmount)

    // users would need to supply native fees in order to send xDomain messages through LayerZero
    const payload = utils.defaultAbiCoder.encode(
      ['address', 'address', 'address', 'address', 'uint256', 'bytes'],
      [
        L1Boba.address,
        AltL1Boba.address,
        this.owner.address,
        this.owner.address,
        depositAmount,
        '0x',
      ]
    )
    const estimatedFee = await this.layerZeroEndpointMockSrc.estimateFees(
      this.chainIdAltL1,
      EthBridge.address,
      payload,
      false,
      '0x'
    )
    await EthBridge.depositERC20(
      L1Boba.address,
      AltL1Boba.address,
      depositAmount,
      ethers.constants.AddressZero,
      '0x', // adapterParams
      '0x',
      { value: estimatedFee._nativeFee }
    )

    const payloadWithdraw = payload
    const estimatedFeeWithdraw =
      await this.layerZeroEndpointMockSrc.estimateFees(
        this.chainIdEth,
        AltL1Bridge.address,
        payloadWithdraw,
        false,
        '0x'
      )
    const withdrawAmount = depositAmount
    await expect(
      AltL1Bridge.withdrawTo(
        AltL1Boba.address,
        ethers.constants.AddressZero,
        withdrawAmount,
        ethers.constants.AddressZero,
        '0x', // adapterParams
        '0x',
        {
          value: estimatedFeeWithdraw._nativeFee,
        }
      )
    ).to.be.revertedWith('_to cannot be zero address')
  })

  it('should block withdraw if the total amount is larger than the maximum transfer amount per day', async function () {
    const depositAmount = utils.parseEther('100')
    // Update maxTransferAmountPerDay for AltL1Bridge]
    await AltL1Bridge.setMaxTransferAmountPerDay(
      BigNumber.from(depositAmount).sub('1')
    )
    // approve tokens to EthBridge
    await L1Boba.approve(EthBridge.address, depositAmount)

    // users would need to supply native fees in order to send xDomain messages through LayerZero
    const payload = utils.defaultAbiCoder.encode(
      ['address', 'address', 'address', 'address', 'uint256', 'bytes'],
      [
        L1Boba.address,
        AltL1Boba.address,
        this.owner.address,
        this.owner.address,
        depositAmount,
        '0x',
      ]
    )
    const estimatedFee = await this.layerZeroEndpointMockSrc.estimateFees(
      this.chainIdAltL1,
      EthBridge.address,
      payload,
      false,
      '0x'
    )
    await EthBridge.depositERC20(
      L1Boba.address,
      AltL1Boba.address,
      depositAmount,
      ethers.constants.AddressZero,
      '0x', // adapterParams
      '0x',
      { value: estimatedFee._nativeFee }
    )

    const payloadWithdraw = payload
    const estimatedFeeWithdraw =
      await this.layerZeroEndpointMockSrc.estimateFees(
        this.chainIdEth,
        AltL1Bridge.address,
        payloadWithdraw,
        false,
        '0x'
      )
    const withdrawAmount = depositAmount
    await expect(
      AltL1Bridge.withdraw(
        AltL1Boba.address,
        withdrawAmount,
        ethers.constants.AddressZero,
        '0x', // adapterParams
        '0x',
        {
          value: estimatedFeeWithdraw._nativeFee,
        }
      )
    ).to.be.revertedWith('max amount per day exceeded')
  })

  it('should not be able to withdraw token to the zero address', async function () {
    // approve tokens to EthBridge
    const depositAmount = utils.parseEther('100')
    await L1Boba.approve(EthBridge.address, depositAmount)

    // users would need to supply native fees in order to send xDomain messages through LayerZero
    const payload = utils.defaultAbiCoder.encode(
      ['address', 'address', 'address', 'address', 'uint256', 'bytes'],
      [
        L1Boba.address,
        AltL1Boba.address,
        this.owner.address,
        this.owner.address,
        depositAmount,
        '0x',
      ]
    )
    const estimatedFee = await this.layerZeroEndpointMockSrc.estimateFees(
      this.chainIdAltL1,
      EthBridge.address,
      payload,
      false,
      '0x'
    )
    await EthBridge.depositERC20(
      L1Boba.address,
      AltL1Boba.address,
      depositAmount,
      ethers.constants.AddressZero,
      '0x', // adapterParams
      '0x',
      { value: estimatedFee._nativeFee }
    )

    const payloadWithdraw = payload
    const estimatedFeeWithdraw =
      await this.layerZeroEndpointMockSrc.estimateFees(
        this.chainIdEth,
        AltL1Bridge.address,
        payloadWithdraw,
        false,
        '0x'
      )
    const withdrawAmount = depositAmount
    await expect(
      AltL1Bridge.withdrawTo(
        AltL1Boba.address,
        ethers.constants.AddressZero,
        withdrawAmount,
        ethers.constants.AddressZero,
        '0x', // adapterParams
        '0x',
        {
          value: estimatedFeeWithdraw._nativeFee,
        }
      )
    ).to.be.revertedWith('_to cannot be zero address')
  })

  it('should fail withdraw without tokens', async function () {
    // approve tokens to EthBridge
    const depositAmount = utils.parseEther('100')
    await L1Boba.approve(EthBridge.address, depositAmount)

    // users would need to supply native fees in order to send xDomain messages through LayerZero
    const payload = utils.defaultAbiCoder.encode(
      ['address', 'address', 'address', 'address', 'uint256', 'bytes'],
      [
        L1Boba.address,
        AltL1Boba.address,
        this.owner.address,
        this.owner.address,
        depositAmount,
        '0x',
      ]
    )
    const estimatedFee = await this.layerZeroEndpointMockSrc.estimateFees(
      this.chainIdAltL1,
      EthBridge.address,
      payload,
      false,
      '0x'
    )
    await EthBridge.depositERC20(
      L1Boba.address,
      AltL1Boba.address,
      depositAmount,
      ethers.constants.AddressZero,
      '0x', // adapterParams
      '0x',
      { value: estimatedFee._nativeFee }
    )

    // assuming the payload size is the same on withdraw
    const payloadWithdraw = payload
    const estimatedFeeWithdraw =
      await this.layerZeroEndpointMockSrc.estimateFees(
        this.chainIdEth,
        AltL1Bridge.address,
        payloadWithdraw,
        false,
        '0x'
      )
    const withdrawAmount = depositAmount
    const [, signer1] = await ethers.getSigners()
    await expect(
      AltL1Bridge.connect(signer1).withdraw(
        AltL1Boba.address,
        withdrawAmount,
        ethers.constants.AddressZero,
        '0x', // adapterParams
        '0x',
        {
          value: estimatedFeeWithdraw._nativeFee,
        }
      )
    ).to.be.revertedWith('ERC20: burn amount exceeds balance')
  })

  it('should be able to recover failed deposit', async function () {
    // approve tokens to EthBridge
    const depositAmount = utils.parseEther('100')
    await L1Boba.approve(EthBridge.address, depositAmount)

    const priorL1Balance = await L1Boba.balanceOf(this.owner.address)

    // users would need to supply native fees in order to send xDomain messages through LayerZero
    const payload = utils.defaultAbiCoder.encode(
      ['address', 'address', 'address', 'address', 'uint256', 'bytes'],
      [
        L1Boba.address,
        AltL1Boba.address,
        this.owner.address,
        this.owner.address,
        depositAmount,
        '0x',
      ]
    )
    const estimatedFee = await this.layerZeroEndpointMockSrc.estimateFees(
      this.chainIdAltL1,
      EthBridge.address,
      payload,
      false,
      '0x'
    )
    await EthBridge.depositERC20(
      L1Boba.address,
      L1Boba.address, // invalid AltL1 token address
      depositAmount,
      ethers.constants.AddressZero,
      '0x', // adapterParams
      '0x',
      { value: estimatedFee._nativeFee }
    )

    const postL1Balance = await L1Boba.balanceOf(this.owner.address)
    const AltL1BboaBalance = await AltL1Boba.balanceOf(this.owner.address)
    expect(await L1Boba.balanceOf(EthBridge.address)).to.deep.eq(depositAmount)
    expect(await EthBridge.deposits(L1Boba.address, L1Boba.address)).to.be.eq(
      depositAmount
    )
    // amount shouldn't be returned directly
    expect(postL1Balance).to.deep.eq(priorL1Balance.sub(depositAmount))
    expect(AltL1BboaBalance).to.deep.eq(0)

    // to return failed deposit, users will have to call retryMessage and pay the layerZero fee
    expect(
      await AltL1Bridge.failedMessages(this.chainIdEth, EthBridge.address, 1)
    ).to.not.eq(bytes32ify(0))

    // construct the payload back
    const payloadRetry = utils.defaultAbiCoder.encode(
      ['address', 'address', 'address', 'address', 'uint256', 'bytes'],
      [
        L1Boba.address,
        L1Boba.address,
        this.owner.address,
        this.owner.address,
        depositAmount,
        '0x',
      ]
    )
    const estimatedFeeRetry = await this.layerZeroEndpointMockSrc.estimateFees(
      this.chainIdEth,
      AltL1Bridge.address,
      payloadRetry,
      false,
      '0x'
    )
    await AltL1Bridge.retryMessage(
      this.chainIdEth,
      EthBridge.address,
      1, // nonce
      payloadRetry,
      { value: estimatedFeeRetry._nativeFee }
    )
    const postRetryL1Balance = await L1Boba.balanceOf(this.owner.address)
    expect(postRetryL1Balance).to.be.eq(postL1Balance.add(depositAmount))
    expect(await EthBridge.deposits(L1Boba.address, L1Boba.address)).to.be.eq(0)

    // should fail if retry succeeds
    await expect(
      AltL1Bridge.retryMessage(
        this.chainIdEth,
        EthBridge.address,
        1, // nonce
        payloadRetry,
        { value: estimatedFeeRetry._nativeFee }
      )
    ).to.be.revertedWith('NonblockingLzApp: no stored message')
  })

  it('should mint tokens if retry is a success', async function () {
    // predetermine contract address
    // add two to the nonce expecting approve and deposit tx from same account
    const nonce =
      (await ethers.provider.getTransactionCount(this.owner.address)) + 2
    const rlp_encoded = ethers.utils.RLP.encode([
      this.owner.address,
      ethers.BigNumber.from(nonce.toString()).toHexString(),
    ])
    const contract_address = '0x'.concat(
      ethers.utils.keccak256(rlp_encoded).substring(26)
    )
    const PreDetAltL1Boba2 = ethers.utils.getAddress(contract_address)

    const depositAmount = utils.parseEther('100')
    await L1Boba.approve(EthBridge.address, depositAmount)

    // users would need to supply native fees in order to send xDomain messages through LayerZero
    const payload = utils.defaultAbiCoder.encode(
      ['address', 'address', 'address', 'address', 'uint256', 'bytes'],
      [
        L1Boba.address,
        PreDetAltL1Boba2, // contract which does not exist yet
        this.owner.address,
        this.owner.address,
        depositAmount,
        '0x',
      ]
    )
    const estimatedFee = await this.layerZeroEndpointMockSrc.estimateFees(
      this.chainIdAltL1,
      EthBridge.address,
      payload,
      false,
      '0x'
    )
    await EthBridge.depositERC20(
      L1Boba.address,
      PreDetAltL1Boba2, // contract which does not exist yet
      depositAmount,
      ethers.constants.AddressZero,
      '0x', // adapterParams
      '0x',
      { value: estimatedFee._nativeFee }
    )

    // relay should fail because PreDetAltL1Boba2 does not exist
    expect(
      await AltL1Bridge.failedMessages(this.chainIdEth, EthBridge.address, 1)
    ).to.not.eq(bytes32ify(0))

    const AltL1Boba2 = await getContractFactory('L2StandardERC20')
      .connect(this.owner)
      .deploy(AltL1Bridge.address, L1Boba.address, tokenName, tokenSymbol, 18)
    const payloadRetry = utils.defaultAbiCoder.encode(
      ['address', 'address', 'address', 'address', 'uint256', 'bytes'],
      [
        L1Boba.address,
        AltL1Boba2.address,
        this.owner.address,
        this.owner.address,
        depositAmount,
        '0x',
      ]
    )
    const estimatedFeeRetry = await this.layerZeroEndpointMockSrc.estimateFees(
      this.chainIdEth,
      AltL1Bridge.address,
      payloadRetry,
      false,
      '0x'
    )
    await AltL1Bridge.retryMessage(
      this.chainIdEth,
      EthBridge.address,
      1, // nonce
      payloadRetry,
      { value: estimatedFeeRetry._nativeFee }
    )

    expect(await AltL1Boba2.balanceOf(this.owner.address)).to.be.eq(
      depositAmount
    )
    expect(
      await AltL1Bridge.failedMessages(this.chainIdEth, EthBridge.address, 1)
    ).to.deep.eq(bytes32ify(0))
    expect(
      await EthBridge.deposits(L1Boba.address, AltL1Boba2.address)
    ).to.be.deep.eq(depositAmount)

    // trying again will fail
    await expect(
      AltL1Bridge.retryMessage(
        this.chainIdEth,
        EthBridge.address,
        1, // nonce
        payloadRetry,
        { value: estimatedFeeRetry._nativeFee }
      )
    ).to.be.revertedWith('NonblockingLzApp: no stored message')
  })

  it('should not be able to submit fake retryMessage', async function () {
    // approve tokens to EthBridge
    const depositAmount = utils.parseEther('100')
    await L1Boba.approve(EthBridge.address, depositAmount)

    // users would need to supply native fees in order to send xDomain messages through LayerZero
    const payload = utils.defaultAbiCoder.encode(
      ['address', 'address', 'address', 'address', 'uint256', 'bytes'],
      [
        L1Boba.address,
        AltL1Boba.address,
        this.owner.address,
        this.owner.address,
        depositAmount,
        '0x',
      ]
    )
    const estimatedFee = await this.layerZeroEndpointMockSrc.estimateFees(
      this.chainIdAltL1,
      EthBridge.address,
      payload,
      false,
      '0x'
    )
    await EthBridge.depositERC20(
      L1Boba.address,
      L1Boba.address, // invalid AltL1 token address
      depositAmount,
      ethers.constants.AddressZero,
      '0x', // adapterParams
      '0x',
      { value: estimatedFee._nativeFee }
    )

    // construct a fake payload
    const fakePayload = utils.defaultAbiCoder.encode(
      ['address', 'address', 'address', 'address', 'uint256', 'bytes'],
      [
        L1Boba.address,
        AltL1Boba.address, // tweak payload
        this.owner.address,
        this.owner.address,
        depositAmount,
        '0x',
      ]
    )
    const estimatedFeeRetry = await this.layerZeroEndpointMockSrc.estimateFees(
      this.chainIdEth,
      AltL1Bridge.address,
      fakePayload,
      false,
      '0x'
    )
    await expect(
      AltL1Bridge.retryMessage(
        this.chainIdEth,
        EthBridge.address,
        1, // nonce
        fakePayload,
        { value: estimatedFeeRetry._nativeFee }
      )
    ).to.be.revertedWith('NonblockingLzApp: invalid payload')
  })

  it('only the owner should be able to allow custom adapter params', async function () {
    const [, signer1] = await ethers.getSigners()
    // EthBridge
    await expect(
      EthBridge.connect(signer1).setUseCustomAdapterParams(true, 220000)
    ).to.be.revertedWith('Ownable: caller is not the owner')
    // set useCustomParams on EthBridge
    await EthBridge.connect(this.owner).setUseCustomAdapterParams(true, 220000)

    const ethBridgeMinGasLimit = await EthBridge.minDstGasLookup(
      await EthBridge.dstChainId(),
      await EthBridge.FUNCTION_TYPE_SEND()
    )
    expect(ethBridgeMinGasLimit).to.be.deep.eq(ethers.BigNumber.from(220000))
    expect(await EthBridge.useCustomAdapterParams()).to.be.deep.eq(true)

    // AltL1Bridge
    await expect(
      AltL1Bridge.connect(signer1).setUseCustomAdapterParams(true, 180000)
    ).to.be.revertedWith('Ownable: caller is not the owner')
    // set useCustomParams on AltL1Bridge
    await AltL1Bridge.connect(this.owner).setUseCustomAdapterParams(
      true,
      180000
    )

    const altL1BridgeMinGasLimit = await AltL1Bridge.minDstGasLookup(
      await AltL1Bridge.dstChainId(),
      await AltL1Bridge.FUNCTION_TYPE_SEND()
    )
    expect(altL1BridgeMinGasLimit).to.be.deep.eq(ethers.BigNumber.from(180000))
    expect(await AltL1Bridge.useCustomAdapterParams()).to.be.deep.eq(true)

    // should also be able to reset
    // reset EthBridge
    await EthBridge.connect(this.owner).setUseCustomAdapterParams(false, 200000)
    // reset AltL1Bridge
    await AltL1Bridge.connect(this.owner).setUseCustomAdapterParams(
      false,
      200000
    )
    expect(await EthBridge.useCustomAdapterParams()).to.be.deep.eq(false)
    expect(await AltL1Bridge.useCustomAdapterParams()).to.be.deep.eq(false)
  })

  it('should be able to send messages with custom adapter parameter', async function () {
    await EthBridge.connect(this.owner).setUseCustomAdapterParams(true, 180000)
    // approve tokens to EthBridge
    const depositAmount = utils.parseEther('100')
    await L1Boba.approve(EthBridge.address, depositAmount)

    const priorL1Balance = await L1Boba.balanceOf(this.owner.address)
    const priorAltL1Balance = await AltL1Boba.balanceOf(this.owner.address)

    const adapterParam = ethers.utils.solidityPack(
      ['uint16', 'uint256'],
      [1, 180000]
    )

    const incorrectAdapterParam = ethers.utils.solidityPack(
      ['uint16', 'uint256'],
      [1, 179000]
    )

    // users would need to supply native fees in order to send xDomain messages through LayerZero
    const payload = utils.defaultAbiCoder.encode(
      ['address', 'address', 'address', 'address', 'uint256', 'bytes'],
      [
        L1Boba.address,
        AltL1Boba.address,
        this.owner.address,
        this.owner.address,
        depositAmount,
        '0x',
      ]
    )
    const estimatedFee = await this.layerZeroEndpointMockSrc.estimateFees(
      this.chainIdAltL1,
      EthBridge.address,
      payload,
      false,
      adapterParam
    )
    await expect(
      EthBridge.depositERC20(
        L1Boba.address,
        AltL1Boba.address,
        depositAmount,
        ethers.constants.AddressZero,
        incorrectAdapterParam, // adapterParams
        '0x',
        { value: estimatedFee._nativeFee }
      )
    ).to.be.revertedWith('LzApp: gas limit is too low')

    await EthBridge.depositERC20(
      L1Boba.address,
      AltL1Boba.address,
      depositAmount,
      ethers.constants.AddressZero,
      adapterParam, // adapterParams
      '0x',
      { value: estimatedFee._nativeFee }
    )
    const postL1Balance = await L1Boba.balanceOf(this.owner.address)
    const postAltL1Balance = await AltL1Boba.balanceOf(this.owner.address)

    expect(postL1Balance).to.deep.eq(priorL1Balance.sub(depositAmount))
    expect(postAltL1Balance).to.deep.eq(priorAltL1Balance.add(depositAmount))
  })

  it('should be able to send messages with custom adapter parameter', async function () {
    await EthBridge.connect(this.owner).setUseCustomAdapterParams(true, 180000)
    // approve tokens to EthBridge
    const depositAmount = utils.parseEther('100')
    await L1Boba.approve(EthBridge.address, depositAmount)

    const priorL1Balance = await L1Boba.balanceOf(this.owner.address)
    const priorAltL1Balance = await AltL1Boba.balanceOf(this.owner.address)

    const adapterParam = ethers.utils.solidityPack(
      ['uint16', 'uint256'],
      [1, 180000]
    )

    const incorrectAdapterParam = ethers.utils.solidityPack(
      ['uint16', 'uint256'],
      [1, 179000]
    )

    // users would need to supply native fees in order to send xDomain messages through LayerZero
    const payload = utils.defaultAbiCoder.encode(
      ['address', 'address', 'address', 'address', 'uint256', 'bytes'],
      [
        L1Boba.address,
        AltL1Boba.address,
        this.owner.address,
        this.owner.address,
        depositAmount,
        '0x',
      ]
    )
    const estimatedFee = await this.layerZeroEndpointMockSrc.estimateFees(
      this.chainIdAltL1,
      EthBridge.address,
      payload,
      false,
      adapterParam
    )
    await expect(
      EthBridge.depositERC20(
        L1Boba.address,
        AltL1Boba.address,
        depositAmount,
        ethers.constants.AddressZero,
        incorrectAdapterParam, // adapterParams
        '0x',
        { value: estimatedFee._nativeFee }
      )
    ).to.be.revertedWith('LzApp: gas limit is too low')

    await EthBridge.depositERC20(
      L1Boba.address,
      AltL1Boba.address,
      depositAmount,
      ethers.constants.AddressZero,
      adapterParam, // adapterParams
      '0x',
      { value: estimatedFee._nativeFee }
    )
    const postL1Balance = await L1Boba.balanceOf(this.owner.address)
    const postAltL1Balance = await AltL1Boba.balanceOf(this.owner.address)

    expect(postL1Balance).to.deep.eq(priorL1Balance.sub(depositAmount))
    expect(postAltL1Balance).to.deep.eq(priorAltL1Balance.add(depositAmount))
  })

  it('should reset transferTimestampCheckPoint', async function () {
    const preEthTransferTimestampCheckPoint =
      await EthBridge.transferTimestampCheckPoint()
    const preAltTransferTimestampCheckPoint =
      await AltL1Bridge.transferTimestampCheckPoint()

    await ethers.provider.send('evm_increaseTime', [86401])

    // approve tokens to EthBridge
    const depositAmount = utils.parseEther('100')
    await L1Boba.approve(EthBridge.address, depositAmount)

    // users would need to supply native fees in order to send xDomain messages through LayerZero
    const payload = utils.defaultAbiCoder.encode(
      ['address', 'address', 'address', 'address', 'uint256', 'bytes'],
      [
        L1Boba.address,
        AltL1Boba.address,
        this.owner.address,
        this.owner.address,
        depositAmount,
        '0x',
      ]
    )
    const estimatedFee = await this.layerZeroEndpointMockSrc.estimateFees(
      this.chainIdAltL1,
      EthBridge.address,
      payload,
      false,
      '0x'
    )
    await EthBridge.depositERC20(
      L1Boba.address,
      AltL1Boba.address,
      depositAmount,
      ethers.constants.AddressZero,
      '0x', // adapterParams
      '0x',
      { value: estimatedFee._nativeFee }
    )

    const priorAltL1Balance = await AltL1Boba.balanceOf(this.owner.address)
    const priorL1Balance = await L1Boba.balanceOf(this.owner.address)

    // assuming the payload size is the same on withdraw
    const payloadWithdraw = payload
    const estimatedFeeWithdraw =
      await this.layerZeroEndpointMockSrc.estimateFees(
        this.chainIdEth,
        AltL1Bridge.address,
        payloadWithdraw,
        false,
        '0x'
      )
    const withdrawAmount = depositAmount
    await AltL1Bridge.withdraw(
      AltL1Boba.address,
      withdrawAmount,
      ethers.constants.AddressZero,
      '0x', // adapterParams
      '0x',
      {
        value: estimatedFeeWithdraw._nativeFee,
      }
    )

    const postAltL1Balance = await AltL1Boba.balanceOf(this.owner.address)
    const postL1Balance = await L1Boba.balanceOf(this.owner.address)
    const postEthTransferTimestampCheckPoint =
      await EthBridge.transferTimestampCheckPoint()
    const postAltTransferTimestampCheckPoint =
      await AltL1Bridge.transferTimestampCheckPoint()

    expect(postAltL1Balance).to.deep.eq(0)
    expect(await AltL1Boba.totalSupply()).to.deep.eq(0)
    expect(postAltL1Balance).to.deep.eq(priorAltL1Balance.sub(withdrawAmount))
    expect(postL1Balance).to.deep.eq(priorL1Balance.add(withdrawAmount))
    expect(await AltL1Bridge.transferredAmount()).to.be.eq(
      BigNumber.from(depositAmount)
    )
    expect(postEthTransferTimestampCheckPoint).to.be.gt(
      preEthTransferTimestampCheckPoint.add(BigNumber.from('86400'))
    )
    expect(await EthBridge.transferredAmount()).to.be.eq(
      BigNumber.from(depositAmount)
    )
    expect(postAltTransferTimestampCheckPoint).to.be.gt(
      preAltTransferTimestampCheckPoint.add(BigNumber.from('86400'))
    )
    expect(await AltL1Bridge.transferredAmount()).to.be.eq(
      BigNumber.from(depositAmount)
    )
  })

  it('should set maxTransferAmountPerDay', async () => {
    await AltL1Bridge.setMaxTransferAmountPerDay('1')
    await EthBridge.setMaxTransferAmountPerDay('1')

    expect(await EthBridge.maxTransferAmountPerDay()).to.be.eq(
      BigNumber.from('1')
    )
    expect(await AltL1Bridge.maxTransferAmountPerDay()).to.be.eq(
      BigNumber.from('1')
    )
  })

  it('Only the owner should be able to set maxTransferAmountPerDay', async () => {
    const [, signer1] = await ethers.getSigners()
    // EthBridge
    await expect(
      EthBridge.connect(signer1).setMaxTransferAmountPerDay(2)
    ).to.be.revertedWith('Ownable: caller is not the owner')
    // AltL1Bridge
    await expect(
      AltL1Bridge.connect(signer1).setMaxTransferAmountPerDay(2)
    ).to.be.revertedWith('Ownable: caller is not the owner')
  })
})
