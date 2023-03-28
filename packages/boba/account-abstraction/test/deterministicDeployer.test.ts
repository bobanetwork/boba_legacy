import { expect } from 'chai'
import { ethers } from 'hardhat'
import { hexValue } from 'ethers/lib/utils'
import { DeterministicDeployer } from '../src/DeterministicDeployer'
import { TestCounter__factory } from '../typechain/factories/contracts/test/TestCounter__factory'

const deployer = new DeterministicDeployer(ethers.provider)

describe('#deterministicDeployer', () => {
  it('should ignore deploy again of deployer', async () => {
    await deployer.deployDeployer()
    expect(await deployer.isDeployerDeployed()).to.equal(true)
  })
  it('should deploy at given address', async () => {
    const testCounter = await new TestCounter__factory(
      ethers.provider.getSigner()
    ).getDeployTransaction().data!
    const ctr = hexValue(testCounter)
    DeterministicDeployer.init(ethers.provider)
    const addr = await DeterministicDeployer.getAddress(ctr)
    expect(await deployer.isContractDeployed(addr)).to.equal(false)
    await DeterministicDeployer.deploy(ctr)
    expect(await deployer.isContractDeployed(addr)).to.equal(true)
  })
  it('should deploy at given address with ethers.wallet', async () => {
    const randWallet = ethers.Wallet.createRandom()
    const pk = randWallet._signingKey().privateKey
    // generate a ethers.wallet to use with sdk
    const testWallet = new ethers.Wallet(pk, ethers.provider)
    // send funds to this wallet
    const val = ethers.utils.parseEther('0.01')
    await ethers.provider.getSigner().sendTransaction({
      to: testWallet.address,
      value: val
    })

    const testCounter = await new TestCounter__factory(
      ethers.provider.getSigner()
    ).getDeployTransaction().data!
    const ctr = hexValue(testCounter)
    DeterministicDeployer.init(ethers.provider, testWallet)
    const addr = await DeterministicDeployer.getAddress(ctr, 1)
    expect(await deployer.isContractDeployed(addr)).to.equal(false)
    const preWalletBalance = await ethers.provider.getBalance(
      testWallet.address
    )
    await DeterministicDeployer.deploy(ctr, 1)
    const postWalletBalance = await ethers.provider.getBalance(
      testWallet.address
    )
    expect(await deployer.isContractDeployed(addr)).to.equal(true)
    // wallet deploys contract
    expect(postWalletBalance).to.lt(preWalletBalance)
  })
  it('should update factories according to network', async () => {
    const randWallet = ethers.Wallet.createRandom()
    const pk = randWallet._signingKey().privateKey
    const testWallet = new ethers.Wallet(pk, ethers.provider)
    const dep = new DeterministicDeployer(
      ethers.provider,
      testWallet,
      'boba_mainnet'
    )
    expect(dep.proxyAddress).to.eq('0x914d7Fec6aaC8cd542e72Bca78B30650d45643d7')
    expect(dep.deploymentTransaction).to.eq(
      '0xf8a7808504a817c800830186a08080b853604580600e600039806000f350fe7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf3820264a02836f16b67fdf74d02d4d9548495cffd739f509b9bc4b8fdffd2611c38489642a07864709b3f830a661897f4d60d98efc26754f44be447cf35a65ff92a06cb7bd0'
    )
    expect(dep.deploymentSignerAddress).to.eq(
      '0xE1CB04A0fA36DdD16a06ea828007E35e1a3cBC37'
    )
  })
})
