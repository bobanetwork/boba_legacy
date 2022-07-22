import hre, { artifacts, ethers } from 'hardhat'
import { ContractFactory, providers, Wallet } from 'ethers'
// @ts-ignore
import TuringHelperFactoryJson from './abis/TuringHelperFactory.json'
import { parseEther } from 'ethers/lib/utils'

const cfg = hre.network.config

async function main() {
  const local_provider = new providers.JsonRpcProvider(cfg['url'])
  const testPrivateKey = process.env.PRIVATE_KEY ?? '0x___________'
  const testWallet = new Wallet(testPrivateKey, local_provider)

  const turingFactory = new ContractFactory(
    TuringHelperFactoryJson.abi,
    TuringHelperFactoryJson.bytecode,
    testWallet
  ).attach('0x58dDFB37998584991d8b75F87baf0A3428dD095e')

  // TODO: Approve boba
  const deployTx = await turingFactory.deployMinimal([], parseEther('2'))
  const res = await deployTx.wait()

  console.log('Turing Helper contract deployed at', turingFactory.address, deployTx, res)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
