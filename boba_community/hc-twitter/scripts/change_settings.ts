import hre, { artifacts, ethers } from 'hardhat'
import { ContractFactory, providers, Wallet } from 'ethers'
// @ts-ignore
import TuringHelperFactoryJson from './abis/TuringHelperFactory.json'
import FaucetFactoryJson from '../artifacts/contracts/AuthenticatedFaucet.sol/AuthenticatedFaucet.json'
import { parseEther } from 'ethers/lib/utils'

const cfg = hre.network.config

async function main() {
  const local_provider = new providers.JsonRpcProvider(cfg['url'])
  const testPrivateKey = process.env.PRIVATE_KEY_FAUCET ?? '0x___________'
  const testWallet = new Wallet(testPrivateKey, local_provider)

  const faucetFactory = new ContractFactory(
    FaucetFactoryJson.abi,
    FaucetFactoryJson.bytecode,
    testWallet
  ).attach('0x5f6D019832FA4522DB7b94A4fe0DDBb73212FAcE')

  console.log("OWNER: ", await faucetFactory.owner())

  /*const helperAddr = await faucetFactory.turingHelper()

  const turingFactory = new ContractFactory(
    TuringHelperFactoryJson.abi,
    TuringHelperFactoryJson.bytecode,
    testWallet
  ).attach(helperAddr)*/

  const tx = await faucetFactory.setConfig('https://o9gvgzsjw5.execute-api.us-east-1.amazonaws.com/Prod/', 10,
    ethers.utils.parseEther('2'), ethers.utils.parseEther('0.02'));
  const res = await tx.wait()
  console.log('updated config', res)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
