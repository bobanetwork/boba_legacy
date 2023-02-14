import { expect } from 'chai'
import { SampleRecipient__factory } from '@account-abstraction/utils/dist/src/types'
import { ethers } from 'hardhat'
import { hexValue } from 'ethers/lib/utils'
import { DeterministicDeployer } from '../src/DeterministicDeployer'

const deployer = new DeterministicDeployer(ethers.provider)

describe('#deterministicDeployer', () => {
  it('deploy deployer', async () => {
    expect(await deployer.isDeployerDeployed()).to.equal(false)
    await deployer.deployDeployer()
    expect(await deployer.isDeployerDeployed()).to.equal(true)
  })
  it('should ignore deploy again of deployer', async () => {
    await deployer.deployDeployer()
  })
  it('should deploy at given address', async () => {
    const ctr = hexValue(new SampleRecipient__factory(ethers.provider.getSigner()).getDeployTransaction().data!)
    DeterministicDeployer.init(ethers.provider)
    const addr = await DeterministicDeployer.getAddress(ctr)
    expect(await deployer.isContractDeployed(addr)).to.equal(false)
    await DeterministicDeployer.deploy(ctr)
    expect(await deployer.isContractDeployed(addr)).to.equal(true)
  })
  it('should deploy at given address with ethers.wallet', async () => {
    const randWallet = ethers.Wallet.createRandom();
    const pk = (randWallet._signingKey()).privateKey
    // generate a ethers.wallet to use with sdk
    const testWallet = new ethers.Wallet(pk, ethers.provider)
    // send funds to this wallet
    await ethers.provider.getSigner().sendTransaction({to: testWallet.address, value: ethers.utils.parseEther('0.1')})

    const ctr = hexValue(new SampleRecipient__factory(ethers.provider.getSigner()).getDeployTransaction().data!)
    DeterministicDeployer.init(ethers.provider, testWallet)
    const addr = await DeterministicDeployer.getAddress(ctr, 1)
    expect(await deployer.isContractDeployed(addr)).to.equal(false)
    const preWalletBalance = await ethers.provider.getBalance(testWallet.address)
    await DeterministicDeployer.deploy(ctr, 1)
    const postWalletBalance = await ethers.provider.getBalance(testWallet.address)
    expect(await deployer.isContractDeployed(addr)).to.equal(true)
    // wallet deploys contract
    expect(postWalletBalance).to.lt(preWalletBalance)
  })
})
