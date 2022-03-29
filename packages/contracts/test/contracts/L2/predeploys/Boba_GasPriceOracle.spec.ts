import { expect } from '../../../setup'

/* External Imports */
import { ethers } from 'hardhat'
import { ContractFactory, Contract, Signer } from 'ethers'

import { calculateL1GasUsed, calculateL1Fee } from '@eth-optimism/core-utils'

describe('Boba_GasPriceOracle', () => {
  const initialGasPrice = 0
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
      'Boba_GasPriceOracle'
    )
    Factory__OVM_GasPriceOracle = await ethers.getContractFactory(
      'OVM_GasPriceOracle'
    )
  })

  let Boba_GasPriceOracle: Contract
  let OVM_GasPriceOracle: Contract
  beforeEach(async () => {
    Boba_GasPriceOracle = await Factory__Boba_GasPriceOracle.deploy(
      address1,
      address2
    )
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
  })

  describe('updatePriceRatio', () => {
    it('should revert if called by someone other than the owner', async () => {
      await expect(Boba_GasPriceOracle.connect(signer2).updatePriceRatio(1234))
        .to.be.reverted
    })

    it('should succeed if called by the owner and is equal to `1234`', async () => {
      await expect(Boba_GasPriceOracle.connect(signer1).updatePriceRatio(1234))
        .to.not.be.reverted
    })

    it('should emit event', async () => {
      await expect(Boba_GasPriceOracle.connect(signer1).updatePriceRatio(1234))
        .to.emit(Boba_GasPriceOracle, 'UpdatePriceRatio')
        .withArgs(await signer1.getAddress(), 1234)
    })
  })

  describe('get priceRatio', () => {
    it('should return zero at first', async () => {
      expect(await Boba_GasPriceOracle.priceRatio()).to.equal(initialGasPrice)
    })

    it('should change when priceRatio is called', async () => {
      const priceRatio = 1234

      await Boba_GasPriceOracle.connect(signer1).updatePriceRatio(priceRatio)

      expect(await Boba_GasPriceOracle.priceRatio()).to.equal(priceRatio)
    })

    it('is the 5st storage slot', async () => {
      const priceRatio = 2222
      const slot = 5

      // set the price
      await Boba_GasPriceOracle.connect(signer1).updatePriceRatio(priceRatio)

      // get the storage slot value
      const priceRatioAtSlot = await signer1.provider.getStorageAt(
        Boba_GasPriceOracle.address,
        slot
      )
      expect(await Boba_GasPriceOracle.priceRatio()).to.equal(
        ethers.BigNumber.from(priceRatioAtSlot)
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
    it('should revert if gasPriceOracleAddress is not EOA', async () => {
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
    it('should revert if metaTransactionFee is not EOA', async () => {
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
        const bobaFee = await Boba_GasPriceOracle.getL1BobaFee(input)

        const expected = calculateL1Fee(
          input,
          overhead,
          l1BaseFee,
          scalar,
          decimals
        ).mul(priceRatio)
        expect(bobaFee).to.deep.equal(expected)
      })
    }
  })
})
