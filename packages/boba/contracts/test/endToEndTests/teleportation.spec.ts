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

describe('BOBA Teleportation', async () => {
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
        L2Boba.address,
        ethers.utils.parseEther('1'),
        ethers.utils.parseEther('10000000000')
      )
    })

    it('should revert when initialize again', async () => {
      await expect(
        Proxy__Teleportation.initialize(
          L2Boba.address,
          ethers.utils.parseEther('1'),
          ethers.utils.parseEther('10000000000')
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
      ).to.be.revertedWith('Chain is already supported')
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
      ).to.be.revertedWith('Chain is already not supported')
    })

    it('should not remove the supported chain if caller is not owner', async () => {
      await expect(
        Proxy__Teleportation.connect(signer2).removeSupportedChain(4)
      ).to.be.revertedWith('Caller is not the owner')
    })

    it('should teleport BOBA tokens and emit event', async () => {
      await Proxy__Teleportation.addSupportedChain(4)
      const _amount = ethers.utils.parseEther('100')
      const preBalance = await L2Boba.balanceOf(signerAddress)
      await L2Boba.approve(Proxy__Teleportation.address, _amount)
      await expect(Proxy__Teleportation.teleportBOBA(_amount, 4))
        .to.emit(Proxy__Teleportation, 'BobaReceived')
        .withArgs(4, 0, signerAddress, _amount)
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
        Proxy__Teleportation.teleportBOBA(_amount, 4)
      ).to.be.revertedWith('max amount per day exceeded')
    })

    it('should reset the transferred amount', async () => {
      await ethers.provider.send('evm_increaseTime', [86400])
      const _amount = ethers.utils.parseEther('1')
      const transferTimestampCheckPoint =
        await Proxy__Teleportation.transferTimestampCheckPoint()
      await L2Boba.approve(Proxy__Teleportation.address, _amount)
      await Proxy__Teleportation.teleportBOBA(_amount, 4)
      expect(await Proxy__Teleportation.transferredAmount()).to.be.eq(_amount)
      expect(
        await Proxy__Teleportation.transferTimestampCheckPoint()
      ).to.be.not.eq(transferTimestampCheckPoint)
    })

    it('should revert if call teleportNativeBOBA function', async () => {
      const _amount = ethers.utils.parseEther('1')
      await L2Boba.approve(Proxy__Teleportation.address, _amount)
      await expect(
        Proxy__Teleportation.teleportNativeBOBA(_amount, 4)
      ).to.be.revertedWith('Only alt L2s can call this function')
    })

    it('should revert if _toChainId is not supported', async () => {
      const _amount = ethers.utils.parseEther('10')
      await L2Boba.approve(Proxy__Teleportation.address, _amount)
      await expect(
        Proxy__Teleportation.teleportBOBA(_amount, 100)
      ).to.be.revertedWith('Target chain is not supported')
    })

    it('should disburse BOBA tokens', async () => {
      const preBalance = await L2Boba.balanceOf(Proxy__Teleportation.address)
      const preSignerBalance = await L2Boba.balanceOf(signerAddress)
      const payload = [
        {
          amount: ethers.utils.parseEther('100'),
          addr: signerAddress,
          sourceChainId: 4,
          depositId: 0,
        },
        {
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
      await Proxy__Teleportation.disburseBOBA(payload)
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
          amount: _amount,
          addr: signerAddress,
          sourceChainId: 4,
          depositId: 2,
        },
      ]
      await L2Boba.approve(Proxy__Teleportation.address, _amount)
      await expect(Proxy__Teleportation.disburseBOBA(payload))
        .to.emit(Proxy__Teleportation, 'DisbursementSuccess')
        .withArgs(2, signerAddress, _amount, 4)
    })

    it('should not disburse BOBA tokens if the depositId is worng', async () => {
      const _amount = ethers.utils.parseEther('100')
      const payload = [
        {
          amount: _amount,
          addr: signerAddress,
          sourceChainId: 4,
          depositId: 4,
        },
      ]
      await L2Boba.approve(Proxy__Teleportation.address, _amount)
      await expect(
        Proxy__Teleportation.disburseBOBA(payload)
      ).to.be.revertedWith('Unexpected next deposit id')
    })

    it('should not disburse tokens if it is not approved', async () => {
      const _amount = ethers.utils.parseEther('101')
      const payload = [
        {
          amount: _amount,
          addr: signerAddress,
          sourceChainId: 4,
          depositId: 3,
        },
      ]
      await expect(
        Proxy__Teleportation.disburseBOBA(payload)
      ).to.be.revertedWith('ERC20: transfer amount exceeds allowance')
    })

    it('should not disburse tokens if caller is not disburser', async () => {
      const _amount = ethers.utils.parseEther('100')
      await L2Boba.transfer(signer2Address, _amount)
      const payload = [
        {
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
        Proxy__Teleportation.connect(signer2).disburseBOBA(payload)
      ).to.be.revertedWith('Caller is not the disburser')
    })

    it('should revert if disburse the native BOBA token', async () => {
      const _amount = ethers.utils.parseEther('100')
      const payload = [
        {
          amount: _amount,
          addr: signerAddress,
          sourceChainId: 4,
          depositId: 3,
        },
      ]
      await expect(
        Proxy__Teleportation.disburseNativeBOBA(payload)
      ).to.be.revertedWith('Only alt L2s can call this function')
    })

    it('should transfer disburser to another wallet', async () => {
      await Proxy__Teleportation.transferDisburser(signer2Address)
      expect(await Proxy__Teleportation.disburser()).to.be.eq(signer2Address)
      await Proxy__Teleportation.connect(signer2).transferDisburser(
        signerAddress
      )
    })

    it('should not transfer disburser to another wallet if caller is not owner', async () => {
      await expect(
        Proxy__Teleportation.connect(signer2).transferDisburser(signer2Address)
      ).to.be.revertedWith('Caller is not the disburser')
    })

    it('should withdraw BOBA balance', async () => {
      const preSignerBalnce = await L2Boba.balanceOf(signerAddress)
      const preBalance = await L2Boba.balanceOf(Proxy__Teleportation.address)
      await Proxy__Teleportation.withdrawBOBABalance()
      const postBalance = await L2Boba.balanceOf(Proxy__Teleportation.address)
      const postSignerBalance = await L2Boba.balanceOf(signerAddress)
      expect(preBalance.sub(postBalance)).to.be.eq(
        postSignerBalance.sub(preSignerBalnce)
      )
      expect(postBalance.toString()).to.be.eq('0')
    })

    it('should not withdraw BOBA balance if caller is not owner', async () => {
      await expect(
        Proxy__Teleportation.connect(signer2).withdrawBOBABalance()
      ).to.be.revertedWith('Caller is not the owner')
    })

    it('should pause contract', async () => {
      await Proxy__Teleportation.pause()
      expect(await Proxy__Teleportation.paused()).to.be.eq(true)
      await expect(Proxy__Teleportation.teleportBOBA(1, 4)).to.be.revertedWith(
        'Pausable: paused'
      )
      await expect(Proxy__Teleportation.disburseBOBA([])).to.be.revertedWith(
        'Pausable: paused'
      )
    })

    it('should unpause contract', async () => {
      await Proxy__Teleportation.unpause()
      expect(await Proxy__Teleportation.paused()).to.be.eq(false)
      const _amount = ethers.utils.parseEther('100')
      await L2Boba.approve(Proxy__Teleportation.address, _amount)
      await expect(Proxy__Teleportation.teleportBOBA(_amount, 4))
        .to.emit(Proxy__Teleportation, 'BobaReceived')
        .withArgs(4, 2, signerAddress, _amount)
      expect((await Proxy__Teleportation.totalDeposits(4)).toString()).to.be.eq(
        '3'
      )
      const payload = [
        {
          amount: _amount,
          addr: signerAddress,
          sourceChainId: 4,
          depositId: 3,
        },
      ]
      await L2Boba.approve(Proxy__Teleportation.address, _amount)
      await expect(Proxy__Teleportation.disburseBOBA(payload))
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
        '0x4200000000000000000000000000000000000006',
        ethers.utils.parseEther('1'),
        ethers.utils.parseEther('10000000000')
      )
    })

    it('should revert when initialize again', async () => {
      await expect(
        Proxy__Teleportation.initialize(
          '0x4200000000000000000000000000000000000006',
          ethers.utils.parseEther('1'),
          ethers.utils.parseEther('10000000000')
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
      ).to.be.revertedWith('Chain is already supported')
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
      ).to.be.revertedWith('Chain is already not supported')
    })

    it('should not remove the supported chain if caller is not owner', async () => {
      await expect(
        Proxy__Teleportation.connect(signer2).removeSupportedChain(4)
      ).to.be.revertedWith('Caller is not the owner')
    })

    it('should teleport BOBA tokens and emit event', async () => {
      await Proxy__Teleportation.addSupportedChain(4)
      const _amount = ethers.utils.parseEther('100')
      const preBalance = await ethers.provider.getBalance(signerAddress)
      await expect(
        Proxy__Teleportation.teleportNativeBOBA(_amount, 4, { value: _amount })
      )
        .to.emit(Proxy__Teleportation, 'BobaReceived')
        .withArgs(4, 0, signerAddress, _amount)
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
        Proxy__Teleportation.teleportNativeBOBA(_amount, 4, {
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
      await Proxy__Teleportation.teleportNativeBOBA(_amount, 4, {
        value: _amount,
      })
      expect(await Proxy__Teleportation.transferredAmount()).to.be.eq(_amount)
      expect(
        await Proxy__Teleportation.transferTimestampCheckPoint()
      ).to.be.not.eq(transferTimestampCheckPoint)
    })

    it('should revert if call teleportBOBA function', async () => {
      const _amount = ethers.utils.parseEther('1')
      await expect(
        Proxy__Teleportation.teleportBOBA(_amount, 4)
      ).to.be.revertedWith('Only not alt L2s can call this function')
    })

    it('should revert if msg.value is wrong', async () => {
      await expect(
        Proxy__Teleportation.teleportNativeBOBA(
          ethers.utils.parseEther('20'),
          4,
          { value: ethers.utils.parseEther('30') }
        )
      ).to.be.revertedWith('Amount does not match msg.value')
    })

    it('should revert if _toChainId is not supported', async () => {
      const _amount = ethers.utils.parseEther('10')
      await expect(
        Proxy__Teleportation.teleportNativeBOBA(_amount, 100, {
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
          amount: ethers.utils.parseEther('100'),
          addr: signerAddress,
          sourceChainId: 4,
          depositId: 0,
        },
        {
          amount: ethers.utils.parseEther('1'),
          addr: signerAddress,
          sourceChainId: 4,
          depositId: 1,
        },
      ]
      await Proxy__Teleportation.disburseNativeBOBA(payload, {
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
          amount: _amount,
          addr: signerAddress,
          sourceChainId: 4,
          depositId: 2,
        },
      ]
      await expect(
        Proxy__Teleportation.disburseNativeBOBA(payload, { value: _amount })
      )
        .to.emit(Proxy__Teleportation, 'DisbursementSuccess')
        .withArgs(2, signerAddress, _amount, 4)
    })

    it('should not disburse BOBA tokens if the depositId is worng', async () => {
      const _amount = ethers.utils.parseEther('100')
      const payload = [
        {
          amount: _amount,
          addr: signerAddress,
          sourceChainId: 4,
          depositId: 4,
        },
      ]
      await expect(
        Proxy__Teleportation.disburseNativeBOBA(payload, { value: _amount })
      ).to.be.revertedWith('Unexpected next deposit id')
    })

    it('should not disburse tokens if msg.value is wrong', async () => {
      const _amount = ethers.utils.parseEther('101')
      const payload = [
        {
          amount: _amount,
          addr: signerAddress,
          sourceChainId: 4,
          depositId: 3,
        },
      ]
      await expect(
        Proxy__Teleportation.disburseNativeBOBA(payload, { value: '1' })
      ).to.be.revertedWith('Disbursement total != amount sent')
    })

    it('should not disburse tokens if caller is not disburser', async () => {
      const _amount = ethers.utils.parseEther('100')
      const payload = [
        {
          amount: _amount,
          addr: signerAddress,
          sourceChainId: 4,
          depositId: 3,
        },
      ]
      await expect(
        Proxy__Teleportation.connect(signer2).disburseNativeBOBA(payload, {
          value: _amount,
        })
      ).to.be.revertedWith('Caller is not the disburser')
    })

    it('should transfer disburser to another wallet', async () => {
      await Proxy__Teleportation.transferDisburser(signer2Address)
      expect(await Proxy__Teleportation.disburser()).to.be.eq(signer2Address)
      await Proxy__Teleportation.connect(signer2).transferDisburser(
        signerAddress
      )
    })

    it('should not transfer disburser to another wallet if caller is not owner', async () => {
      await expect(
        Proxy__Teleportation.connect(signer2).transferDisburser(signer2Address)
      ).to.be.revertedWith('Caller is not the disburser')
    })

    it('should withdraw BOBA balance', async () => {
      const preSignerBalnce = await ethers.provider.getBalance(signerAddress)
      const preBalance = await ethers.provider.getBalance(
        Proxy__Teleportation.address
      )
      await Proxy__Teleportation.withdrawNativeBOBABalance()
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
        Proxy__Teleportation.connect(signer2).withdrawNativeBOBABalance()
      ).to.be.revertedWith('Caller is not the owner')
    })

    it('should pause contract', async () => {
      await Proxy__Teleportation.pause()
      expect(await Proxy__Teleportation.paused()).to.be.eq(true)
      await expect(
        Proxy__Teleportation.teleportNativeBOBA(1, 4, { value: 1 })
      ).to.be.revertedWith('Pausable: paused')
      await expect(
        Proxy__Teleportation.disburseNativeBOBA([])
      ).to.be.revertedWith('Pausable: paused')
    })

    it('should unpause contract', async () => {
      await Proxy__Teleportation.unpause()
      expect(await Proxy__Teleportation.paused()).to.be.eq(false)
      const _amount = ethers.utils.parseEther('100')
      await L2Boba.approve(Proxy__Teleportation.address, _amount)
      await expect(
        Proxy__Teleportation.teleportNativeBOBA(_amount, 4, { value: _amount })
      )
        .to.emit(Proxy__Teleportation, 'BobaReceived')
        .withArgs(4, 2, signerAddress, _amount)
      expect((await Proxy__Teleportation.totalDeposits(4)).toString()).to.be.eq(
        '3'
      )
      const payload = [
        {
          amount: _amount,
          addr: signerAddress,
          sourceChainId: 4,
          depositId: 3,
        },
      ]
      await L2Boba.approve(Proxy__Teleportation.address, _amount)
      await expect(
        Proxy__Teleportation.disburseNativeBOBA(payload, { value: _amount })
      )
        .to.emit(Proxy__Teleportation, 'DisbursementSuccess')
        .withArgs(3, signerAddress, _amount, 4)
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
        L2Boba.address,
        ethers.utils.parseEther('1'),
        ethers.utils.parseEther('10000000000')
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
})
