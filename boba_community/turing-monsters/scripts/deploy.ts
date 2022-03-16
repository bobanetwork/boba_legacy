import hre, {artifacts, ethers} from "hardhat";
import {ContractFactory, providers, Wallet} from "ethers";
import TuringHelperJson from "../artifacts/contracts/TuringHelper.sol/TuringHelper.json";
const cfg = hre.network.config

async function main() {
  const local_provider = new providers.JsonRpcProvider(cfg['url'])
  const testPrivateKey = process.env.PRIVATE_KEY ?? '0x___________'
  const testWallet = new Wallet(testPrivateKey, local_provider)

  const Factory__Helper = new ContractFactory(
    TuringHelperJson.abi,
    TuringHelperJson.bytecode, testWallet)

  const helper = await Factory__Helper.deploy()
  console.log("Turing Helper contract deployed at", helper.address)

  const NFTMonsterV2 = await ethers.getContractFactory("NFTMonsterV2");
  const nftMonster = await NFTMonsterV2.deploy(
    "TuringMonster",
    "BOO",
    100,
    ['0x4B45C30b8c4fAEC1c8eAaD5398F8b8e91BFbac15'],
    helper.address,
    {});
  await nftMonster.deployed();

  console.log("TuringMonsters deployed at", nftMonster.address)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
