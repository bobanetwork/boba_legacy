import hre, { artifacts, ethers } from 'hardhat'
import {Contract, ContractFactory, providers, Wallet} from 'ethers'
// @ts-ignore
import TuringHelperFactoryJson from './abis/TuringHelperFactory.json'
import FaucetFactoryJson from '../artifacts/contracts/AuthenticatedFaucet.sol/AuthenticatedFaucet.json'
import { parseEther } from 'ethers/lib/utils'
import L2GovernanceERC20Json
  from "@eth-optimism/contracts/artifacts/contracts/standards/L2GovernanceERC20.sol/L2GovernanceERC20.json";
import BobaTuringCreditJson
  from "@eth-optimism/contracts/artifacts/contracts/L2/predeploys/BobaTuringCredit.sol/BobaTuringCredit.json";

const cfg = hre.network.config

async function main() {
  const local_provider = new providers.JsonRpcProvider(cfg['url'])
  const testPrivateKey = process.env.PRIVATE_KEY_FAUCET ?? '0x___________'
  const testWallet = new Wallet(testPrivateKey, local_provider)

  const faucetFactory = new ContractFactory(
    FaucetFactoryJson.abi,
    FaucetFactoryJson.bytecode,
    testWallet
  ).attach(process.env.FAUCET_ADDRESS ?? '0x4E98bAbe5364452cD02FC8E0AD7d9E526B68a5D6')

  console.log("OWNER: ", await faucetFactory.owner())

  const helperAddr = await faucetFactory.turingHelper()

  const turingFactory = new ContractFactory(
    TuringHelperFactoryJson.abi,
    TuringHelperFactoryJson.bytecode,
    testWallet
  ).attach(helperAddr)

  const tx = await faucetFactory.setConfig('https://zci1n9pde8.execute-api.us-east-1.amazonaws.com/Prod/', 10,
    ethers.utils.parseEther('0.02'), ethers.utils.parseEther('2'));
  const res = await tx.wait()
  console.log('updated config', res)
/*
  const BOBAL2Address = '0x4200000000000000000000000000000000000023'
  const BobaTuringCreditAddress = '0x4200000000000000000000000000000000000020'

  const L2BOBAToken = new Contract(
    BOBAL2Address,
    L2GovernanceERC20Json.abi,
    testWallet
  );

  const Factory__BobaTuringCredit = new ContractFactory(
    BobaTuringCreditJson.abi,
    BobaTuringCreditJson.bytecode,
    testWallet
  );

  const turingCredit = await Factory__BobaTuringCredit.attach(
    BobaTuringCreditAddress
  );

  const depositAmount = ethers.utils.parseEther('50')
  const approveTx = await L2BOBAToken.approve(
    turingCredit.address,
    depositAmount
  );
  await approveTx.wait();

  const depositTx = await turingCredit.addBalanceTo(
    depositAmount,
    helperAddr
  );
  await depositTx.wait();*/
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
