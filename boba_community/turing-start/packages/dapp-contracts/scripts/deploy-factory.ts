import hre, { upgrades } from 'hardhat'
import { Contract, ContractFactory, providers, Wallet } from 'ethers'
import TuringHelperJson from '../artifacts/contracts/TuringHelper.sol/TuringHelper.json'
import TuringHelperFactoryJson from '../artifacts/contracts/TuringHelperFactory.sol/TuringHelperFactory.json'
const cfg = hre.network.config

async function main() {
  const local_provider = new providers.JsonRpcProvider(cfg['url'])
  const testPrivateKey = process.env.PRIVATE_KEY ?? '0x___________'
  const testWallet = new Wallet(testPrivateKey, local_provider)

  const Factory__TuringHelper = new ContractFactory(
    TuringHelperJson.abi,
    TuringHelperJson.bytecode,
    testWallet
  )

  const turingHelper: Contract = await upgrades.deployProxy(
    Factory__TuringHelper
  )
  // const initTx = await turingHelper.initialize(testWallet.address)
  // await initTx.wait()

  console.log('TuringHelper contract deployed at', turingHelper.address)
  const implementationTuringHelper =
    await upgrades.erc1967.getImplementationAddress(turingHelper.address)
  console.log(
    'TuringHelper Implementation deployed to:',
    implementationTuringHelper
  )

  const Factory__TuringHelperFactory = new ContractFactory(
    TuringHelperFactoryJson.abi,
    TuringHelperFactoryJson.bytecode,
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

  const turingHelperFactory = await Factory__TuringHelperFactory.deploy(
    Router, WETH,
    BOBAL2Address,
    implementationTuringHelper,
    BobaTuringCreditAddress
  )
  console.log(
    'TuringHelperFactory contract deployed at',
    turingHelperFactory.address
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

