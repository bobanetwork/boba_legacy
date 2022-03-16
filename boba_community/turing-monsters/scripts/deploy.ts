import hre, {artifacts, ethers} from "hardhat";
import {Contract, ContractFactory, providers, utils, Wallet} from "ethers";
import TuringHelperJson from "../artifacts/contracts/TuringHelper.sol/TuringHelper.json";
import {getContractFactory} from "@eth-optimism/contracts";
const cfg = hre.network.config
import L2GovernanceERC20Json from '@boba/contracts/artifacts/contracts/standards/L2GovernanceERC20.sol/L2GovernanceERC20.json'

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

  await nftMonster.startTrading(); // make NFT tradeable

  // white list your ERC721 contract in your helper
  // this is for your own security, so that only your contract can call your helper
  const tr1 = await helper.addPermittedCaller(nftMonster.address)
  const res1 = await tr1.wait()
  console.log("adding your ERC721 as PermittedCaller to TuringHelper", res1.events[0].data)

  const BobaTuringCreditRinkebyAddress = '0x208c3CE906cd85362bd29467819d3AcbE5FC1614'
  const turingCredit = getContractFactory(
    'BobaTuringCredit',
    testWallet
  ).attach(BobaTuringCreditRinkebyAddress)

  const BOBAL2Address = '0xF5B97a4860c1D81A1e915C40EcCB5E4a5E6b8309'
  const L2BOBAToken = new Contract(
    BOBAL2Address,
    L2GovernanceERC20Json.abi,
    testWallet
  )

  const depositAmount = utils.parseEther('1')

  const bobaBalance = await L2BOBAToken.balanceOf(testWallet.address)
  console.log("BOBA Balance in your account", bobaBalance.toString())

  const approveTx = await L2BOBAToken.approve(
    turingCredit.address,
    depositAmount
  )
  await approveTx.wait()

  const depositTx = await turingCredit.addBalanceTo(
    depositAmount,
    helper.address
  )
  await depositTx.wait()

  const postBalance = await turingCredit.prepaidBalance(
    helper.address
  )
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
