import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
import { ethers } from 'hardhat'
import { Contract, Signer, BigNumber, utils } from 'ethers'

let L2Boba: Contract
let Teleportation: Contract
let Proxy__Teleportation: Contract

let signer: Signer
let signer2: Signer
let signerAddress: string
let signer2Address: string

const initialSupply = utils.parseEther('10000000000')
const tokenName = 'BOBA'
const tokenSymbol = 'BOBA'

const getGasFeeFromLastestBlock = async (provider: any): Promise<BigNumber> => {
  const blockNumber = await provider.getBlockNumber()
  const block = await provider.getBlock(blockNumber)
  const gasUsed = block.gasUsed
  const txHash = block.transactions[0]
  const tx = await provider.getTransaction(txHash)
  const gasPrice = tx.gasPrice
  return gasUsed.mul(gasPrice)
}

// TODO: Remove
describe.only('BOBA Teleportation Tests', async () => {
  describe('Ethereum L2 - BOBA is not the native token', () => {
    before(async () => {
      signer = (await ethers.getSigners())[0]
      signer2 = (await ethers.getSigners())[1]
      signerAddress = await signer.getAddress()
      signer2Address = await signer2.getAddress()

      L2Boba = await (
        await ethers.getContractFactory('L1ERC20')
      ).deploy(initialSupply, tokenName, tokenSymbol, 18)

      const Factory__Teleportation = await ethers.getContractFactory(
        'Teleportation'
      )
      Teleportation = await Factory__Teleportation.deploy()
      await Teleportation.deployTransaction.wait()
      const Factory__Proxy__Teleportation = await ethers.getContractFactory(
        'Lib_ResolvedDelegateProxy'
      )
      Proxy__Teleportation = await Factory__Proxy__Teleportation.deploy(
        Teleportation.address
      )
      await Proxy__Teleportation.deployTransaction.wait()
      Proxy__Teleportation = new ethers.Contract(
        Proxy__Teleportation.address,
        Factory__Teleportation.interface,
        signer
      )
      await Proxy__Teleportation.initialize(
        ethers.utils.parseEther('1'),
        ethers.utils.parseEther('100000')
      )
    })

    it('should revert when initialize again', async () => {
      await expect(
        Proxy__Teleportation.initialize(
          ethers.utils.parseEther('1'),
          ethers.utils.parseEther('100000') // maxTransferAmountPerDay is set to 100000
        )
      ).to.be.revertedWith('Contract has been initialized')
    })

    it('should add the supported chain', async () => {
      await Proxy__Teleportation.addSupportedChain(4)
      expect(await Proxy__Teleportation.supportedChains(4)).to.eq(true)
    })

    it('should add a supported token', async () => {
      await Proxy__Teleportation.addSupportedToken(L2Boba.address)
      expect(await Proxy__Teleportation.supportedTokens(L2Boba.address)).to.eq(
        true
      )
    })

    it('should not add the supported chain if it is added', async () => {
      await expect(
        Proxy__Teleportation.addSupportedChain(4)
      ).to.be.revertedWith('Already supported')
    })

    it('should not add supported token if it is zero address', async () => {
      await expect(
        Proxy__Teleportation.addSupportedToken(ethers.constants.AddressZero)
      ).to.be.revertedWith('zero address not allowed')
    })

    it('should not add supported token if it is not a contract address', async () => {
      await expect(
        Proxy__Teleportation.addSupportedToken(
          signerAddress
        )
      ).to.be.revertedWith('Not a contract')
    })

    it('should not add supported token if it is already added', async () => {
      await expect(
        Proxy__Teleportation.addSupportedToken(L2Boba.address)
      ).to.be.revertedWith('Already supported')
    })

    it('should not add the supported chain if caller is not owner', async () => {
      await expect(
        Proxy__Teleportation.connect(signer2).addSupportedChain(4)
      ).to.be.revertedWith('Caller is not the owner')
    })

    it('should not add supported token if caller is not owner', async () => {
      await expect(
        Proxy__Teleportation.connect(signer2).addSupportedToken(L2Boba.address)
      ).to.be.revertedWith('Caller is not the owner')
    })

    it('should remove the supported chain', async () => {
      await Proxy__Teleportation.removeSupportedChain(4)
      expect(await Proxy__Teleportation.supportedChains(4)).to.eq(false)
    })

    it('should remove the supported token', async () => {
      await Proxy__Teleportation.removeSupportedToken(L2Boba.address)
      expect(await Proxy__Teleportation.supportedTokens(L2Boba.address)).to.eq(
        false
      )
    })

    it('should not remove chain if it is already not supported', async () => {
      await expect(
        Proxy__Teleportation.removeSupportedChain(4)
      ).to.be.revertedWith('Already not supported')
    })

    it('should not remove token if it is already not supported', async () => {
      await expect(
        Proxy__Teleportation.removeSupportedToken(L2Boba.address)
      ).to.be.revertedWith('Already not supported')
    })

    it('should not remove token if it is zero address', async () => {
      await expect(
        Proxy__Teleportation.removeSupportedToken(ethers.constants.AddressZero)
      ).to.be.revertedWith('zero address not allowed')
    })

    it('should not remove the supported chain if caller is not owner', async () => {
      await expect(
        Proxy__Teleportation.connect(signer2).removeSupportedChain(4)
      ).to.be.revertedWith('Caller is not the owner')
    })

    it('should not remove the supported token if caller is not owner', async () => {
      await expect(
        Proxy__Teleportation.connect(signer2).removeSupportedToken(L2Boba.address)
      ).to.be.revertedWith('Caller is not the owner')
    })

    it('should teleport BOBA tokens and emit event', async () => {
      await Proxy__Teleportation.addSupportedChain(4)
      await Proxy__Teleportation.addSupportedToken(L2Boba.address)
      const _amount = ethers.utils.parseEther('100')
      const preBalance = await L2Boba.balanceOf(signerAddress)
      await L2Boba.approve(Proxy__Teleportation.address, _amount)
      await expect(Proxy__Teleportation.teleportERC20(L2Boba.address, _amount, 4))
        .to.emit(Proxy__Teleportation, 'AssetReceived')
        .withArgs(L2Boba.address, 31337, 4, 0, signerAddress, _amount)
      expect((await Proxy__Teleportation.totalDeposits(4)).toString()).to.be.eq(
        '1'
      )
      expect(
        (await Proxy__Teleportation.transferredAmount()).toString()
      ).to.be.eq(_amount.toString())
      const postBalance = await L2Boba.balanceOf(signerAddress)
      expect(preBalance.sub(_amount)).to.be.eq(postBalance)
    })

    it('should not teleport BOBA tokens if the amount exceeds the daily limit', async () => {
      const maxTransferAmountPerDay =
        await Proxy__Teleportation.maxTransferAmountPerDay()
      const transferredAmount = await Proxy__Teleportation.transferredAmount()
      const _amount = maxTransferAmountPerDay.sub(transferredAmount).add(1)
      await L2Boba.approve(Proxy__Teleportation.address, _amount)
      await expect(
        Proxy__Teleportation.teleportERC20(L2Boba.address, _amount, 4)
      ).to.be.revertedWith('max amount per day exceeded')
    })

    it('should reset the transferred amount', async () => {
      await ethers.provider.send('evm_increaseTime', [86400])
      const _amount = ethers.utils.parseEther('1')
      const transferTimestampCheckPoint =
        await Proxy__Teleportation.transferTimestampCheckPoint()
      await L2Boba.approve(Proxy__Teleportation.address, _amount)
      await Proxy__Teleportation.teleportERC20(L2Boba.address, _amount, 4)
      expect(await Proxy__Teleportation.transferredAmount()).to.be.eq(_amount)
      expect(
        await Proxy__Teleportation.transferTimestampCheckPoint()
      ).to.be.not.eq(transferTimestampCheckPoint)
    })

    it('should revert if _toChainId is not supported', async () => {
      const _amount = ethers.utils.parseEther('10')
      await L2Boba.approve(Proxy__Teleportation.address, _amount)
      await expect(
        Proxy__Teleportation.teleportERC20(L2Boba.address, _amount, 100)
      ).to.be.revertedWith('Target chain not supported')
    })

    it('should disburse BOBA tokens', async () => {
      const preBalance = await L2Boba.balanceOf(Proxy__Teleportation.address)
      const preSignerBalance = await L2Boba.balanceOf(signerAddress)
      const payload = [
        {
          token: L2Boba.address,
          amount: ethers.utils.parseEther('100'),
          addr: signerAddress,
          sourceChainId: 4,
          depositId: 0,
        },
        {
          token: L2Boba.address,
          amount: ethers.utils.parseEther('1'),
          addr: signerAddress,
          sourceChainId: 4,
          depositId: 1,
        },
      ]
      await L2Boba.approve(
        Proxy__Teleportation.address,
        ethers.utils.parseEther('101')
      )
      await Proxy__Teleportation.disburseERC20(payload)
      const postBalance = await L2Boba.balanceOf(Proxy__Teleportation.address)
      const postSignerBalance = await L2Boba.balanceOf(signerAddress)
      expect(
        (await Proxy__Teleportation.totalDisbursements(4)).toString()
      ).to.be.eq('2')
      expect(preBalance).to.be.eq(postBalance)
      expect(postSignerBalance).to.be.eq(preSignerBalance)
    })

    it('should disburse BOBA tokens and emit events', async () => {
      const _amount = ethers.utils.parseEther('100')
      const payload = [
        {
          token: L2Boba.address,
          amount: _amount,
          addr: signerAddress,
          sourceChainId: 4,
          depositId: 2,
        },
      ]
      await L2Boba.approve(Proxy__Teleportation.address, _amount)
      await expect(Proxy__Teleportation.disburseERC20(payload))
        .to.emit(Proxy__Teleportation, 'DisbursementSuccess')
        .withArgs(2, signerAddress, _amount, 4)
    })

    it('should not disburse BOBA tokens if the depositId is wrong', async () => {
      const _amount = ethers.utils.parseEther('100')
      const payload = [
        {
          token: L2Boba.address,
          amount: _amount,
          addr: signerAddress,
          sourceChainId: 4,
          depositId: 4,
        },
      ]
      await L2Boba.approve(Proxy__Teleportation.address, _amount)
      await expect(
        Proxy__Teleportation.disburseERC20(payload)
      ).to.be.revertedWith('Unexpected next deposit id')
    })

    it('should not disburse tokens if it is not approved', async () => {
      const _amount = ethers.utils.parseEther('101')
      const payload = [
        {
          token: L2Boba.address,
          amount: _amount,
          addr: signerAddress,
          sourceChainId: 4,
          depositId: 3,
        },
      ]
      await expect(
        Proxy__Teleportation.disburseERC20(payload)
      ).to.be.revertedWith('ERC20: transfer amount exceeds allowance')
    })

    it('should not disburse tokens if caller is not disburser', async () => {
      const _amount = ethers.utils.parseEther('100')
      await L2Boba.transfer(signer2Address, _amount)
      const payload = [
        {
          token: L2Boba.address,
          amount: _amount,
          addr: signerAddress,
          sourceChainId: 4,
          depositId: 3,
        },
      ]
      await L2Boba.connect(signer2).approve(
        Proxy__Teleportation.address,
        _amount
      )
      await expect(
        Proxy__Teleportation.connect(signer2).disburseERC20(payload)
      ).to.be.revertedWith('Caller is not the disburser')
    })

    it('should transfer disburser to another wallet', async () => {
      await Proxy__Teleportation.transferDisburser(signer2Address)
      expect(await Proxy__Teleportation.disburser()).to.be.eq(signer2Address)
      await Proxy__Teleportation.connect(signer).transferDisburser(
        signerAddress
      )
    })

    it('should not transfer disburser to another wallet if caller is not owner', async () => {
      await expect(
        Proxy__Teleportation.connect(signer2).transferDisburser(signer2Address)
      ).to.be.revertedWith('Caller is not the owner')
    })

    it('should withdraw BOBA balance', async () => {
      const preSignerBalnce = await L2Boba.balanceOf(signerAddress)
      const preBalance = await L2Boba.balanceOf(Proxy__Teleportation.address)
      await Proxy__Teleportation.withdrawTokenBalance(L2Boba.address)
      const postBalance = await L2Boba.balanceOf(Proxy__Teleportation.address)
      const postSignerBalance = await L2Boba.balanceOf(signerAddress)
      expect(preBalance.sub(postBalance)).to.be.eq(
        postSignerBalance.sub(preSignerBalnce)
      )
      expect(postBalance.toString()).to.be.eq('0')
    })

    it('should not withdraw BOBA balance if caller is not owner', async () => {
      await expect(
        Proxy__Teleportation.connect(signer2).withdrawTokenBalance(
          L2Boba.address
        )
      ).to.be.revertedWith('Caller is not the owner')
    })

    it('should pause contract', async () => {
      await Proxy__Teleportation.pause()
      expect(await Proxy__Teleportation.paused()).to.be.eq(true)
      await expect(Proxy__Teleportation.teleportERC20(L2Boba.address, 1, 4)).to.be.revertedWith(
        'Pausable: paused'
      )
      await expect(Proxy__Teleportation.disburseERC20([])).to.be.revertedWith(
        'Pausable: paused'
      )
    })

    it('should unpause contract', async () => {
      await Proxy__Teleportation.unpause()
      expect(await Proxy__Teleportation.paused()).to.be.eq(false)
      const _amount = ethers.utils.parseEther('100')
      await L2Boba.approve(Proxy__Teleportation.address, _amount)
      await expect(Proxy__Teleportation.teleportERC20(L2Boba.address, _amount, 4))
        .to.emit(Proxy__Teleportation, 'AssetReceived')
        .withArgs(L2Boba.address, 31337, 4, 2, signerAddress, _amount)
      expect((await Proxy__Teleportation.totalDeposits(4)).toString()).to.be.eq(
        '3'
      )
      const payload = [
        {
          token: L2Boba.address,
          amount: _amount,
          addr: signerAddress,
          sourceChainId: 4,
          depositId: 3,
        },
      ]
      await L2Boba.approve(Proxy__Teleportation.address, _amount)
      await expect(Proxy__Teleportation.disburseERC20(payload))
        .to.emit(Proxy__Teleportation, 'DisbursementSuccess')
        .withArgs(3, signerAddress, _amount, 4)
    })
  })

  describe('Alt L2 - BOBA is the native token', () => {
    before(async () => {
      signer = (await ethers.getSigners())[0]
      signer2 = (await ethers.getSigners())[1]
      signerAddress = await signer.getAddress()
      signer2Address = await signer2.getAddress()

      L2Boba = await (
        await ethers.getContractFactory('L1ERC20')
      ).deploy(initialSupply, tokenName, tokenSymbol, 18)

      const Factory__Teleportation = await ethers.getContractFactory(
        'Teleportation'
      )
      Teleportation = await Factory__Teleportation.deploy()
      await Teleportation.deployTransaction.wait()
      const Factory__Proxy__Teleportation = await ethers.getContractFactory(
        'Lib_ResolvedDelegateProxy'
      )
      Proxy__Teleportation = await Factory__Proxy__Teleportation.deploy(
        Teleportation.address
      )
      await Proxy__Teleportation.deployTransaction.wait()
      Proxy__Teleportation = new ethers.Contract(
        Proxy__Teleportation.address,
        Factory__Teleportation.interface,
        signer
      )
      await Proxy__Teleportation.initialize(
        ethers.utils.parseEther('1'),
        ethers.utils.parseEther('100000')
      )
    })

    it('should revert when initialize again', async () => {
      await expect(
        Proxy__Teleportation.initialize(
          ethers.utils.parseEther('1'),
          ethers.utils.parseEther('100000')
        )
      ).to.be.revertedWith('Contract has been initialized')
    })

    it('should add the supported chain', async () => {
      await Proxy__Teleportation.addSupportedChain(4)
      expect(await Proxy__Teleportation.supportedChains(4)).to.eq(true)
    })

    it('should not add the supported chain if it is added', async () => {
      await expect(
        Proxy__Teleportation.addSupportedChain(4)
      ).to.be.revertedWith('Already supported')
    })

    it('should not add the supported chain if caller is not owner', async () => {
      await expect(
        Proxy__Teleportation.connect(signer2).addSupportedChain(4)
      ).to.be.revertedWith('Caller is not the owner')
    })

    it('should remove the supported chain', async () => {
      await Proxy__Teleportation.removeSupportedChain(4)
      expect(await Proxy__Teleportation.supportedChains(4)).to.eq(false)
    })

    it('should not remove if it is already not supported', async () => {
      await expect(
        Proxy__Teleportation.removeSupportedChain(4)
      ).to.be.revertedWith('Already not supported')
    })

    it('should not remove the supported chain if caller is not owner', async () => {
      await expect(
        Proxy__Teleportation.connect(signer2).removeSupportedChain(4)
      ).to.be.revertedWith('Caller is not the owner')
    })

    it('should teleport BOBA tokens and emit event', async () => {
      await Proxy__Teleportation.addSupportedChain(4)
      await Proxy__Teleportation.addSupportedToken(L2Boba.address)
      const _amount = ethers.utils.parseEther('100')
      const preBalance = await ethers.provider.getBalance(signerAddress)
      await expect(
        Proxy__Teleportation.teleportNative(4, { value: _amount })
      )
        .to.emit(Proxy__Teleportation, 'AssetReceived')
        .withArgs(
          ethers.constants.AddressZero,
          31337,
          4,
          0,
          signerAddress,
          _amount
        )
      expect((await Proxy__Teleportation.totalDeposits(4)).toString()).to.be.eq(
        '1'
      )
      expect(
        (await Proxy__Teleportation.transferredAmount()).toString()
      ).to.be.eq(_amount.toString())

      const gasFee = await getGasFeeFromLastestBlock(ethers.provider)

      const postBalance = await ethers.provider.getBalance(signerAddress)
      expect(preBalance.sub(_amount)).to.be.eq(postBalance.add(gasFee))
    })

    it('should not teleport BOBA tokens if the amount exceeds the daily limit', async () => {
      const maxTransferAmountPerDay =
        await Proxy__Teleportation.maxTransferAmountPerDay()
      const _amount = ethers.utils.parseEther('200')
      await Proxy__Teleportation.setMaxTransferAmountPerDay(_amount)
      await expect(
        Proxy__Teleportation.teleportNative(4, {
          value: _amount,
        })
      ).to.be.revertedWith('max amount per day exceeded')
      await Proxy__Teleportation.setMaxTransferAmountPerDay(
        maxTransferAmountPerDay
      )
    })

    it('should reset the transferred amount', async () => {
      await ethers.provider.send('evm_increaseTime', [86400])
      const _amount = ethers.utils.parseEther('1')
      const transferTimestampCheckPoint =
        await Proxy__Teleportation.transferTimestampCheckPoint()
      await L2Boba.approve(Proxy__Teleportation.address, _amount)
      await Proxy__Teleportation.teleportNative(4, {
        value: _amount,
      })
      expect(await Proxy__Teleportation.transferredAmount()).to.be.eq(_amount)
      expect(
        await Proxy__Teleportation.transferTimestampCheckPoint()
      ).to.be.not.eq(transferTimestampCheckPoint)
    })

    it('should revert if _toChainId is not supported', async () => {
      const _amount = ethers.utils.parseEther('10')
      await expect(
        Proxy__Teleportation.teleportNative(100, {
          value: _amount,
        })
      ).to.be.revertedWith('Target chain is not supported')
    })

    it('should disburse BOBA tokens', async () => {
      const preBalance = await ethers.provider.getBalance(
        Proxy__Teleportation.address
      )
      const preSignerBalance = await ethers.provider.getBalance(signerAddress)
      const payload = [
        {
          token: ethers.constants.AddressZero,
          amount: ethers.utils.parseEther('100'),
          addr: signerAddress,
          sourceChainId: 4,
          depositId: 0,
        },
        {
          token: ethers.constants.AddressZero,
          amount: ethers.utils.parseEther('1'),
          addr: signerAddress,
          sourceChainId: 4,
          depositId: 1,
        },
      ]
      await Proxy__Teleportation.disburseNative(payload, {
        value: ethers.utils.parseEther('101'),
      })
      const postBalance = await ethers.provider.getBalance(
        Proxy__Teleportation.address
      )
      const postSignerBalance = await ethers.provider.getBalance(signerAddress)
      const gasFee = await getGasFeeFromLastestBlock(ethers.provider)

      expect(
        (await Proxy__Teleportation.totalDisbursements(4)).toString()
      ).to.be.eq('2')
      expect(preBalance).to.be.eq(postBalance)
      expect(postSignerBalance).to.be.eq(preSignerBalance.sub(gasFee))
    })

    it('should disburse BOBA tokens and emit events', async () => {
      const _amount = ethers.utils.parseEther('100')
      const payload = [
        {
          token: ethers.constants.AddressZero,
          amount: _amount,
          addr: signerAddress,
          sourceChainId: 4,
          depositId: 2,
        },
      ]
      await expect(
        Proxy__Teleportation.disburseNative(payload, { value: _amount })
      )
        .to.emit(Proxy__Teleportation, 'DisbursementSuccess')
        .withArgs(2, signerAddress, _amount, 4)
    })

    it('should not disburse BOBA tokens if the depositId is wrong', async () => {
      const _amount = ethers.utils.parseEther('100')
      const payload = [
        {
          token: ethers.constants.AddressZero,
          amount: _amount,
          addr: signerAddress,
          sourceChainId: 4,
          depositId: 4,
        },
      ]
      await expect(
        Proxy__Teleportation.disburseNative(payload, { value: _amount })
      ).to.be.revertedWith('Unexpected next deposit id')
    })

    it('should not disburse tokens if msg.value is wrong', async () => {
      const _amount = ethers.utils.parseEther('101')
      const payload = [
        {
          token: ethers.constants.AddressZero,
          amount: _amount,
          addr: signerAddress,
          sourceChainId: 4,
          depositId: 3,
        },
      ]
      await expect(
        Proxy__Teleportation.disburseNative(payload, { value: '1' })
      ).to.be.revertedWith('Disbursement total != amount sent')
    })

    it('should not disburse tokens if caller is not disburser', async () => {
      const _amount = ethers.utils.parseEther('100')
      const payload = [
        {
          token: ethers.constants.AddressZero,
          amount: _amount,
          addr: signerAddress,
          sourceChainId: 4,
          depositId: 3,
        },
      ]
      await expect(
        Proxy__Teleportation.connect(signer2).disburseNative(payload, {
          value: _amount,
        })
      ).to.be.revertedWith('Caller is not the disburser')
    })

    it('should transfer disburser to another wallet', async () => {
      await Proxy__Teleportation.transferDisburser(signer2Address)
      expect(await Proxy__Teleportation.disburser()).to.be.eq(signer2Address)
      await Proxy__Teleportation.connect(signer).transferDisburser(
        signerAddress
      )
    })

    it('should not transfer disburser to another wallet if caller is not owner', async () => {
      await expect(
        Proxy__Teleportation.connect(signer2).transferDisburser(signer2Address)
      ).to.be.revertedWith('Caller is not the owner')
    })

    it('should withdraw BOBA balance', async () => {
      const preSignerBalnce = await ethers.provider.getBalance(signerAddress)
      const preBalance = await ethers.provider.getBalance(
        Proxy__Teleportation.address
      )
      await Proxy__Teleportation.withdrawNativeBalance()
      const postBalance = await ethers.provider.getBalance(
        Proxy__Teleportation.address
      )
      const postSignerBalance = await ethers.provider.getBalance(signerAddress)
      const gasFee = await getGasFeeFromLastestBlock(ethers.provider)
      expect(preBalance.sub(postBalance)).to.be.eq(
        postSignerBalance.sub(preSignerBalnce).add(gasFee)
      )
      expect(postBalance.toString()).to.be.eq('0')
    })

    it('should not withdraw BOBA balance if caller is not owner', async () => {
      await expect(
        Proxy__Teleportation.connect(signer2).withdrawNativeBalance()
      ).to.be.revertedWith('Caller is not the owner')
    })

    it('should pause contract', async () => {
      await Proxy__Teleportation.pause()
      expect(await Proxy__Teleportation.paused()).to.be.eq(true)
      await expect(
        Proxy__Teleportation.teleportNative(4, { value: 1 })
      ).to.be.revertedWith('Pausable: paused')
      await expect(
        Proxy__Teleportation.disburseNative([])
      ).to.be.revertedWith('Pausable: paused')
    })

    it('should unpause contract', async () => {
      await Proxy__Teleportation.unpause()
      expect(await Proxy__Teleportation.paused()).to.be.eq(false)
      const _amount = ethers.utils.parseEther('100')
      await L2Boba.approve(Proxy__Teleportation.address, _amount)
      await expect(
        Proxy__Teleportation.teleportNative(4, { value: _amount })
      )
        .to.emit(Proxy__Teleportation, 'AssetReceived')
        .withArgs(
          ethers.constants.AddressZero,
          31337,
          4,
          2,
          signerAddress,
          _amount
        )
      expect((await Proxy__Teleportation.totalDeposits(4)).toString()).to.be.eq(
        '3'
      )
      const payload = [
        {
          token: ethers.constants.AddressZero,
          amount: _amount,
          addr: signerAddress,
          sourceChainId: 4,
          depositId: 3,
        },
      ]
      await L2Boba.approve(Proxy__Teleportation.address, _amount)
      await expect(
        Proxy__Teleportation.disburseNative(payload, { value: _amount })
      )
        .to.emit(Proxy__Teleportation, 'DisbursementSuccess')
        .withArgs(3, signerAddress, _amount, 4)
    })
  })

  describe('Alt L2 - Failed Disbursements', () => {
    let PausedReceiver: Contract

    before(async () => {
      signer = (await ethers.getSigners())[0]
      signer2 = (await ethers.getSigners())[1]
      signerAddress = await signer.getAddress()
      signer2Address = await signer2.getAddress()

      L2Boba = await (
        await ethers.getContractFactory('L1ERC20')
      ).deploy(initialSupply, tokenName, tokenSymbol, 18)

      const Factory__Teleportation = await ethers.getContractFactory(
        'Teleportation'
      )
      Teleportation = await Factory__Teleportation.deploy()
      await Teleportation.deployTransaction.wait()
      const Factory__Proxy__Teleportation = await ethers.getContractFactory(
        'Lib_ResolvedDelegateProxy'
      )
      Proxy__Teleportation = await Factory__Proxy__Teleportation.deploy(
        Teleportation.address
      )
      await Proxy__Teleportation.deployTransaction.wait()
      Proxy__Teleportation = new ethers.Contract(
        Proxy__Teleportation.address,
        Factory__Teleportation.interface,
        signer
      )
      await Proxy__Teleportation.initialize(
        ethers.utils.parseEther('1'),
        ethers.utils.parseEther('100000')
      )
    })

    it('should emit events when disbursement of BOBA tokens fail', async () => {
      await Proxy__Teleportation.addSupportedChain(4)
      await Proxy__Teleportation.addSupportedToken(L2Boba.address)
      const Factory__PausedReceiver = await ethers.getContractFactory(
        'PausedReceiver'
      )
      PausedReceiver = await Factory__PausedReceiver.deploy()
      await PausedReceiver.setPauseStatus(true)
      expect(
        await ethers.provider.getBalance(Proxy__Teleportation.address)
      ).to.be.eq(0)
      const _amount = ethers.utils.parseEther('100')
      const payload = [
        {
          token: ethers.constants.AddressZero,
          amount: _amount,
          addr: PausedReceiver.address, //tweaking recipient address to an address that cannot receive native tokens
          sourceChainId: 4,
          depositId: 0,
        },
      ]
      await expect(
        Proxy__Teleportation.disburseNative(payload, { value: _amount })
      )
        .to.emit(Proxy__Teleportation, 'DisbursementFailed')
        .withArgs(0, PausedReceiver.address, _amount, 4)

      const failedDisbursement =
        await Proxy__Teleportation.failedNativeDisbursements(0)
      expect(failedDisbursement.failed).to.be.eq(true)
      expect(failedDisbursement.disbursement.amount).to.be.eq(_amount)
      expect(failedDisbursement.disbursement.addr).to.be.eq(
        PausedReceiver.address
      )
      expect(failedDisbursement.disbursement.sourceChainId).to.be.eq(4)
      expect(failedDisbursement.disbursement.depositId).to.be.eq(0)
      expect(
        await ethers.provider.getBalance(Proxy__Teleportation.address)
      ).to.be.eq(_amount)
    })

    it('should not be able to retry incorrect Disbursements', async () => {
      await PausedReceiver.setPauseStatus(false)
      await expect(
        Proxy__Teleportation.retryDisburseNative([1])
      ).to.be.revertedWith('DepositId is not a failed disbursement')
    })

    it('should not be able to call from non disburser', async () => {
      await PausedReceiver.setPauseStatus(false)
      await expect(
        Proxy__Teleportation.connect(signer2).retryDisburseNative([0])
      ).to.be.revertedWith('Caller is not the disburser')
    })

    it('should be able to retry failed Disbursements', async () => {
      const _amount = ethers.utils.parseEther('100')
      await PausedReceiver.setPauseStatus(false)
      await expect(Proxy__Teleportation.retryDisburseNative([0]))
        .to.emit(Proxy__Teleportation, 'DisbursementRetrySuccess')
        .withArgs(0, PausedReceiver.address, _amount, 4)

      const failedDisbursement =
        await Proxy__Teleportation.failedNativeDisbursements(0)
      expect(failedDisbursement.failed).to.be.eq(false)
      expect(failedDisbursement.disbursement.amount).to.be.eq(_amount)
      expect(failedDisbursement.disbursement.addr).to.be.eq(
        PausedReceiver.address
      )
      expect(failedDisbursement.disbursement.sourceChainId).to.be.eq(4)
      expect(failedDisbursement.disbursement.depositId).to.be.eq(0)
      expect(
        await ethers.provider.getBalance(Proxy__Teleportation.address)
      ).to.be.eq(0)
      expect(await ethers.provider.getBalance(PausedReceiver.address)).to.be.eq(
        _amount
      )
    })

    it('should not be able to retry an already retried Disbursements', async () => {
      await expect(
        Proxy__Teleportation.retryDisburseNative([0])
      ).to.be.revertedWith('DepositId is not a failed disbursement')
    })

    it('should not be able to retry passed Disbursements', async () => {
      const _amount = ethers.utils.parseEther('100')
      const payload = [
        {
          token: ethers.constants.AddressZero,
          amount: _amount,
          addr: signerAddress,
          sourceChainId: 4,
          depositId: 1,
        },
      ]
      await expect(
        Proxy__Teleportation.disburseNative(payload, { value: _amount })
      )
        .to.emit(Proxy__Teleportation, 'DisbursementSuccess')
        .withArgs(1, signerAddress, _amount, 4)

      await expect(
        Proxy__Teleportation.retryDisburseNative([1])
      ).to.be.revertedWith('DepositId is not a failed disbursement')
    })

    it('should be able to retry a batch of failed disbursements', async () => {
      await PausedReceiver.setPauseStatus(true)
      const _amount = ethers.utils.parseEther('100')
      const payload = [
        {
          token: ethers.constants.AddressZero,
          amount: ethers.utils.parseEther('100'),
          addr: PausedReceiver.address,
          sourceChainId: 4,
          depositId: 2,
        },
        {
          token: ethers.constants.AddressZero,
          amount: ethers.utils.parseEther('1'),
          addr: PausedReceiver.address,
          sourceChainId: 4,
          depositId: 3,
        },
      ]
      await expect(
        Proxy__Teleportation.disburseNative(payload, {
          value: ethers.utils.parseEther('101'),
        })
      )
        .to.emit(Proxy__Teleportation, 'DisbursementFailed')
        .withArgs(2, PausedReceiver.address, _amount, 4)

      const failedDisbursement =
        await Proxy__Teleportation.failedNativeDisbursements(2)
      expect(failedDisbursement.failed).to.be.eq(true)
      const failedDisbursement2 =
        await Proxy__Teleportation.failedNativeDisbursements(3)
      expect(failedDisbursement2.failed).to.be.eq(true)
      expect(
        await ethers.provider.getBalance(Proxy__Teleportation.address)
      ).to.be.eq(ethers.utils.parseEther('101'))

      const preBalanceReceiver = await ethers.provider.getBalance(
        PausedReceiver.address
      )
      // retry disbursement

      await PausedReceiver.setPauseStatus(false)
      await expect(Proxy__Teleportation.retryDisburseNative([2, 3]))
        .to.emit(Proxy__Teleportation, 'DisbursementRetrySuccess')
        .withArgs(2, PausedReceiver.address, _amount, 4)
        .to.emit(Proxy__Teleportation, 'DisbursementRetrySuccess')
        .withArgs(3, PausedReceiver.address, ethers.utils.parseEther('1'), 4)

      const failedDisbursementRetried1 =
        await Proxy__Teleportation.failedNativeDisbursements(2)
      expect(failedDisbursementRetried1.failed).to.be.eq(false)
      expect(failedDisbursementRetried1.disbursement.amount).to.be.eq(_amount)
      expect(failedDisbursementRetried1.disbursement.addr).to.be.eq(
        PausedReceiver.address
      )
      expect(failedDisbursementRetried1.disbursement.sourceChainId).to.be.eq(4)
      expect(failedDisbursementRetried1.disbursement.depositId).to.be.eq(2)

      const failedDisbursementRetried2 =
        await Proxy__Teleportation.failedNativeDisbursements(3)
      expect(failedDisbursementRetried2.failed).to.be.eq(false)
      expect(failedDisbursementRetried2.disbursement.amount).to.be.eq(
        ethers.utils.parseEther('1')
      )
      expect(failedDisbursementRetried2.disbursement.addr).to.be.eq(
        PausedReceiver.address
      )
      expect(failedDisbursementRetried2.disbursement.sourceChainId).to.be.eq(4)
      expect(failedDisbursementRetried2.disbursement.depositId).to.be.eq(3)
      expect(
        await ethers.provider.getBalance(Proxy__Teleportation.address)
      ).to.be.eq(0)
      expect(await ethers.provider.getBalance(PausedReceiver.address)).to.be.eq(
        preBalanceReceiver.add(ethers.utils.parseEther('101'))
      )
    })
  })

  describe('Admin tests', () => {
    before(async () => {
      signer = (await ethers.getSigners())[0]
      signer2 = (await ethers.getSigners())[1]
      signerAddress = await signer.getAddress()
      signer2Address = await signer2.getAddress()

      L2Boba = await (
        await ethers.getContractFactory('L1ERC20')
      ).deploy(initialSupply, tokenName, tokenSymbol, 18)

      const Factory__Teleportation = await ethers.getContractFactory(
        'Teleportation'
      )
      Teleportation = await Factory__Teleportation.deploy()
      await Teleportation.deployTransaction.wait()
      const Factory__Proxy__Teleportation = await ethers.getContractFactory(
        'Lib_ResolvedDelegateProxy'
      )
      Proxy__Teleportation = await Factory__Proxy__Teleportation.deploy(
        Teleportation.address
      )
      await Proxy__Teleportation.deployTransaction.wait()
      Proxy__Teleportation = new ethers.Contract(
        Proxy__Teleportation.address,
        Factory__Teleportation.interface,
        signer
      )
      await Proxy__Teleportation.initialize(
        ethers.utils.parseEther('1'),
        ethers.utils.parseEther('100000')
      )
    })

    it('should transferOwnership', async () => {
      await Proxy__Teleportation.transferOwnership(signer2Address)
      expect(await Proxy__Teleportation.owner()).to.be.eq(signer2Address)
      await Proxy__Teleportation.connect(signer2).transferOwnership(
        signerAddress
      )
    })

    it('should not transferOwnership if caller is not owner', async () => {
      await expect(
        Proxy__Teleportation.connect(signer2).transferOwnership(signer2Address)
      ).to.be.revertedWith('Caller is not the owner')
    })

    it('should not set minimum amount if caller is not owner', async () => {
      const maxAmount = await Proxy__Teleportation.maxDepositAmount()
      await expect(
        Proxy__Teleportation.setMinAmount(maxAmount.add(1))
      ).to.be.revertedWith('incorrect min deposit amount')
    })

    it('should set minimum amount', async () => {
      await Proxy__Teleportation.setMinAmount(ethers.utils.parseEther('1'))
      expect(
        (await Proxy__Teleportation.minDepositAmount()).toString()
      ).to.be.eq(ethers.utils.parseEther('1'))
    })

    it('should not set minimum amount if caller is not owner', async () => {
      await expect(
        Proxy__Teleportation.connect(signer2).setMinAmount(
          ethers.utils.parseEther('1')
        )
      ).to.be.revertedWith('Caller is not the owner')
    })

    it('should not set maximum amount if caller is not owner', async () => {
      const minAmount = await Proxy__Teleportation.minDepositAmount()
      await expect(
        Proxy__Teleportation.setMaxAmount(minAmount.sub(1))
      ).to.be.revertedWith('incorrect max deposit amount')
    })

    it('should set maximum amount', async () => {
      await Proxy__Teleportation.setMaxAmount(ethers.utils.parseEther('1'))
      expect(
        (await Proxy__Teleportation.maxDepositAmount()).toString()
      ).to.be.eq(ethers.utils.parseEther('1'))
    })

    it('should not set maximum amount if caller is not owner', async () => {
      await expect(
        Proxy__Teleportation.connect(signer2).setMaxAmount(
          ethers.utils.parseEther('1')
        )
      ).to.be.revertedWith('Caller is not the owner')
    })

    it('should set daily limit', async () => {
      await Proxy__Teleportation.setMaxTransferAmountPerDay(
        ethers.utils.parseEther('1')
      )
      expect(
        (await Proxy__Teleportation.maxTransferAmountPerDay()).toString()
      ).to.be.eq(ethers.utils.parseEther('1'))
    })

    it('should not set daily limit if caller is not owner', async () => {
      await expect(
        Proxy__Teleportation.connect(signer2).setMaxTransferAmountPerDay(
          ethers.utils.parseEther('1')
        )
      ).to.be.revertedWith('Caller is not the owner')
    })
  })

  describe('Init tests', () => {
    before(async () => {
      signer = (await ethers.getSigners())[0]
      signer2 = (await ethers.getSigners())[1]
      signerAddress = await signer.getAddress()
      signer2Address = await signer2.getAddress()

      L2Boba = await (
        await ethers.getContractFactory('L1ERC20')
      ).deploy(initialSupply, tokenName, tokenSymbol, 18)

      const Factory__Teleportation = await ethers.getContractFactory(
        'Teleportation'
      )
      Teleportation = await Factory__Teleportation.deploy()
      await Teleportation.deployTransaction.wait()
      const Factory__Proxy__Teleportation = await ethers.getContractFactory(
        'Lib_ResolvedDelegateProxy'
      )
      Proxy__Teleportation = await Factory__Proxy__Teleportation.deploy(
        Teleportation.address
      )
      await Proxy__Teleportation.deployTransaction.wait()
      Proxy__Teleportation = new ethers.Contract(
        Proxy__Teleportation.address,
        Factory__Teleportation.interface,
        signer
      )
    })

    it('should not be able to set incorrect init values', async () => {
      await expect(
        Proxy__Teleportation.initialize(
          ethers.utils.parseEther('1'),
          ethers.utils.parseEther('10000000000')
        )
      ).to.be.revertedWith('max deposit amount cannot be more than daily limit')
    })
  })
})
