import hre, {artifacts, ethers} from "hardhat";
import {Contract, ContractFactory, providers, utils, Wallet} from "ethers";
const cfg = hre.network.config

async function main() {
  const local_provider = new providers.JsonRpcProvider(cfg['url'])
  const testPrivateKey = process.env.PRIVATE_KEY ?? '0x___________'
  const testWallet = new Wallet(testPrivateKey, local_provider)

  const contractAddress: string = '0x02C92e7420Ba673ebf0080A6F3ce76D5cd4c854e'
  const isMainnet: boolean = false
  const useFlattened: boolean = false

  const nftMonster = (await ethers.getContractFactory(useFlattened ? "NFTMonsterV2Flat" : "NFTMonsterV2", testWallet))
    .attach(contractAddress);

  await nftMonster.startTrading(); // make NFT tradeable --> don't automatically
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
