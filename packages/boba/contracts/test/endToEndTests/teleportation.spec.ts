import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
import { ethers } from 'hardhat'
import { Contract, Signer, BigNumber, utils } from 'ethers'

let L2Boba: Contract
let RandomERC20: Contract
let Teleportation: Contract
let Proxy__Teleportation: Contract

let signer: Signer
let signer2: Signer
let signerAddress: string
let signer2Address: string

const chainId4 = '4'
const initialSupply = utils.parseEther('10000000000')
const tokenName = 'BOBA'
const tokenSymbol = 'BOBA'
const defaultMinDepositAmount = ethers.utils.parseEther('1')
const defaultMaxDepositAmount = ethers.utils.parseEther('100000')
const defaultMaxDailyLimit = ethers.utils.parseEther('100000')

const getGasFeeFromLastestBlock = async (provider: any): Promise<BigNumber> => {
  const blockNumber = await provider.getBlockNumber()
  const block = await provider.getBlock(blockNumber)
  const gasUsed = block.gasUsed
  const txHash = block.transactions[0]
  const tx = await provider.getTransaction(txHash)
  const gasPrice = tx.gasPrice
  return gasUsed.mul(gasPrice)
}

describe('Asset Teleportation Tests', async () => {
  describe('Teleport asset tests', async () => {
    beforeEach(async () => {
      await Proxy__Teleportation.addSupportedToken(
        L2Boba.address,
        defaultMinDepositAmount,
        defaultMaxDepositAmount,
        defaultMaxDailyLimit
      )
      let supToken = await Proxy__Teleportation.supportedTokens(L2Boba.address)
      expect(supToken[0]).to.eq(true)
      expect(supToken[1]).to.eq(defaultMinDepositAmount)
      expect(supToken[2]).to.eq(defaultMaxDepositAmount)
      expect(supToken[3]).to.eq(defaultMaxDailyLimit)

      await Proxy__Teleportation.addSupportedToken(
        RandomERC20.address,
        defaultMinDepositAmount,
        defaultMaxDepositAmount,
        defaultMaxDailyLimit
      )
      supToken = await Proxy__Teleportation.supportedTokens(RandomERC20.address)
      expect(supToken[0]).to.eq(true)
      expect(supToken[1]).to.eq(defaultMinDepositAmount)
      expect(supToken[2]).to.eq(defaultMaxDepositAmount)
      expect(supToken[3]).to.eq(defaultMaxDailyLimit)

      await Proxy__Teleportation.addSupportedChain(4)
      const chain = await Proxy__Teleportation.supportedChains(4)
      expect(chain).to.be.equal(true)
    })

    afterEach(async () => {
      await Proxy__Teleportation.removeSupportedToken(L2Boba.address)
      let supToken = await Proxy__Teleportation.supportedTokens(L2Boba.address)
      expect(supToken[0]).to.eq(false)
      expect(supToken[1]).to.eq('0')
      expect(supToken[2]).to.eq('0')
      expect(supToken[3]).to.eq('0')

      await Proxy__Teleportation.removeSupportedToken(RandomERC20.address)
      supToken = await Proxy__Teleportation.supportedTokens(RandomERC20.address)
      expect(supToken[0]).to.eq(false)
      expect(supToken[1]).to.eq('0')
      expect(supToken[2]).to.eq('0')
      expect(supToken[3]).to.eq('0')

      await Proxy__Teleportation.removeSupportedChain(4)
      const chain = await Proxy__Teleportation.supportedChains(4)
      expect(chain).to.be.equal(false)
    })

    describe('Ethereum L2 - BOBA is not the native token', () => {
      before(async () => {
        signer = (await ethers.getSigners())[0]
        signer2 = (await ethers.getSigners())[1]
        signerAddress = await signer.getAddress()
        signer2Address = await signer2.getAddress()

        L2Boba = await (
          await ethers.getContractFactory('L1ERC20')
        ).deploy(initialSupply, tokenName, tokenSymbol, 18)

        RandomERC20 = await (
          await ethers.getContractFactory('L1ERC20')
        ).deploy(initialSupply, 'Random Token', 'RTN', 9)

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

      it('should not add the supported chain if it is added', async () => {
        await expect(
          Proxy__Teleportation.addSupportedChain(4)
        ).to.be.revertedWith('Already supported')
      })

      it('should add supported token if it is zero address (equals native)', async () => {
        // by default added
        await Proxy__Teleportation.removeSupportedToken(
          ethers.constants.AddressZero
        )
        const rmToken = await Proxy__Teleportation.supportedTokens(
          ethers.constants.AddressZero
        )
        expect(rmToken[0]).to.eq(false)

        await Proxy__Teleportation.addSupportedToken(
          ethers.constants.AddressZero,
          defaultMinDepositAmount,
          defaultMaxDepositAmount,
          defaultMaxDailyLimit
        )
        const supToken = await Proxy__Teleportation.supportedTokens(
          ethers.constants.AddressZero
        )

        expect(supToken[0]).to.eq(true)
        expect(supToken[1]).to.eq(defaultMinDepositAmount)
        expect(supToken[2]).to.eq(defaultMaxDepositAmount)

        // keep as default
      })

      it('should not add supported token if it is not a contract address', async () => {
        await expect(
          Proxy__Teleportation.addSupportedToken(
            signerAddress,
            defaultMinDepositAmount,
            defaultMaxDepositAmount,
            defaultMaxDailyLimit
          )
        ).to.be.revertedWith('Not a contract or native')
      })

      it('should not add supported token if it is already added', async () => {
        const addToken = await Proxy__Teleportation.supportedTokens(
          L2Boba.address
        )
        expect(addToken[0]).to.eq(true)

        await expect(
          Proxy__Teleportation.addSupportedToken(
            L2Boba.address,
            defaultMinDepositAmount,
            defaultMaxDepositAmount,
            defaultMaxDailyLimit
          )
        ).to.be.revertedWith('Already supported')
      })

      it('should not add the supported chain if caller is not owner', async () => {
        await expect(
          Proxy__Teleportation.connect(signer2).addSupportedChain(4)
        ).to.be.revertedWith('Caller is not the owner')
      })

      it('should not add supported token if caller is not owner', async () => {
        await expect(
          Proxy__Teleportation.connect(signer2).addSupportedToken(
            L2Boba.address,
            defaultMinDepositAmount,
            defaultMaxDepositAmount,
            defaultMaxDailyLimit
          )
        ).to.be.revertedWith('Caller is not the owner')
      })

      it('should not remove chain if it is already not supported', async () => {
        await Proxy__Teleportation.removeSupportedChain(4)
        await expect(
          Proxy__Teleportation.removeSupportedChain(4)
        ).to.be.revertedWith('Already not supported')
        Proxy__Teleportation.addSupportedChain(4)
      })

      it('should not remove token if it is already not supported', async () => {
        await Proxy__Teleportation.removeSupportedToken(L2Boba.address)
        await expect(
          Proxy__Teleportation.removeSupportedToken(L2Boba.address)
        ).to.be.revertedWith('Already not supported')
        await Proxy__Teleportation.addSupportedToken(
          L2Boba.address,
          defaultMinDepositAmount,
          defaultMaxDepositAmount,
          defaultMaxDailyLimit
        )
      })

      it('should remove token if it is zero address', async () => {
        await Proxy__Teleportation.removeSupportedToken(
          ethers.constants.AddressZero
        )

        let supToken = await Proxy__Teleportation.supportedTokens(
          ethers.constants.AddressZero
        )
        expect(supToken[0]).to.eq(false)
        expect(supToken[1]).to.eq('0')
        expect(supToken[2]).to.eq('0')

        await Proxy__Teleportation.addSupportedToken(
          ethers.constants.AddressZero,
          defaultMinDepositAmount,
          defaultMaxDepositAmount,
          defaultMaxDailyLimit
        )

        supToken = await Proxy__Teleportation.supportedTokens(
          ethers.constants.AddressZero
        )
        // added by default
        expect(supToken[0]).to.eq(true)
      })

      it('should not remove the supported chain if caller is not owner', async () => {
        await expect(
          Proxy__Teleportation.connect(signer2).removeSupportedChain(4)
        ).to.be.revertedWith('Caller is not the owner')
      })

      it('should not remove the supported token if caller is not owner', async () => {
        await expect(
          Proxy__Teleportation.connect(signer2).removeSupportedToken(
            L2Boba.address
          )
        ).to.be.revertedWith('Caller is not the owner')
      })

      it('should teleport BOBA tokens and emit event', async () => {
        const _amount = ethers.utils.parseEther('200')
        const preBalance = await L2Boba.balanceOf(signerAddress)
        await L2Boba.approve(Proxy__Teleportation.address, _amount)
        await expect(
          Proxy__Teleportation.teleportAsset(L2Boba.address, _amount, 4)
        )
          .to.emit(Proxy__Teleportation, 'AssetReceived')
          .withArgs(L2Boba.address, 31337, 4, 0, signerAddress, _amount)
        expect(
          (await Proxy__Teleportation.totalDeposits(4)).toString()
        ).to.be.eq('1')
        expect(
          (
            await Proxy__Teleportation.supportedTokens(L2Boba.address)
          ).transferredAmount.toString()
        ).to.be.eq(_amount.toString())
        const postBalance = await L2Boba.balanceOf(signerAddress)
        expect(preBalance.sub(_amount)).to.be.eq(postBalance)
      })

      it('should teleport random tokens and emit event', async () => {
        const _amount = ethers.utils.parseEther('100')
        const preBalance = await RandomERC20.balanceOf(signerAddress)
        await RandomERC20.approve(Proxy__Teleportation.address, _amount)
        await expect(
          Proxy__Teleportation.teleportAsset(RandomERC20.address, _amount, 4)
        )
          .to.emit(Proxy__Teleportation, 'AssetReceived')
          .withArgs(RandomERC20.address, 31337, 4, 1, signerAddress, _amount)
        expect(
          (await Proxy__Teleportation.totalDeposits(4)).toString()
        ).to.be.eq('2')
        expect(
          (
            await Proxy__Teleportation.supportedTokens(RandomERC20.address)
          ).transferredAmount.toString()
        ).to.be.eq(ethers.utils.parseEther('100').toString())
        const postBalance = await RandomERC20.balanceOf(signerAddress)
        expect(preBalance.sub(_amount)).to.be.eq(postBalance)
      })

      it('should not teleport BOBA tokens if the amount exceeds the daily limit', async () => {
        const _minAmount = ethers.utils.parseEther('0.11')
        await Proxy__Teleportation.setMinAmount(L2Boba.address, _minAmount)
        await L2Boba.approve(Proxy__Teleportation.address, _minAmount)
        await Proxy__Teleportation.teleportAsset(
          L2Boba.address,
          _minAmount,
          chainId4
        )
        const _amount = ethers.utils.parseEther('0.9')
        await Proxy__Teleportation.setMaxAmount(L2Boba.address, _amount)
        await Proxy__Teleportation.setMaxTransferAmountPerDay(
          L2Boba.address,
          ethers.utils.parseEther('1')
        )

        await L2Boba.approve(Proxy__Teleportation.address, _amount)
        await expect(
          Proxy__Teleportation.teleportAsset(L2Boba.address, _amount, chainId4)
        ).to.be.revertedWith('max amount per day exceeded')

        await Proxy__Teleportation.setMaxTransferAmountPerDay(
          L2Boba.address,
          defaultMaxDailyLimit
        )
        await Proxy__Teleportation.setMaxAmount(
          L2Boba.address,
          defaultMaxDepositAmount
        )
        await Proxy__Teleportation.setMinAmount(
          L2Boba.address,
          defaultMinDepositAmount
        )
      })

      it('should reset the transferred amount', async () => {
        await ethers.provider.send('evm_increaseTime', [86400])
        const _amount = ethers.utils.parseEther('1')
        const transferTimestampCheckPoint = (
          await Proxy__Teleportation.supportedTokens(L2Boba.address)
        ).transferTimestampCheckPoint
        await L2Boba.approve(Proxy__Teleportation.address, _amount)
        await Proxy__Teleportation.teleportAsset(L2Boba.address, _amount, 4)
        expect(
          (await Proxy__Teleportation.supportedTokens(L2Boba.address))
            .transferredAmount
        ).to.be.eq(_amount)
        expect(
          (await Proxy__Teleportation.supportedTokens(L2Boba.address))
            .transferTimestampCheckPoint
        ).to.be.not.eq(transferTimestampCheckPoint)
      })

      it('should revert if _toChainId is not supported', async () => {
        const _amount = ethers.utils.parseEther('10')
        await L2Boba.approve(Proxy__Teleportation.address, _amount)
        await expect(
          Proxy__Teleportation.teleportAsset(L2Boba.address, _amount, 100)
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
        await Proxy__Teleportation.disburseAsset(payload)
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
        await expect(Proxy__Teleportation.disburseAsset(payload))
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
          Proxy__Teleportation.disburseAsset(payload)
        ).to.be.revertedWith('Unexpected next deposit id')
      })

      it('should not disburse BOBA tokens if disbursement is native/zero address', async () => {
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
        await L2Boba.approve(Proxy__Teleportation.address, _amount)
        await expect(
          Proxy__Teleportation.disburseAsset(payload)
        ).to.be.revertedWith('Disbursement total != amount sent')
      })

      it('should not disburse ERC20 tokens if any disbursement is native/zero address', async () => {
        const _amount = ethers.utils.parseEther('100')
        const payload = [
          {
            token: L2Boba.address,
            amount: _amount,
            addr: signerAddress,
            sourceChainId: 4,
            depositId: 3,
          },
          {
            token: ethers.constants.AddressZero,
            amount: _amount,
            addr: signerAddress,
            sourceChainId: 4,
            depositId: 4,
          },
        ]
        await L2Boba.approve(Proxy__Teleportation.address, _amount)
        await expect(
          Proxy__Teleportation.disburseAsset(payload)
        ).to.be.revertedWith('Disbursement total != amount sent')
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
          Proxy__Teleportation.disburseAsset(payload)
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
          Proxy__Teleportation.connect(signer2).disburseAsset(payload)
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
          Proxy__Teleportation.connect(signer2).transferDisburser(
            signer2Address
          )
        ).to.be.revertedWith('Caller is not the owner')
      })

      it('should withdraw ERC20 balance', async () => {
        const preSignerBalnce = await L2Boba.balanceOf(signerAddress)
        const preBalance = await L2Boba.balanceOf(Proxy__Teleportation.address)
        await expect(Proxy__Teleportation.withdrawBalance(L2Boba.address))
          .to.emit(Proxy__Teleportation, 'AssetBalanceWithdrawn')
          .withArgs(L2Boba.address, signerAddress, preBalance)

        const postBalance = await L2Boba.balanceOf(Proxy__Teleportation.address)
        const postSignerBalance = await L2Boba.balanceOf(signerAddress)
        expect(preBalance.sub(postBalance)).to.be.eq(
          postSignerBalance.sub(preSignerBalnce)
        )
        expect(postBalance.toString()).to.be.eq('0')
      })

      it('should not withdraw ERC20 balance if caller is not owner', async () => {
        await expect(
          Proxy__Teleportation.connect(signer2).withdrawBalance(L2Boba.address)
        ).to.be.revertedWith('Caller is not the owner')
      })

      it('should pause contract', async () => {
        await Proxy__Teleportation.pause()
        expect(await Proxy__Teleportation.paused()).to.be.eq(true)
        await expect(
          Proxy__Teleportation.teleportAsset(L2Boba.address, 1, 4)
        ).to.be.revertedWith('Pausable: paused')
        await expect(Proxy__Teleportation.disburseAsset([])).to.be.revertedWith(
          'Pausable: paused'
        )
      })

      it('should unpause contract', async () => {
        await Proxy__Teleportation.unpause()
        expect(await Proxy__Teleportation.paused()).to.be.eq(false)
        const _amount = ethers.utils.parseEther('100')
        await L2Boba.approve(Proxy__Teleportation.address, _amount)
        const depositId = 4
        await expect(
          Proxy__Teleportation.teleportAsset(L2Boba.address, _amount, chainId4)
        )
          .to.emit(Proxy__Teleportation, 'AssetReceived')
          .withArgs(
            L2Boba.address,
            31337,
            chainId4,
            depositId,
            signerAddress,
            _amount
          )
        expect(
          (await Proxy__Teleportation.totalDeposits(chainId4)).toString()
        ).to.be.eq((depositId + 1).toString())
        const payload = [
          {
            token: L2Boba.address,
            amount: _amount,
            addr: signerAddress,
            sourceChainId: chainId4,
            depositId: depositId - 1,
          },
        ]
        await L2Boba.approve(Proxy__Teleportation.address, _amount)
        await expect(Proxy__Teleportation.disburseAsset(payload))
          .to.emit(Proxy__Teleportation, 'DisbursementSuccess')
          .withArgs(depositId - 1, signerAddress, _amount, chainId4)
      })

      it('should teleport native asset and emit event', async () => {
        const prevTransferredAmount = (
          await Proxy__Teleportation.supportedTokens(
            ethers.constants.AddressZero
          )
        ).transferredAmount
        const _amount = ethers.utils.parseEther('100')
        const preBalance = await ethers.provider.getBalance(signerAddress)
        const depositId = 5
        await expect(
          Proxy__Teleportation.teleportAsset(
            ethers.constants.AddressZero,
            _amount,
            chainId4,
            { value: _amount }
          )
        )
          .to.emit(Proxy__Teleportation, 'AssetReceived')
          .withArgs(
            ethers.constants.AddressZero,
            31337,
            chainId4,
            depositId,
            signerAddress,
            _amount
          )
        expect(
          (await Proxy__Teleportation.totalDeposits(4)).toString()
        ).to.be.eq((depositId + 1).toString())
        expect(
          BigNumber.from(
            (
              await Proxy__Teleportation.supportedTokens(
                ethers.constants.AddressZero
              )
            ).transferredAmount
          )
            .sub(prevTransferredAmount)
            .toString()
        ).to.be.eq(_amount.toString())

        const gasFee = await getGasFeeFromLastestBlock(ethers.provider)

        const postBalance = await ethers.provider.getBalance(signerAddress)
        expect(preBalance.sub(_amount)).to.be.eq(postBalance.add(gasFee))
      })

      it('should disburse native asset and emit events', async () => {
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
          Proxy__Teleportation.disburseAsset(payload, { value: _amount })
        )
          .to.emit(Proxy__Teleportation, 'DisbursementSuccess')
          .withArgs(4, signerAddress, _amount, 4)
      })

      it('should disburse native asset and token if disbursement cumulative value does match msg.value', async () => {
        const tokenAmount = ethers.utils.parseEther('3')
        await L2Boba.approve(Proxy__Teleportation.address, tokenAmount)

        const payload = [
          {
            token: ethers.constants.AddressZero,
            amount: ethers.utils.parseEther('10'),
            addr: signerAddress,
            sourceChainId: 4,
            depositId: 5,
          },
          {
            token: L2Boba.address,
            amount: tokenAmount,
            addr: signerAddress,
            sourceChainId: 4,
            depositId: 6,
          },
          {
            token: ethers.constants.AddressZero,
            amount: ethers.utils.parseEther('12'),
            addr: signerAddress,
            sourceChainId: 4,
            depositId: 7,
          },
        ]
        await expect(
          Proxy__Teleportation.disburseAsset(payload, {
            value: ethers.utils.parseEther('22'),
          })
        )
          .to.emit(Proxy__Teleportation, 'DisbursementSuccess')
          .withArgs(5, signerAddress, ethers.utils.parseEther('10'), 4)
          .to.emit(Proxy__Teleportation, 'DisbursementSuccess')
          .withArgs(6, signerAddress, tokenAmount, 4)
          .to.emit(Proxy__Teleportation, 'DisbursementSuccess')
          .withArgs(7, signerAddress, ethers.utils.parseEther('12'), 4)
      })

      it('should not disburse native asset or token if disbursement cumulative value does not match msg.value', async () => {
        const tokenAmount = ethers.utils.parseEther('3')
        await L2Boba.approve(Proxy__Teleportation.address, tokenAmount)

        const payload = [
          {
            token: ethers.constants.AddressZero,
            amount: ethers.utils.parseEther('10'),
            addr: signerAddress,
            sourceChainId: 4,
            depositId: 8,
          },
          {
            token: L2Boba.address,
            amount: tokenAmount,
            addr: signerAddress,
            sourceChainId: 4,
            depositId: 9,
          },
          {
            token: ethers.constants.AddressZero,
            amount: ethers.utils.parseEther('12'),
            addr: signerAddress,
            sourceChainId: 4,
            depositId: 10,
          },
        ]

        await expect(
          Proxy__Teleportation.disburseAsset(payload, {
            value: ethers.utils.parseEther('21'),
          })
        ).to.be.revertedWith('Disbursement total != amount sent')
      })

      it('should not disburse native asset or token if token is not supported on target network (or invalid address was passed -> e.g. faulty server-side mapping)', async () => {
        const tokenAmount = ethers.utils.parseEther('3')
        await L2Boba.approve(Proxy__Teleportation.address, tokenAmount)

        const payload = [
          {
            token: ethers.constants.AddressZero,
            amount: ethers.utils.parseEther('10'),
            addr: signerAddress,
            sourceChainId: 4,
            depositId: 8,
          },
          {
            token: L2Boba.address,
            amount: tokenAmount,
            addr: signerAddress,
            sourceChainId: 4,
            depositId: 9,
          },
          {
            token: ethers.constants.AddressZero,
            amount: ethers.utils.parseEther('12'),
            addr: signerAddress,
            sourceChainId: 4,
            depositId: 10,
          },
        ]

        await Proxy__Teleportation.removeSupportedToken(L2Boba.address)

        await expect(
          Proxy__Teleportation.disburseAsset(payload, {
            value: ethers.utils.parseEther('22'),
          })
        ).to.be.revertedWith('Token not supported')

        await Proxy__Teleportation.addSupportedToken(
          L2Boba.address,
          defaultMinDepositAmount,
          defaultMaxDepositAmount,
          defaultMaxDailyLimit
        )
      })

      it('should not disburse native asset or token if source chain is not supported on target network', async () => {
        const tokenAmount = ethers.utils.parseEther('3')
        await L2Boba.approve(Proxy__Teleportation.address, tokenAmount)

        const payload = [
          {
            token: ethers.constants.AddressZero,
            amount: ethers.utils.parseEther('10'),
            addr: signerAddress,
            sourceChainId: 4,
            depositId: 8,
          },
          {
            token: L2Boba.address,
            amount: tokenAmount,
            addr: signerAddress,
            sourceChainId: 4,
            depositId: 9,
          },
          {
            token: ethers.constants.AddressZero,
            amount: ethers.utils.parseEther('12'),
            addr: signerAddress,
            sourceChainId: 4,
            depositId: 10,
          },
        ]

        await Proxy__Teleportation.removeSupportedChain(4)

        await expect(
          Proxy__Teleportation.disburseAsset(payload, {
            value: ethers.utils.parseEther('22'),
          })
        ).to.be.revertedWith('Source chain not supported')

        await Proxy__Teleportation.addSupportedChain(4)
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

      it('should not remove chain if it is already not supported', async () => {
        await Proxy__Teleportation.removeSupportedChain(4)
        await expect(
          Proxy__Teleportation.removeSupportedChain(4)
        ).to.be.revertedWith('Already not supported')
        await Proxy__Teleportation.addSupportedChain(4)
      })

      it('should not remove the supported chain if caller is not owner', async () => {
        await expect(
          Proxy__Teleportation.connect(signer2).removeSupportedChain(4)
        ).to.be.revertedWith('Caller is not the owner')
      })

      it('should teleport BOBA native tokens and emit event', async () => {
        const _amount = ethers.utils.parseEther('100')
        const preBalance = await ethers.provider.getBalance(signerAddress)
        await expect(
          Proxy__Teleportation.teleportAsset(
            ethers.constants.AddressZero,
            _amount,
            4,
            { value: _amount }
          )
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
        expect(
          (await Proxy__Teleportation.totalDeposits(4)).toString()
        ).to.be.eq('1')
        expect(
          (
            await Proxy__Teleportation.supportedTokens(
              ethers.constants.AddressZero
            )
          ).transferredAmount.toString()
        ).to.be.eq(_amount.toString())

        const gasFee = await getGasFeeFromLastestBlock(ethers.provider)

        const postBalance = await ethers.provider.getBalance(signerAddress)
        expect(preBalance.sub(_amount)).to.be.eq(postBalance.add(gasFee))
      })

      it('should not teleport native if the amount exceeds the daily limit', async () => {
        const maxTransferAmountPerDay = (
          await Proxy__Teleportation.supportedTokens(
            ethers.constants.AddressZero
          )
        ).maxTransferAmountPerDay
        const maxDepositAmount = (
          await Proxy__Teleportation.supportedTokens(
            ethers.constants.AddressZero
          )
        ).maxDepositAmount
        const _amount = ethers.utils.parseEther('200')
        await Proxy__Teleportation.setMaxAmount(
          ethers.constants.AddressZero,
          _amount
        )
        await Proxy__Teleportation.setMaxTransferAmountPerDay(
          ethers.constants.AddressZero,
          _amount
        )
        await expect(
          Proxy__Teleportation.teleportAsset(
            ethers.constants.AddressZero,
            _amount,
            4,
            {
              value: _amount,
            }
          )
        ).to.be.revertedWith('max amount per day exceeded')
        await Proxy__Teleportation.setMaxTransferAmountPerDay(
          ethers.constants.AddressZero,
          maxTransferAmountPerDay
        )
        await Proxy__Teleportation.setMaxTransferAmountPerDay(
          ethers.constants.AddressZero,
          maxDepositAmount
        )
      })

      it('should reset the transferred amount', async () => {
        await ethers.provider.send('evm_increaseTime', [86400])
        const _amount = ethers.utils.parseEther('1')
        const transferTimestampCheckPoint = (
          await Proxy__Teleportation.supportedTokens(
            ethers.constants.AddressZero
          )
        ).transferTimestampCheckPoint
        await L2Boba.approve(Proxy__Teleportation.address, _amount)
        await Proxy__Teleportation.teleportAsset(
          ethers.constants.AddressZero,
          _amount,
          4,
          {
            value: _amount,
          }
        )
        expect(
          (
            await Proxy__Teleportation.supportedTokens(
              ethers.constants.AddressZero
            )
          ).transferredAmount
        ).to.be.eq(_amount)
        expect(
          (
            await Proxy__Teleportation.supportedTokens(
              ethers.constants.AddressZero
            )
          ).transferTimestampCheckPoint
        ).to.be.not.eq(transferTimestampCheckPoint)
      })

      it('should revert if _toChainId is not supported', async () => {
        const _amount = ethers.utils.parseEther('10')
        await expect(
          Proxy__Teleportation.teleportAsset(
            ethers.constants.AddressZero,
            _amount,
            100,
            {
              value: _amount,
            }
          )
        ).to.be.revertedWith('Target chain not supported')
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
        await Proxy__Teleportation.disburseAsset(payload, {
          value: ethers.utils.parseEther('101'),
        })
        const postBalance = await ethers.provider.getBalance(
          Proxy__Teleportation.address
        )
        const postSignerBalance = await ethers.provider.getBalance(
          signerAddress
        )
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
          Proxy__Teleportation.disburseAsset(payload, { value: _amount })
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
          Proxy__Teleportation.disburseAsset(payload, { value: _amount })
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
          Proxy__Teleportation.disburseAsset(payload, { value: '1' })
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
          Proxy__Teleportation.connect(signer2).disburseAsset(payload, {
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
          Proxy__Teleportation.connect(signer2).transferDisburser(
            signer2Address
          )
        ).to.be.revertedWith('Caller is not the owner')
      })

      it('should withdraw BOBA balance', async () => {
        const preSignerBalnce = await ethers.provider.getBalance(signerAddress)
        const preBalance = await ethers.provider.getBalance(
          Proxy__Teleportation.address
        )
        await expect(
          Proxy__Teleportation.withdrawBalance(ethers.constants.AddressZero)
        )
          .to.emit(Proxy__Teleportation, 'AssetBalanceWithdrawn')
          .withArgs(ethers.constants.AddressZero, signerAddress, preBalance)

        const postBalance = await ethers.provider.getBalance(
          Proxy__Teleportation.address
        )
        const postSignerBalance = await ethers.provider.getBalance(
          signerAddress
        )
        const gasFee = await getGasFeeFromLastestBlock(ethers.provider)
        expect(preBalance.sub(postBalance)).to.be.eq(
          postSignerBalance.sub(preSignerBalnce).add(gasFee)
        )
        expect(postBalance.toString()).to.be.eq('0')
      })

      it('should not withdraw BOBA balance if caller is not owner', async () => {
        await expect(
          Proxy__Teleportation.connect(signer2).withdrawBalance(
            ethers.constants.AddressZero
          )
        ).to.be.revertedWith('Caller is not the owner')
      })

      it('should pause contract', async () => {
        await Proxy__Teleportation.pause()
        expect(await Proxy__Teleportation.paused()).to.be.eq(true)
        await expect(
          Proxy__Teleportation.teleportAsset(
            ethers.constants.AddressZero,
            1,
            4,
            {
              value: 1,
            }
          )
        ).to.be.revertedWith('Pausable: paused')
        await expect(Proxy__Teleportation.disburseAsset([])).to.be.revertedWith(
          'Pausable: paused'
        )
      })

      it('should unpause contract', async () => {
        await Proxy__Teleportation.unpause()
        expect(await Proxy__Teleportation.paused()).to.be.eq(false)
        const _amount = ethers.utils.parseEther('100')
        await L2Boba.approve(Proxy__Teleportation.address, _amount)
        await expect(
          Proxy__Teleportation.teleportAsset(
            ethers.constants.AddressZero,
            _amount,
            4,
            { value: _amount }
          )
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
        expect(
          (await Proxy__Teleportation.totalDeposits(4)).toString()
        ).to.be.eq('3')
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
          Proxy__Teleportation.disburseAsset(payload, { value: _amount })
        )
          .to.emit(Proxy__Teleportation, 'DisbursementSuccess')
          .withArgs(3, signerAddress, _amount, 4)
      })

      it('should teleport BOBA tokens and emit event for alt l2', async () => {
        const prevTransferredAmount = BigNumber.from(
          (await Proxy__Teleportation.supportedTokens(L2Boba.address))
            .transferredAmount
        )
        const _amount = ethers.utils.parseEther('100')
        const preBalance = await L2Boba.balanceOf(signerAddress)
        await L2Boba.approve(Proxy__Teleportation.address, _amount)
        await expect(
          Proxy__Teleportation.teleportAsset(L2Boba.address, _amount, 4)
        )
          .to.emit(Proxy__Teleportation, 'AssetReceived')
          .withArgs(L2Boba.address, 31337, 4, 3, signerAddress, _amount)
        expect(
          (await Proxy__Teleportation.totalDeposits(4)).toString()
        ).to.be.eq('4')
        expect(
          BigNumber.from(
            (await Proxy__Teleportation.supportedTokens(L2Boba.address))
              .transferredAmount
          )
            .sub(prevTransferredAmount)
            .toString()
        ).to.be.eq(_amount.toString())
        const postBalance = await L2Boba.balanceOf(signerAddress)
        expect(preBalance.sub(_amount)).to.be.eq(postBalance)
      })

      it('should teleport random tokens and emit event for alt l2', async () => {
        const prevTransferredAmount = BigNumber.from(
          (await Proxy__Teleportation.supportedTokens(RandomERC20.address))
            .transferredAmount
        )
        const _amount = ethers.utils.parseEther('100')
        const preBalance = await RandomERC20.balanceOf(signerAddress)
        await RandomERC20.approve(Proxy__Teleportation.address, _amount)
        await expect(
          Proxy__Teleportation.teleportAsset(RandomERC20.address, _amount, 4)
        )
          .to.emit(Proxy__Teleportation, 'AssetReceived')
          .withArgs(RandomERC20.address, 31337, 4, 4, signerAddress, _amount)
        expect(
          (await Proxy__Teleportation.totalDeposits(4)).toString()
        ).to.be.eq('5')
        expect(
          BigNumber.from(
            (await Proxy__Teleportation.supportedTokens(RandomERC20.address))
              .transferredAmount
          )
            .sub(prevTransferredAmount)
            .toString()
        ).to.be.eq(_amount.toString())
        const postBalance = await RandomERC20.balanceOf(signerAddress)
        expect(preBalance.sub(_amount)).to.be.eq(postBalance)
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
          Proxy__Teleportation.disburseAsset(payload, { value: _amount })
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
        ).to.be.revertedWith('DepositId not failed disbursement')
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
        expect(
          await ethers.provider.getBalance(PausedReceiver.address)
        ).to.be.eq(_amount)
      })

      it('should not be able to retry an already retried Disbursements', async () => {
        await expect(
          Proxy__Teleportation.retryDisburseNative([0])
        ).to.be.revertedWith('DepositId not failed disbursement')
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
          Proxy__Teleportation.disburseAsset(payload, { value: _amount })
        )
          .to.emit(Proxy__Teleportation, 'DisbursementSuccess')
          .withArgs(1, signerAddress, _amount, 4)

        await expect(
          Proxy__Teleportation.retryDisburseNative([1])
        ).to.be.revertedWith('DepositId not failed disbursement')
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
          Proxy__Teleportation.disburseAsset(payload, {
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
        expect(failedDisbursementRetried1.disbursement.sourceChainId).to.be.eq(
          4
        )
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
        expect(failedDisbursementRetried2.disbursement.sourceChainId).to.be.eq(
          4
        )
        expect(failedDisbursementRetried2.disbursement.depositId).to.be.eq(3)
        expect(
          await ethers.provider.getBalance(Proxy__Teleportation.address)
        ).to.be.eq(0)
        expect(
          await ethers.provider.getBalance(PausedReceiver.address)
        ).to.be.eq(preBalanceReceiver.add(ethers.utils.parseEther('101')))
      })
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

    it('should not set minimum amount if larger than maximum amount', async () => {
      const maxAmount = BigNumber.from(
        (
          await Proxy__Teleportation.supportedTokens(
            ethers.constants.AddressZero
          )
        ).maxDepositAmount
      )

      await expect(
        Proxy__Teleportation.setMinAmount(
          ethers.constants.AddressZero,
          maxAmount.add(1)
        )
      ).to.be.revertedWith('incorrect min deposit amount')
    })

    it('should set minimum amount', async () => {
      await Proxy__Teleportation.addSupportedToken(
        L2Boba.address,
        defaultMinDepositAmount,
        defaultMaxDepositAmount,
        defaultMaxDailyLimit
      )

      await Proxy__Teleportation.setMinAmount(
        L2Boba.address,
        defaultMinDepositAmount.add(1)
      )
      expect(
        (
          await Proxy__Teleportation.supportedTokens(L2Boba.address)
        ).minDepositAmount.toString()
      ).to.be.eq(defaultMinDepositAmount.add(1))

      await Proxy__Teleportation.setMinAmount(
        L2Boba.address,
        defaultMinDepositAmount
      )

      await Proxy__Teleportation.removeSupportedToken(L2Boba.address)
    })

    it('should set minimum amount native', async () => {
      await Proxy__Teleportation.setMinAmount(
        ethers.constants.AddressZero,
        ethers.utils.parseEther('1')
      )
      expect(
        (
          await Proxy__Teleportation.supportedTokens(
            ethers.constants.AddressZero
          )
        ).minDepositAmount.toString()
      ).to.be.eq(ethers.utils.parseEther('1'))
    })

    it('should not set minimum amount if caller is not owner', async () => {
      await expect(
        Proxy__Teleportation.connect(signer2).setMinAmount(
          L2Boba.address,
          ethers.utils.parseEther('1')
        )
      ).to.be.revertedWith('Caller is not the owner')
    })

    it('should not set maximum amount if smaller than min amount', async () => {
      const minAmount = (
        await Proxy__Teleportation.supportedTokens(ethers.constants.AddressZero)
      ).minDepositAmount

      await expect(
        Proxy__Teleportation.setMaxAmount(
          ethers.constants.AddressZero,
          minAmount.sub(1)
        )
      ).to.be.revertedWith('incorrect max deposit amount')
    })

    it('should set maximum amount', async () => {
      await Proxy__Teleportation.setMaxAmount(
        ethers.constants.AddressZero,
        defaultMaxDepositAmount.sub(2)
      )
      expect(
        (
          await Proxy__Teleportation.supportedTokens(
            ethers.constants.AddressZero
          )
        ).maxDepositAmount.toString()
      ).to.be.eq(defaultMaxDepositAmount.sub(2))

      await Proxy__Teleportation.setMaxAmount(
        ethers.constants.AddressZero,
        defaultMaxDepositAmount
      )
    })

    it('should set maximum amount native', async () => {
      await Proxy__Teleportation.setMaxAmount(
        ethers.constants.AddressZero,
        defaultMaxDepositAmount.sub(2)
      )
      expect(
        (
          await Proxy__Teleportation.supportedTokens(
            ethers.constants.AddressZero
          )
        ).maxDepositAmount.toString()
      ).to.be.eq(defaultMaxDepositAmount.sub(2))

      await Proxy__Teleportation.setMaxAmount(
        ethers.constants.AddressZero,
        defaultMaxDepositAmount
      )
    })

    it('should not set maximum amount if caller is not owner', async () => {
      await expect(
        Proxy__Teleportation.connect(signer2).setMaxAmount(
          L2Boba.address,
          ethers.utils.parseEther('1')
        )
      ).to.be.revertedWith('Caller is not the owner')
    })

    it('should set daily limit', async () => {
      await Proxy__Teleportation.addSupportedToken(
        L2Boba.address,
        defaultMinDepositAmount,
        defaultMaxDepositAmount,
        defaultMaxDailyLimit
      )

      await Proxy__Teleportation.setMaxTransferAmountPerDay(
        L2Boba.address,
        defaultMaxDailyLimit.add(2)
      )
      expect(
        (
          await Proxy__Teleportation.supportedTokens(L2Boba.address)
        ).maxTransferAmountPerDay.toString()
      ).to.be.eq(defaultMaxDailyLimit.add(2))

      await Proxy__Teleportation.removeSupportedToken(L2Boba.address)
    })

    it('should set daily limit native', async () => {
      await Proxy__Teleportation.setMaxTransferAmountPerDay(
        ethers.constants.AddressZero,
        defaultMaxDailyLimit.add(2)
      )
      expect(
        (
          await Proxy__Teleportation.supportedTokens(
            ethers.constants.AddressZero
          )
        ).maxTransferAmountPerDay.toString()
      ).to.be.eq(defaultMaxDailyLimit.add(2))
    })

    it('should not set daily limit if caller is not owner', async () => {
      await expect(
        Proxy__Teleportation.connect(signer2).setMaxTransferAmountPerDay(
          ethers.constants.AddressZero,
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
      Teleportation = await Factory__Teleportation.connect(signer).deploy()
      await Teleportation.deployTransaction.wait()
      const Factory__Proxy__Teleportation = await ethers.getContractFactory(
        'Lib_ResolvedDelegateProxy'
      )
      Proxy__Teleportation = await Factory__Proxy__Teleportation.connect(
        signer
      ).deploy(Teleportation.address)
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
      ).to.be.revertedWith('max deposit amount more than daily limit')
    })
  })
})
