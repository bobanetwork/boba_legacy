import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
import { Contract, ContractFactory, utils, BigNumber, constants } from 'ethers'

import xL2GovernanceERC20 from '@boba/contracts/artifacts/contracts/standards/xL2GovernanceERC20.sol/xL2GovernanceERC20.json'
import xL2GovernanceERC20Helper from '@boba/contracts/artifacts/contracts/test-helpers/xL2GovernanceERC20Helper.sol/xL2GovernanceERC20Helper.json'

import { OptimismEnv } from './shared/env'

describe('xBOBA Test', async () => {
  let Factory__xBoba: ContractFactory
  let Factory_xBobaHelper: ContractFactory
  let xBoba: Contract
  let xBobaHelper: Contract

  let env: OptimismEnv

  before(async () => {
    env = await OptimismEnv.new()

    Factory__xBoba = new ContractFactory(
      xL2GovernanceERC20.abi,
      xL2GovernanceERC20.bytecode,
      env.l2Wallet
    )

    Factory_xBobaHelper = new ContractFactory(
      xL2GovernanceERC20Helper.abi,
      xL2GovernanceERC20Helper.bytecode,
      env.l2Wallet
    )

    xBoba = await Factory__xBoba.deploy('xBOBA Token', 'xBOBA', 18)
    await xBoba.deployTransaction.wait()

    xBobaHelper = await Factory_xBobaHelper.deploy(xBoba.address)
    await xBobaHelper.deployTransaction.wait()
  })

  it('{tag:boba} should not be able to transfer ownership for non-owner', async () => {
    await expect(xBoba.connect(env.l2Wallet_2).unpause()).to.be.rejectedWith(
      'Caller is not the owner'
    )
  })

  it('{tag:boba} should not be able to unpause xBoba for non-DAO', async () => {
    await expect(
      xBoba.connect(env.l2Wallet_2).transferOwnership(env.l2Wallet_2.address)
    ).to.be.rejectedWith('Caller is not the owner')
  })

  it('{tag:boba} should not be able to mint or burn xBoba for non-controller', async () => {
    await expect(
      xBoba.connect(env.l2Wallet).mint(env.l2Wallet.address, '1')
    ).to.be.rejectedWith('Only controller can mint and burn')
    await expect(
      xBoba.connect(env.l2Wallet).burn(env.l2Wallet.address, '1')
    ).to.be.rejectedWith('Only controller can mint and burn')
  })

  it('{tag:boba} should not be able to add or delete controller for non-owner', async () => {
    await expect(
      xBoba.connect(env.l2Wallet_2).addController(env.l2Wallet_2.address)
    ).to.be.rejectedWith('Caller is not the owner')
    await expect(
      xBoba.connect(env.l2Wallet_2).deleteController(env.l2Wallet_2.address)
    ).to.be.rejectedWith('Caller is not the owner')
  })

  it('{tag:boba} Should not be able to add EOA accounts as the controller', async () => {
    await expect(xBoba.addController(env.l2Wallet.address)).to.be.rejectedWith(
      'Account not contract'
    )
  })

  it('{tag:boba} Should add controller', async () => {
    const addTx = await xBoba.addController(xBobaHelper.address)
    await addTx.wait()

    const controllerStatus = await xBoba.controllers(xBobaHelper.address)
    expect(controllerStatus).to.be.equal(true)
  })

  it('{tag:boba} Should not be able to add controller twice', async () => {
    await expect(xBoba.addController(xBobaHelper.address)).to.be.eventually
      .rejected

    const controllerStatus = await xBoba.controllers(xBobaHelper.address)
    expect(controllerStatus).to.be.equal(true)
  })

  it('{tag:boba} Should mint xBoba', async () => {
    const mintAmount = 1

    const preBalance = await xBoba.balanceOf(env.l2Wallet_2.address)

    const mintTx = await xBobaHelper.mint(env.l2Wallet_2.address, mintAmount)
    await mintTx.wait()

    const postBalance = await xBoba.balanceOf(env.l2Wallet_2.address)

    expect(preBalance).to.deep.equal(
      postBalance.sub(BigNumber.from(mintAmount))
    )
  })

  it('{tag:boba} should not be able to transfer or approve xBoba when it is paused', async () => {
    await expect(
      xBoba.connect(env.l2Wallet_2).transfer(env.l2Wallet.address, 1)
    ).to.be.rejectedWith('Pausable: paused')
    await expect(
      xBoba.connect(env.l2Wallet_2).approve(env.l2Wallet.address, 1)
    ).to.be.rejectedWith('Pausable: paused')
  })

  it('{tag:boba} Should transfer DAO', async () => {
    const transferTx = await xBoba
      .connect(env.l2Wallet)
      .transferDAO(xBobaHelper.address)
    await transferTx.wait()

    const DAO = await xBoba.DAO()
    expect(DAO).to.equal(xBobaHelper.address)
  })

  it('{tag:boba} Should unpause the xBoba', async () => {
    const payload = await xBoba.populateTransaction.unpause()
    const unpauseTx = await xBobaHelper.connect(env.l2Wallet).call(payload.data)
    await unpauseTx.wait()

    const pauseStatus = await xBoba.paused()
    expect(pauseStatus).to.equal(false)
  })

  it('{tag:boba} Should be able to approve and transfer xBoba', async () => {
    const transferAmount = 1

    const preAllowance = await xBoba.allowance(
      env.l2Wallet_2.address,
      env.addressesBOBA.Proxy__L2LiquidityPool
    )

    const approveTx = await xBoba
      .connect(env.l2Wallet_2)
      .approve(env.addressesBOBA.Proxy__L2LiquidityPool, transferAmount)
    await approveTx.wait()

    const postAllowance = await xBoba.allowance(
      env.l2Wallet_2.address,
      env.addressesBOBA.Proxy__L2LiquidityPool
    )

    expect(preAllowance).to.be.deep.equal(
      postAllowance.sub(BigNumber.from(transferAmount))
    )

    const preBalance = await xBoba.balanceOf(
      env.addressesBOBA.Proxy__L2LiquidityPool
    )

    const transferTx = await xBoba
      .connect(env.l2Wallet_2)
      .transfer(env.addressesBOBA.Proxy__L2LiquidityPool, transferAmount)
    await transferTx.wait()

    const postBalance = await xBoba.balanceOf(
      env.addressesBOBA.Proxy__L2LiquidityPool
    )

    expect(preBalance).to.be.deep.equal(
      postBalance.sub(BigNumber.from(transferAmount))
    )
  })

  it('Should pause the xBoba', async () => {
    const payload = await xBoba.populateTransaction.pause()
    const pauseTx = await xBobaHelper.connect(env.l2Wallet).call(payload.data)
    await pauseTx.wait()

    const pauseStatus = await xBoba.paused()
    expect(pauseStatus).to.equal(true)
  }).retries(3)

  it('{tag:boba} Should delete the controller', async () => {
    const deleteTx = await xBoba.deleteController(xBobaHelper.address)
    await deleteTx.wait()

    const controllerStatus = await xBoba.controllers(xBobaHelper.address)
    expect(controllerStatus).to.be.equal(false)
  })
})
