import hre, { upgrades } from 'hardhat'
import { Contract, ContractFactory, providers, Wallet } from 'ethers'
import HybridComputeHelperJson from '../artifacts/contracts/HybridComputeHelper.sol/HybridComputeHelper.json'
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
  let WETH
  let Router
  if (hre.network.name === 'boba_rinkeby') {
    BOBAL2Address = '0xF5B97a4860c1D81A1e915C40EcCB5E4a5E6b8309'
    BobaTuringCreditAddress = '0x208c3CE906cd85362bd29467819d3AcbE5FC1614'
    WETH = '0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000'
    Router = '0x4df04E20cCd9a8B82634754fcB041e86c5FF085A'
  } else if (hre.network.name === 'boba_mainnet') {
    BOBAL2Address = '0xa18bF3994C0Cc6E3b63ac420308E5383f53120D7'
    BobaTuringCreditAddress = '0xF8D2f1b0292C0Eeef80D8F47661A9DaCDB4b23bf'
    WETH = '0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000'
    Router = '0x17C83E2B96ACfb5190d63F5E46d93c107eC0b514'
  }

  const HybridComputeHelperFactory = await Factory__HybridComputeHelperFactory.deploy(
    Router, WETH,
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

