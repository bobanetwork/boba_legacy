import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
import { ethers } from 'hardhat'
import {
  Contract,
  Signer,
  BigNumber,
  utils,
  BigNumberish,
  ContractFactory,
} from 'ethers'

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
        ethers.utils.parseEther('100')
      )
    })

    it.only('should revert when initialize again', async () => {
      await expect(
        Proxy__Teleportation.initialize(
          L2Boba.address,
          ethers.utils.parseEther('1'),
          ethers.utils.parseEther('100')
        )
      ).to.be.revertedWith('Contract has been initialized')
    })
  })
})
