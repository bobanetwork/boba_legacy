import { expect } from '../../../setup'

/* External Imports */
import { ethers } from 'hardhat'
import { ContractFactory, Contract, Signer, utils, BigNumber } from 'ethers'

import { calculateL1Fee } from '@eth-optimism/core-utils'

describe('Boba_GasPriceOracleAltL1', () => {
  let signer1: Signer
  let signer2: Signer
  let address1: string
  let address2: string
  before(async () => {
    ;[signer1, signer2] = await ethers.getSigners()
    address1 = ethers.Wallet.createRandom().address
    address2 = ethers.Wallet.createRandom().address
  })

  let Factory__Boba_GasPriceOracle: ContractFactory
  let Factory__OVM_GasPriceOracle: ContractFactory
  before(async () => {
    Factory__Boba_GasPriceOracle = await ethers.getContractFactory(
      'Boba_GasPriceOracleAltL1'
    )
    Factory__OVM_GasPriceOracle = await ethers.getContractFactory(
      'OVM_GasPriceOracle'
    )
  })

  let Boba_GasPriceOracle: Contract
  let OVM_GasPriceOracle: Contract
  beforeEach(async () => {
    Boba_GasPriceOracle = await Factory__Boba_GasPriceOracle.deploy()
    await Boba_GasPriceOracle.initialize(address1, address2)
    OVM_GasPriceOracle = await Factory__OVM_GasPriceOracle.deploy(
      await signer1.getAddress()
    )

    OVM_GasPriceOracle.setOverhead(2750)
    OVM_GasPriceOracle.setScalar(1500000)
    OVM_GasPriceOracle.setDecimals(6)
  })

  describe('owner', () => {
    it('should have an owner', async () => {
      expect(await Boba_GasPriceOracle.owner()).to.equal(
        await signer1.getAddress()
      )
    })
    it('should transfer ownership', async () => {
      const signer1Address = await signer1.getAddress()
      const signer2Address = await signer2.getAddress()
      await Boba_GasPriceOracle.connect(signer1).transferOwnership(
        signer2Address
      )
      expect(await Boba_GasPriceOracle.owner()).to.equal(signer2Address)

      await Boba_GasPriceOracle.connect(signer2).transferOwnership(
        signer1Address
      )
      expect(await Boba_GasPriceOracle.owner()).to.equal(signer1Address)
    })
    it('should revert if called by someone other than the owner', async () => {
      const signer1Address = await signer1.getAddress()
      await expect(
        Boba_GasPriceOracle.connect(signer2).transferOwnership(signer1Address)
      ).to.be.reverted
    })
    it('should revert if ownership is transferred to zero address', async () => {
      await expect(
        Boba_GasPriceOracle.connect(signer2).transferOwnership(
          ethers.constants.AddressZero
        )
      ).to.be.reverted
    })
  })

  describe('initialize', () => {
    it('should revert if contract has been initialized', async () => {
      const signer1Address = await signer1.getAddress()
      await expect(
        Boba_GasPriceOracle.connect(signer1).initialize(
          signer1Address,
          signer1Address
        )
      ).to.be.reverted
    })
  })

  describe('updatePriceRatio', () => {
    it('should revert if called by someone other than the owner', async () => {
      await expect(
        Boba_GasPriceOracle.connect(signer2).updatePriceRatio(1234, 1234)
      ).to.be.reverted
    })

    it('should revert if number is too small or too large', async () => {
      await expect(
        Boba_GasPriceOracle.connect(signer2).updatePriceRatio(1, 1234)
      ).to.be.reverted
      await expect(
        Boba_GasPriceOracle.connect(signer2).updatePriceRatio(1234, 1)
      ).to.be.reverted
      await expect(
        Boba_GasPriceOracle.connect(signer2).updatePriceRatio(12340, 1234)
      ).to.be.reverted
      await expect(
        Boba_GasPriceOracle.connect(signer2).updatePriceRatio(1234, 12340)
      ).to.be.reverted
    })

    it('should succeed if called by the owner and is equal to `1234`', async () => {
      await expect(
        Boba_GasPriceOracle.connect(signer1).updatePriceRatio(1234, 1234)
      ).to.not.be.reverted
    })

    it('should emit event', async () => {
      await expect(
        Boba_GasPriceOracle.connect(signer1).updatePriceRatio(1234, 1234)
      )
        .to.emit(Boba_GasPriceOracle, 'UpdatePriceRatio')
        .withArgs(await signer1.getAddress(), 1234, 1234)
    })
  })

  describe('get priceRatio', () => {
    it('should change when priceRatio is called', async () => {
      const priceRatio = 1234

      await Boba_GasPriceOracle.connect(signer1).updatePriceRatio(
        priceRatio,
        priceRatio
      )

      expect(await Boba_GasPriceOracle.priceRatio()).to.equal(priceRatio)
      expect(await Boba_GasPriceOracle.marketPriceRatio()).to.equal(priceRatio)
    })

    it('is the 5th and 10th storage slot', async () => {
      const priceRatio = 2222
      const firstSlot = 5
      const secondSlot = 10

      // set the price
      await Boba_GasPriceOracle.connect(signer1).updatePriceRatio(
        priceRatio,
        priceRatio
      )

      // get the storage slot value
      const priceRatioAtSlot = await signer1.provider.getStorageAt(
        Boba_GasPriceOracle.address,
        firstSlot
      )
      expect(await Boba_GasPriceOracle.priceRatio()).to.equal(
        ethers.BigNumber.from(priceRatioAtSlot)
      )
      // get the storage slot value
      const marketPriceRatioAtSlot = await signer1.provider.getStorageAt(
        Boba_GasPriceOracle.address,
        secondSlot
      )
      expect(await Boba_GasPriceOracle.marketPriceRatio()).to.equal(
        ethers.BigNumber.from(marketPriceRatioAtSlot)
      )
    })
  })

  describe('maxPriceRatio', () => {
    it('should revert if called by someone other than the owner', async () => {
      await expect(
        Boba_GasPriceOracle.connect(signer2).updateMaxPriceRatio(6000)
      ).to.be.reverted
    })

    it('should revert if maxPriceRatio is smaller than minPriceRatio', async () => {
      const minPriceRatio = await Boba_GasPriceOracle.minPriceRatio()
      await expect(
        Boba_GasPriceOracle.connect(signer1).updateMaxPriceRatio(
          minPriceRatio.toNumber() - 1
        )
      ).to.be.reverted
    })

    it('should succeed if called by the owner', async () => {
      await expect(
        Boba_GasPriceOracle.connect(signer1).updateMaxPriceRatio(6500)
      ).to.not.be.reverted
    })

    it('should emit event', async () => {
      await expect(
        Boba_GasPriceOracle.connect(signer1).updateMaxPriceRatio(6000)
      )
        .to.emit(Boba_GasPriceOracle, 'UpdateMaxPriceRatio')
        .withArgs(await signer1.getAddress(), 6000)
    })
  })

  describe('get maxPriceRatio', () => {
    it('should change when maxPriceRatio is called', async () => {
      const maxPriceRatio = 6000
      await Boba_GasPriceOracle.connect(signer1).updateMaxPriceRatio(
        maxPriceRatio
      )
      expect(await Boba_GasPriceOracle.maxPriceRatio()).to.equal(maxPriceRatio)
    })

    it('is the 3rd storage slot', async () => {
      const maxPriceRatio = 12345
      const slot = 3

      // set the price
      await Boba_GasPriceOracle.connect(signer1).updateMaxPriceRatio(
        maxPriceRatio
      )

      // get the storage slot value
      const priceAtSlot = await signer1.provider.getStorageAt(
        Boba_GasPriceOracle.address,
        slot
      )
      expect(await Boba_GasPriceOracle.maxPriceRatio()).to.equal(
        ethers.BigNumber.from(priceAtSlot)
      )
    })
  })

  describe('minPriceRatio', () => {
    it('should revert if called by someone other than the owner', async () => {
      await expect(
        Boba_GasPriceOracle.connect(signer2).updateMinPriceRatio(600)
      ).to.be.reverted
    })

    it('should revert if minPriceRatio is larger than maxPriceRatio', async () => {
      const minPriceRatio = await Boba_GasPriceOracle.maxPriceRatio()
      await expect(
        Boba_GasPriceOracle.connect(signer1).updateMinPriceRatio(
          minPriceRatio.toNumber() + 1
        )
      ).to.be.reverted
    })

    it('should succeed if called by the owner', async () => {
      await expect(
        Boba_GasPriceOracle.connect(signer1).updateMinPriceRatio(650)
      ).to.not.be.reverted
    })

    it('should emit event', async () => {
      await expect(
        Boba_GasPriceOracle.connect(signer1).updateMinPriceRatio(600)
      )
        .to.emit(Boba_GasPriceOracle, 'UpdateMinPriceRatio')
        .withArgs(await signer1.getAddress(), 600)
    })
  })

  describe('get minPriceRatio', () => {
    it('should change when minPriceRatio is called', async () => {
      const minPriceRatio = 600
      await Boba_GasPriceOracle.connect(signer1).updateMinPriceRatio(
        minPriceRatio
      )
      expect(await Boba_GasPriceOracle.minPriceRatio()).to.equal(minPriceRatio)
    })

    it('is the 4th storage slot', async () => {
      const minPriceRatio = 650
      const slot = 4

      // set the price
      await Boba_GasPriceOracle.connect(signer1).updateMinPriceRatio(
        minPriceRatio
      )

      // get the storage slot value
      const priceAtSlot = await signer1.provider.getStorageAt(
        Boba_GasPriceOracle.address,
        slot
      )
      expect(await Boba_GasPriceOracle.minPriceRatio()).to.equal(
        ethers.BigNumber.from(priceAtSlot)
      )
    })
  })

  describe('gasPriceOracleAddress', () => {
    it('should revert if called by someone other than the owner', async () => {
      await expect(
        Boba_GasPriceOracle.connect(signer2).updateGasPriceOracleAddress(
          address1
        )
      ).to.be.reverted
    })

    it('should revert if the new address is address(0)', async () => {
      await expect(
        Boba_GasPriceOracle.connect(signer1).updateGasPriceOracleAddress(
          ethers.constants.AddressZero
        )
      ).to.be.reverted
    })

    it('should succeed if called by the owner', async () => {
      await expect(
        Boba_GasPriceOracle.connect(signer1).updateGasPriceOracleAddress(
          OVM_GasPriceOracle.address
        )
      ).to.not.be.reverted
    })

    it('should emit event', async () => {
      await expect(
        Boba_GasPriceOracle.connect(signer1).updateGasPriceOracleAddress(
          OVM_GasPriceOracle.address
        )
      )
        .to.emit(Boba_GasPriceOracle, 'UpdateGasPriceOracleAddress')
        .withArgs(await signer1.getAddress(), OVM_GasPriceOracle.address)
    })
  })

  describe('get gasPriceOracleAddress', () => {
    it('should revert if caller is not EOA', async () => {
      await expect(
        Boba_GasPriceOracle.connect(signer2).updateGasPriceOracleAddress(
          address1
        )
      ).to.be.reverted
    })
    it('should change when gasPriceOracleAddress is called', async () => {
      await Boba_GasPriceOracle.connect(signer1).updateGasPriceOracleAddress(
        OVM_GasPriceOracle.address
      )
      expect(await Boba_GasPriceOracle.gasPriceOracleAddress()).to.equal(
        OVM_GasPriceOracle.address
      )
    })

    it('is the 6th storage slot', async () => {
      const gasPriceOracleAddress = OVM_GasPriceOracle.address
      const slot = 6

      // set the price
      await Boba_GasPriceOracle.connect(signer1).updateGasPriceOracleAddress(
        gasPriceOracleAddress
      )

      // get the storage slot value
      const priceAtSlot = await signer1.provider.getStorageAt(
        Boba_GasPriceOracle.address,
        slot
      )
      expect(await Boba_GasPriceOracle.gasPriceOracleAddress()).to.equal(
        ethers.BigNumber.from(priceAtSlot)
      )
    })
  })

  describe('metaTransactionFee', () => {
    it('should revert if called by someone other than the owner', async () => {
      await expect(
        Boba_GasPriceOracle.connect(signer2).updateMetaTransactionFee(address1)
      ).to.be.reverted
    })

    it('should revert if the new transaction fee is 0', async () => {
      await expect(
        Boba_GasPriceOracle.connect(signer1).updateMetaTransactionFee(0)
      ).to.be.reverted
    })

    it('should succeed if called by the owner', async () => {
      await expect(
        Boba_GasPriceOracle.connect(signer1).updateMetaTransactionFee(
          ethers.utils.parseEther('10')
        )
      ).to.not.be.reverted
    })

    it('should emit event', async () => {
      const metaTransactionFee = ethers.utils.parseEther('10')
      await expect(
        Boba_GasPriceOracle.connect(signer1).updateMetaTransactionFee(
          metaTransactionFee
        )
      )
        .to.emit(Boba_GasPriceOracle, 'UpdateMetaTransactionFee')
        .withArgs(await signer1.getAddress(), metaTransactionFee)
    })
  })

  describe('get metaTransactionFee', () => {
    it('should revert if caller is not EOA', async () => {
      await expect(
        Boba_GasPriceOracle.connect(signer2).updateMetaTransactionFee(
          ethers.utils.parseEther('10')
        )
      ).to.be.reverted
    })
    it('should change when updateMetaTransactionFee is called', async () => {
      await Boba_GasPriceOracle.connect(signer1).updateMetaTransactionFee(
        ethers.utils.parseEther('10')
      )
      expect(await Boba_GasPriceOracle.metaTransactionFee()).to.equal(
        ethers.utils.parseEther('10')
      )
    })

    it('is the 8th storage slot', async () => {
      const metaTransactionFee = ethers.utils.parseEther('5')
      const slot = 8

      // set the price
      await Boba_GasPriceOracle.connect(signer1).updateMetaTransactionFee(
        metaTransactionFee
      )

      // get the storage slot value
      const priceAtSlot = await signer1.provider.getStorageAt(
        Boba_GasPriceOracle.address,
        slot
      )
      expect(await Boba_GasPriceOracle.metaTransactionFee()).to.equal(
        priceAtSlot
      )
    })
  })

  describe('receivedBOBAAmount', () => {
    it('should revert if called by someone other than the owner', async () => {
      await expect(
        Boba_GasPriceOracle.connect(signer2).updateMetaTransactionFee(address1)
      ).to.be.reverted
    })

    it('should revert if the new receivedBOBAAmount is below 0.001 BOBA', async () => {
      await expect(
        Boba_GasPriceOracle.connect(signer1).updateReceivedBOBAAmount(
          utils.parseEther('0.0009')
        )
      ).to.be.reverted
    })

    it('should revert if the new receivedBOBAAmount is larger than 10 BOBA', async () => {
      await expect(
        Boba_GasPriceOracle.connect(signer1).updateReceivedBOBAAmount(
          utils.parseEther('10.1')
        )
      ).to.be.reverted
    })

    it('should succeed if called by the owner', async () => {
      await expect(
        Boba_GasPriceOracle.connect(signer1).updateReceivedBOBAAmount(
          ethers.utils.parseEther('0.003')
        )
      ).to.not.be.reverted
    })

    it('should emit event', async () => {
      const receivedBOBAAmount = ethers.utils.parseEther('0.006')
      await expect(
        Boba_GasPriceOracle.connect(signer1).updateReceivedBOBAAmount(
          receivedBOBAAmount
        )
      )
        .to.emit(Boba_GasPriceOracle, 'UpdateReceivedBOBAAmount')
        .withArgs(await signer1.getAddress(), receivedBOBAAmount)
    })
  })

  describe('get receivedBOBAAmount', () => {
    it('should revert if caller is not owner', async () => {
      await expect(
        Boba_GasPriceOracle.connect(signer2).updateReceivedBOBAAmount(
          utils.parseEther('0.006')
        )
      ).to.be.reverted
    })
    it('should change when updateReceivedBOBAAmount is called', async () => {
      await Boba_GasPriceOracle.connect(signer1).updateReceivedBOBAAmount(
        ethers.utils.parseEther('0.005')
      )
      expect(await Boba_GasPriceOracle.receivedBOBAAmount()).to.equal(
        ethers.utils.parseEther('0.005')
      )
    })

    it('is the 9th storage slot', async () => {
      const receivedBOBAAmount = ethers.utils.parseEther('0.003')
      const slot = 9

      // set the price
      await Boba_GasPriceOracle.connect(signer1).updateReceivedBOBAAmount(
        receivedBOBAAmount
      )

      // get the storage slot value
      const receivedBOBAAmountSlot = await signer1.provider.getStorageAt(
        Boba_GasPriceOracle.address,
        slot
      )
      expect(await Boba_GasPriceOracle.receivedBOBAAmount()).to.equal(
        receivedBOBAAmountSlot
      )
    })
  })

  describe('decimals', () => {
    it('should revert if called by someone other than the owner', async () => {
      await expect(Boba_GasPriceOracle.connect(signer2).updateDecimals(4)).to.be
        .reverted
    })

    it('should revert if the new decimals is larger than 9', async () => {
      await expect(Boba_GasPriceOracle.connect(signer1).updateDecimals(10)).to
        .be.reverted
    })

    it('should succeed if called by the owner', async () => {
      await expect(Boba_GasPriceOracle.connect(signer1).updateDecimals(1)).to
        .not.be.reverted
    })

    it('should emit event', async () => {
      const newDecimals = 5
      await expect(
        Boba_GasPriceOracle.connect(signer1).updateDecimals(newDecimals)
      )
        .to.emit(Boba_GasPriceOracle, 'UpdateDecimals')
        .withArgs(await signer1.getAddress(), newDecimals)
    })
  })

  describe('get decimals', () => {
    it('should revert if caller is not owner', async () => {
      await expect(Boba_GasPriceOracle.connect(signer2).updateDecimals(3)).to.be
        .reverted
    })
    it('should change when updateDecimals is called', async () => {
      await Boba_GasPriceOracle.connect(signer1).updateDecimals(2)
      expect(await Boba_GasPriceOracle.decimals()).to.equal(BigNumber.from(2))
    })

    it('are the 11th storage slots', async () => {
      const newDecimals = 4

      // set the price
      await Boba_GasPriceOracle.connect(signer1).updateDecimals(newDecimals)

      // get the storage slot value
      const decimalsSlot = await signer1.provider.getStorageAt(
        Boba_GasPriceOracle.address,
        11
      )
      expect(await Boba_GasPriceOracle.decimals()).to.equal(decimalsSlot)
    })
  })

  describe('withdrawSecondaryFeeToken', () => {
    it('should revert if the balance is not enough', async () => {
      await expect(
        Boba_GasPriceOracle.connect(signer2).withdrawSecondaryFeeToken()
      ).to.be.reverted
    })
  })

  describe('withdrawBOBA', () => {
    it('should revert if called by someone other than the owner', async () => {
      await expect(Boba_GasPriceOracle.connect(signer2).withdrawBOBA()).to.be
        .reverted
    })
  })

  describe('receive BOBA', () => {
    it('should receive BOBA', async () => {
      const depositAmount = utils.parseEther('1')
      const BOBABalanceBefore = await signer1.provider.getBalance(
        Boba_GasPriceOracle.address
      )
      await signer1.sendTransaction({
        to: Boba_GasPriceOracle.address,
        value: depositAmount,
      })
      const BOBABalanceAfter = await signer1.provider.getBalance(
        Boba_GasPriceOracle.address
      )
      expect(BOBABalanceAfter.sub(BOBABalanceBefore)).to.equal(depositAmount)
    })
  })

  describe('getSecondaryFeeTokenForSwap', () => {
    it('should get correct BOBA for swapping L1 native token for BOBA', async () => {
      const SecondaryFeeTokenCost =
        await Boba_GasPriceOracle.getSecondaryFeeTokenForSwap()
      const receivedBOBAAmount = await Boba_GasPriceOracle.receivedBOBAAmount()
      const metaTransactionFee = await Boba_GasPriceOracle.metaTransactionFee()
      const marketPriceRatio = await Boba_GasPriceOracle.marketPriceRatio()
      const decimals = await Boba_GasPriceOracle.decimals()
      const multiplier = BigNumber.from(10).pow(decimals)
      expect(
        receivedBOBAAmount
          .mul(marketPriceRatio)
          .div(multiplier)
          .add(metaTransactionFee)
      ).to.equal(SecondaryFeeTokenCost)
    })
  })

  // Test cases for gas estimation
  const inputs = [
    '0x',
    '0x00',
    '0x01',
    '0x0001',
    '0x0101',
    '0xffff',
    '0x00ff00ff00ff00ff00ff00ff',
  ]

  describe('getL1BobaFee', async () => {
    for (const input of inputs) {
      it(`case: ${input}`, async () => {
        await OVM_GasPriceOracle.setGasPrice(1)
        await OVM_GasPriceOracle.setL1BaseFee(1)
        const decimals = await OVM_GasPriceOracle.decimals()
        const overhead = await OVM_GasPriceOracle.overhead()
        const scalar = await OVM_GasPriceOracle.scalar()
        const l1BaseFee = await OVM_GasPriceOracle.l1BaseFee()

        const tx = await Boba_GasPriceOracle.updateGasPriceOracleAddress(
          OVM_GasPriceOracle.address
        )
        await tx.wait()
        const priceRatio = await Boba_GasPriceOracle.priceRatio()
        const SecondaryFeeTokenFee =
          await Boba_GasPriceOracle.getSecondaryFeeTokenFee(input)

        const priceRatioDecimals = await Boba_GasPriceOracle.decimals()
        const multiplier = BigNumber.from(10).pow(priceRatioDecimals)

        const expected = calculateL1Fee(
          input,
          overhead,
          l1BaseFee,
          scalar,
          decimals
        )
          .mul(priceRatio)
          .div(multiplier)
        expect(SecondaryFeeTokenFee).to.deep.equal(expected)
      })
    }
  })

  describe('updateSecondaryFeeTokenMinimum', () => {
    it('should revert if called by someone other than the owner', async () => {
      await expect(
        Boba_GasPriceOracle.connect(signer2).updateSecondaryFeeTokenMinimum(
          utils.parseEther('0.003')
        )
      ).to.be.reverted
    })

    it('should revert if the new Secondary Fee Token Minimum is smaller than 0.002', async () => {
      await expect(
        Boba_GasPriceOracle.connect(signer1).updateSecondaryFeeTokenMinimum(
          utils.parseEther('0.001')
        )
      ).to.be.reverted
    })

    it('should succeed if called by the owner', async () => {
      await expect(
        Boba_GasPriceOracle.connect(signer1).updateSecondaryFeeTokenMinimum(
          utils.parseEther('0.003')
        )
      ).to.not.be.reverted
    })

    it('should emit event', async () => {
      const newMin = utils.parseEther('0.006')
      const previousMin = await Boba_GasPriceOracle.secondaryFeeTokenMinimum()
      await expect(
        Boba_GasPriceOracle.connect(signer1).updateSecondaryFeeTokenMinimum(
          newMin
        )
      )
        .to.emit(Boba_GasPriceOracle, 'UpdateSecondaryFeeTokenMinimum')
        .withArgs(previousMin, newMin)
    })

    it('should emit event if Secondary Fee Token Minimum is exactly 0.002', async () => {
      const newMin = utils.parseEther('0.002')
      const previousMin = await Boba_GasPriceOracle.secondaryFeeTokenMinimum()
      await expect(
        Boba_GasPriceOracle.connect(signer1).updateSecondaryFeeTokenMinimum(
          newMin
        )
      )
        .to.emit(Boba_GasPriceOracle, 'UpdateSecondaryFeeTokenMinimum')
        .withArgs(previousMin, newMin)
    })
  })
})
