import { BigNumber, Contract, ContractFactory, utils, Wallet } from 'ethers'
import { ethers } from 'hardhat'

import { OptimismEnv } from './shared/env'
import { expect } from './shared/setup'

describe('Contract interactions', () => {
  let env: OptimismEnv

  let Factory__ERC20: ContractFactory

  let otherWallet: Wallet

  before(async () => {
    env = await OptimismEnv.new()

    Factory__ERC20 = await ethers.getContractFactory('ERC20', env.l2Wallet)

    otherWallet = Wallet.createRandom().connect(env.l2Wallet.provider)
    await env.l2Wallet.sendTransaction({
      to: otherWallet.address,
      value: utils.parseEther('0.1'),
    })
  })

  describe('ERC20s', () => {
    let contract: Contract

    before(async () => {
      Factory__ERC20 = await ethers.getContractFactory('ERC20', env.l2Wallet)
    })

    it('{tag:boba} should successfully deploy the contract', async () => {
      contract = await Factory__ERC20.deploy(100000000, 'OVM Test', 8, 'OVM')
      await contract.deployed()
    })

    it('{tag:boba} should support approvals', async () => {
      const spender = '0x' + '22'.repeat(20)
      const tx = await contract.approve(spender, 1000)
      await tx.wait()
      let allowance = await contract.allowance(env.l2Wallet.address, spender)
      expect(allowance).to.deep.equal(BigNumber.from(1000))
      allowance = await contract.allowance(otherWallet.address, spender)
      expect(allowance).to.deep.equal(BigNumber.from(0))

      const logs = await contract.queryFilter(
        contract.filters.Approval(env.l2Wallet.address),
        1,
        'latest'
      )
      expect(logs[0].args._owner).to.equal(env.l2Wallet.address)
      expect(logs[0].args._spender).to.equal(spender)
      expect(logs[0].args._value).to.deep.equal(BigNumber.from(1000))
    })

    it('{tag:boba} should support transferring balances', async () => {
      const tx = await contract.transfer(otherWallet.address, 1000)
      await tx.wait()
      const balFrom = await contract.balanceOf(env.l2Wallet.address)
      const balTo = await contract.balanceOf(otherWallet.address)
      expect(balFrom).to.deep.equal(BigNumber.from(100000000).sub(1000))
      expect(balTo).to.deep.equal(BigNumber.from(1000))

      const logs = await contract.queryFilter(
        contract.filters.Transfer(env.l2Wallet.address),
        1,
        'latest'
      )
      expect(logs[0].args._from).to.equal(env.l2Wallet.address)
      expect(logs[0].args._to).to.equal(otherWallet.address)
      expect(logs[0].args._value).to.deep.equal(BigNumber.from(1000))
    })

    it('{tag:boba} should support being self destructed', async () => {
      const tx = await contract.destroy()
      await tx.wait()
      const code = await env.l2Wallet.provider.getCode(contract.address)
      expect(code).to.equal('0x')
    })
  })
})
