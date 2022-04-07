import hre, { artifacts, ethers } from 'hardhat'
import { ContractFactory, providers, Wallet } from 'ethers'
import TuringHelperJson from '../artifacts/contracts/TuringHelper.sol/TuringHelper.json'
import TalkWithQuantumComputersJson from '../artifacts/contracts/TalkWithQuantumComputers.sol/TalkWithQuantumComputers.json'
const cfg = hre.network.config

async function main() {
  const local_provider = new providers.JsonRpcProvider(cfg['url'])
  const testPrivateKey = process.env.PRIVATE_KEY ?? '0x___________'
  const testWallet = new Wallet(testPrivateKey, local_provider)

  const Factory__Helper = new ContractFactory(
    TuringHelperJson.abi,
    TuringHelperJson.bytecode,
    testWallet
  )

  const helper = await Factory__Helper.deploy()
  console.log('Turing Helper contract deployed at', helper.address)

  const Factory__Quantum = new ContractFactory(
    TalkWithQuantumComputersJson.abi,
    TalkWithQuantumComputersJson.bytecode,
    testWallet
  )

  const quantum = await Factory__Quantum.deploy(helper.address)
  console.log('Quantum contract deployed at', quantum.address)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
