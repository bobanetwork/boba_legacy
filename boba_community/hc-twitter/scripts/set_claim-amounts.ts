import hre, { artifacts } from 'hardhat'
import { ContractFactory, providers, Wallet } from 'ethers'
// @ts-ignore
import TuringHelperFactoryJson from './abis/TuringHelperFactory.json'
import TwitterAuthenticatedFaucet from '../artifacts/contracts/AuthenticatedFaucet.sol/AuthenticatedFaucet.json'
import { parseEther } from 'ethers/lib/utils'

const cfg = hre.network.config

async function main() {
  const local_provider = new providers.JsonRpcProvider(cfg['url'])
  const testPrivateKey = process.env.PRIVATE_KEY ?? '0x___________'
  const testWallet = new Wallet(testPrivateKey, local_provider)

  const twitterFactory = new ContractFactory(
    TwitterAuthenticatedFaucet.abi,
    TwitterAuthenticatedFaucet.bytecode,
    testWallet
  ).attach(process.env.FAUCET_ADDRESS)

  const deployTx = await twitterFactory.setConfig(
    process.env.TURING_ENDPOINT, 10,
    parseEther('1'), parseEther('0.1')
  )
  const res = await deployTx.wait()

  console.log('Have set config..')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
