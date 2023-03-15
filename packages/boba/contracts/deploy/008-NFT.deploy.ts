/* Imports: External */
import { DeployFunction, DeploymentSubmission } from 'hardhat-deploy/dist/types'
import { Contract, ContractFactory, utils, BigNumber } from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'
import chalk from 'chalk'
import { registerBobaAddress } from './000-Messenger.deploy'

import L2ERC721Json from '../artifacts/contracts/ERC721Genesis.sol/ERC721Genesis.json'
import L2ERC721RegJson from '../artifacts/contracts/ERC721Registry.sol/ERC721Registry.json'

let Factory__L2ERC721: ContractFactory
let L2ERC721: Contract

let Factory__L2ERC721Reg: ContractFactory
let L2ERC721Reg: Contract

const nftName = 'TestNFT'
const nftSymbol = 'TST'

const deployFn: DeployFunction = async (hre) => {
  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  Factory__L2ERC721 = new ContractFactory(
    L2ERC721Json.abi,
    L2ERC721Json.bytecode,
    (hre as any).deployConfig.deployer_l2
  )

  L2ERC721 = await Factory__L2ERC721.deploy(
    nftName,
    nftSymbol,
    BigNumber.from(String(0)), //starting index for the tokenIDs
    '0x0000000000000000000000000000000000000000',
    'Genesis',
    'BOBA_Rinkeby_28'
  )
  await L2ERC721.deployTransaction.wait()
  console.log(`NFT L2ERC721 deployed to: ${L2ERC721.address}`)

  const L2ERC721DeploymentSubmission: DeploymentSubmission = {
    ...L2ERC721,
    receipt: L2ERC721.receipt,
    address: L2ERC721.address,
    abi: L2ERC721.abi,
  }

  const owner = await L2ERC721.owner()
  console.log(`ERC721 owner: ${owner}`)

  await registerBobaAddress(addressManager, 'L2ERC721', L2ERC721.address)
  await hre.deployments.save('L2ERC721', L2ERC721DeploymentSubmission)

  Factory__L2ERC721Reg = new ContractFactory(
    L2ERC721RegJson.abi,
    L2ERC721RegJson.bytecode,
    (hre as any).deployConfig.deployer_l2
  )

  L2ERC721Reg = await Factory__L2ERC721Reg.deploy()
  await L2ERC721Reg.deployTransaction.wait()
  console.log(`NFT L2ERC721 Reg deployed to: ${L2ERC721Reg.address}`)

  const L2ERC721RegDeploymentSubmission: DeploymentSubmission = {
    ...L2ERC721Reg,
    receipt: L2ERC721Reg.receipt,
    address: L2ERC721Reg.address,
    abi: L2ERC721Reg.abi,
  }
  await registerBobaAddress(addressManager, 'L2ERC721Reg', L2ERC721Reg.address)
  await hre.deployments.save('L2ERC721Reg', L2ERC721RegDeploymentSubmission)
}

deployFn.tags = ['L2ERC721', 'L2ERC721Reg', 'optional']
export default deployFn
