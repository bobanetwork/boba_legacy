/* Imports: External */
import { DeployFunction, DeploymentSubmission } from 'hardhat-deploy/dist/types'
import { Contract, ContractFactory, ethers } from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'
import { registerBobaAddress } from './000-Messenger.deploy'

import TwitterPayContractJson from '@boba/turing-twitter-pay/artifacts/contracts/TwitterPay.sol/TwitterPay.json'
import TuringHelperJson from '@boba/turing-twitter-pay/artifacts/contracts/TuringHelper.sol/TuringHelper.json'
import hre from "hardhat";

let Factory__TwitterPayContract: ContractFactory
let TwitterPayContract: Contract
let TuringHelperContract: Contract

const deployFn: DeployFunction = async (hre) => {
  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  const deployerWallet = (hre as any).deployConfig.deployer_l2


  TuringHelperContract = new Contract(
    (hre as any).deployConfig.BobaTuringHelperAddress,
    TuringHelperJson.abi,
    deployerWallet
  )

  Factory__TwitterPayContract = new ContractFactory(
    TwitterPayContractJson.abi,
    TwitterPayContractJson.bytecode,
    deployerWallet
  )
  console.log(`'Deploying L2 TwitterPay contract...`)

  /*TwitterPayContract = new Contract(
    (hre as any).deployConfig.TwitterPayAddress,
    TwitterPayContractJson.abi,
    (hre as any).deployConfig.deployer_l2
  )*/

  TwitterPayContract = await Factory__TwitterPayContract.deploy(
    'http://dummy_link.io', // needs to be set to a non-localhost IP address before usage
    TuringHelperContract.address,
    10
  )
  await TwitterPayContract.deployTransaction.wait()
  const TwitterPayContractDeploymentSubmission: DeploymentSubmission = {
    ...TwitterPayContract,
    receipt: TwitterPayContract.receipt,
    address: TwitterPayContract.address,
    abi: TwitterPayContract.abi,
  }
  await hre.deployments.save(
    'TwitterPay',
    TwitterPayContractDeploymentSubmission
  )
  console.log(`TwitterPay deployed to: ${TwitterPayContract.address}`)

  // whitelist the new contract in the helper
  const tr1 = await TuringHelperContract.addPermittedCaller(
    TwitterPayContract.address
  )
  const res1 = await tr1.wait()
  console.log('addingPermittedCaller to TuringHelper', res1.events[0].data)


  await registerBobaAddress(
    addressManager,
    'TwitterPay',
    TwitterPayContract.address
  )
}

deployFn.tags = ['TwitterPay', 'required']

export default deployFn
