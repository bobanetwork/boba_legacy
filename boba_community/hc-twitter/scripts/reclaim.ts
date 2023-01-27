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
  ).attach('0x3A37a31Ee451049Db7dcc8785782A9506a59bF78')

  console.log("OWNER: ", await faucetFactory.owner())

  /*const helperAddr = await faucetFactory.turingHelper()

  const turingFactory = new ContractFactory(
    TuringHelperFactoryJson.abi,
    TuringHelperFactoryJson.bytecode,
    testWallet
  ).attach(helperAddr)*/

  const deployTx = await faucetFactory.withdraw()
  const res = await deployTx.wait()

  console.log('Withdrew at ', faucetFactory.address, deployTx, res)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
