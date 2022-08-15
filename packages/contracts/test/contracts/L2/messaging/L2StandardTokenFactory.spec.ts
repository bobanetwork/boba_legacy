import { expect } from '../../../setup'

/* External Imports */
import { ethers } from 'hardhat'
import { Signer, ContractFactory, Contract } from 'ethers'
import { smoddit } from '@eth-optimism/smock'

/* Internal Imports */
import { predeploys, getContractInterface } from '../../../../src'

describe('L2StandardTokenFactory', () => {
  let signer: Signer
  let Factory__L1ERC20: ContractFactory
  let L1ERC20: Contract
  let L2StandardTokenFactory: Contract
  before(async () => {
    ;[signer] = await ethers.getSigners()
    // deploy an ERC20 contract on L1
    Factory__L1ERC20 = await smoddit(
      '@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20'
    )
    L1ERC20 = await Factory__L1ERC20.deploy('L1ERC20', 'ERC')

    L2StandardTokenFactory = await (
      await ethers.getContractFactory('L2StandardTokenFactory')
    ).deploy()
  })

  describe('Standard token factory', () => {
    it('should be able to create a standard token', async () => {
      const tx = await L2StandardTokenFactory.createStandardL2Token(
        L1ERC20.address,
        'L2ERC20',
        'ERC',
        18
      )
      const receipt = await tx.wait()
      const [tokenCreatedEvent] = receipt.events

      // Expect there to be an event emmited for the standard token creation
      expect(tokenCreatedEvent.event).to.be.eq('StandardL2TokenCreated')

      // Get the L2 token address from the emmited event and check it was created correctly
      const l2TokenAddress = tokenCreatedEvent.args._l2Token
      const l2Token = new Contract(
        l2TokenAddress,
        getContractInterface('L2StandardERC20'),
        signer
      )

      expect(await l2Token.l2Bridge()).to.equal(predeploys.L2StandardBridge)
      expect(await l2Token.l1Token()).to.equal(L1ERC20.address)
      expect(await l2Token.name()).to.equal('L2ERC20')
      expect(await l2Token.symbol()).to.equal('ERC')
    })

    it('should not be able to create a standard token with a 0 address for l1 token', async () => {
      await expect(
        L2StandardTokenFactory.createStandardL2Token(
          ethers.constants.AddressZero,
          'L2ERC20',
          'ERC',
          18
        )
      ).to.be.revertedWith('Must provide L1 token address')
    })
  })

  describe('Standard Layer Zero token factory', () => {
    it('should be able to create a standard token', async () => {
      const tx = await L2StandardTokenFactory.createStandardLayerZeroL2Token(
        L1ERC20.address,
        'L2ERC20',
        'ERC',
        18
      )
      const receipt = await tx.wait()
      // [OwnershipTransferred, OwnershipTransferred, StandardL2TokenCreated]
      const tokenCreatedEvent = receipt.events[2]

      // Expect there to be an event emmited for the standard token creation
      expect(tokenCreatedEvent.event).to.be.eq(
        'StandardLayerZeroL2TokenCreated'
      )

      // Get the L2 token address from the emmited event and check it was created correctly
      const l2TokenAddress = tokenCreatedEvent.args._l2Token
      const l2Token = new Contract(
        l2TokenAddress,
        getContractInterface('L2StandardERC20LayerZero'),
        signer
      )

      expect(await l2Token.l2Bridge()).to.equal(predeploys.L2StandardBridge)
      expect(await l2Token.l1Token()).to.equal(L1ERC20.address)
      expect(await l2Token.name()).to.equal('L2ERC20')
      expect(await l2Token.symbol()).to.equal('ERC')
      expect(await l2Token.owner()).to.be.equal(await signer.getAddress())
    })

    it('should not be able to create a standard token with a 0 address for l1 token', async () => {
      await expect(
        L2StandardTokenFactory.createStandardLayerZeroL2Token(
          ethers.constants.AddressZero,
          'L2ERC20',
          'ERC',
          18
        )
      ).to.be.revertedWith('Must provide L1 token address')
    })
  })
})
