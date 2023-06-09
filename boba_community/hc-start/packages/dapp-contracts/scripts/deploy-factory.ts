import hre, { upgrades } from 'hardhat'
import { Contract, ContractFactory, providers, Wallet } from 'ethers'
import HybridComputeHelperJson from '../artifacts/contracts/TuringHelper.sol/TuringHelper.json'
import HybridComputeHelperFactoryJson from '../artifacts/contracts/HybridComputeHelperFactory.sol/HybridComputeHelperFactory.json'
const cfg = hre.network.config

async function main() {
  const local_provider = new providers.JsonRpcProvider(cfg['url'])
  const testPrivateKey = process.env.PRIVATE_KEY ?? '0x___________'
  const testWallet = new Wallet(testPrivateKey, local_provider)

  const Factory__HybridComputeHelper = new ContractFactory(
    HybridComputeHelperJson.abi,
    HybridComputeHelperJson.bytecode,
    testWallet
  )

  const HybridComputeHelper: Contract = await upgrades.deployProxy(
    Factory__HybridComputeHelper
  )
  // const initTx = await HybridComputeHelper.initialize(testWallet.address)
  // await initTx.wait()

  console.log('HybridComputeHelper contract deployed at', HybridComputeHelper.address)
  const implementationHybridComputeHelper =
    await upgrades.erc1967.getImplementationAddress(HybridComputeHelper.address)
  console.log(
    'HybridComputeHelper Implementation deployed to:',
    implementationHybridComputeHelper
  )

  const Factory__HybridComputeHelperFactory = new ContractFactory(
    HybridComputeHelperFactoryJson.abi,
    HybridComputeHelperFactoryJson.bytecode,
    testWallet
  )

  let BOBAL2Address
  let BobaTuringCreditAddress
  if (hre.network.name === 'boba_goerli') {
    BOBAL2Address = '0x4200000000000000000000000000000000000023'
    BobaTuringCreditAddress = '0x4200000000000000000000000000000000000020'
  } else if (hre.network.name === 'boba_mainnet') {
    BOBAL2Address = '0xa18bF3994C0Cc6E3b63ac420308E5383f53120D7'
    BobaTuringCreditAddress = '0xF8D2f1b0292C0Eeef80D8F47661A9DaCDB4b23bf'
  }

  const HybridComputeHelperFactory = await Factory__HybridComputeHelperFactory.deploy(
    BOBAL2Address,
    implementationHybridComputeHelper,
    BobaTuringCreditAddress
  )
  console.log(
    'HybridComputeHelperFactory contract deployed at',
    HybridComputeHelperFactory.address
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

