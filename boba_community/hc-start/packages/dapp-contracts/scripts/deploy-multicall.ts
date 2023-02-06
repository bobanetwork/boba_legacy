import hre, {artifacts, ethers} from "hardhat";
import {ContractFactory, providers, Wallet} from "ethers";
import MulticallJson from "../artifacts/contracts/Multicall.sol/Multicall.json";
import Multicall2Json from "../artifacts/contracts/Multicall2.sol/Multicall2.json";
const cfg = hre.network.config

async function main() {
  const local_provider = new providers.JsonRpcProvider(cfg['url'])
  const testPrivateKey = process.env.PRIVATE_KEY ?? '0x___________'
  const testWallet = new Wallet(testPrivateKey, local_provider)

  const Factory__Multicall = new ContractFactory(
    MulticallJson.abi,
    MulticallJson.bytecode, testWallet)

  const multicall = await Factory__Multicall.deploy()
  console.log("Multicall contract deployed at", multicall.address)

  const Factory__Multicall2 = new ContractFactory(
    Multicall2Json.abi,
    Multicall2Json.bytecode, testWallet)

  const multicall2 = await Factory__Multicall2.deploy()
  console.log("Multicall2 contract deployed at", multicall2.address)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
