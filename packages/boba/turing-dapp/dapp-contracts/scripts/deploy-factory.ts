import hre, {upgrades} from "hardhat";
import {Contract, ContractFactory, providers, Wallet} from "ethers";
import TuringHelperJson from "../artifacts/contracts/TuringHelper.sol/TuringHelper.json";
import TuringHelperFactoryJson from "../artifacts/contracts/TuringHelperFactory.sol/TuringHelperFactory.json";
const cfg = hre.network.config

async function main() {
  const local_provider = new providers.JsonRpcProvider(cfg['url'])
  const testPrivateKey = process.env.PRIVATE_KEY ?? '0x___________'
  const testWallet = new Wallet(testPrivateKey, local_provider)

  const Factory__TuringHelper = new ContractFactory(
    TuringHelperJson.abi,
    TuringHelperJson.bytecode, testWallet)

  const turingHelper: Contract = await upgrades.deployProxy(Factory__TuringHelper)
  // const initTx = await turingHelper.initialize(testWallet.address)
  // await initTx.wait()

  console.log("TuringHelper contract deployed at", turingHelper.address)
  const implementationTuringHelper = await upgrades.erc1967.getImplementationAddress(turingHelper.address)
  console.log("TuringHelper Implementation deployed to:", implementationTuringHelper)

  const Factory__TuringHelperFactory = new ContractFactory(
    TuringHelperFactoryJson.abi,
    TuringHelperFactoryJson.bytecode, testWallet)

  const turingHelperFactory = await Factory__TuringHelperFactory.deploy(implementationTuringHelper)
  console.log("TuringHelperFactory contract deployed at", turingHelperFactory.address)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
