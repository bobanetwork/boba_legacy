/* Imports: External */
import { DeployFunction, DeploymentSubmission } from 'hardhat-deploy/dist/types'
import { Contract, ContractFactory, utils } from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'
import { registerBobaAddress } from './000-Messenger.deploy'

import preSupportedNFTs from '../preSupportedNFTs.json'
import L1ERC721Json from '../artifacts/contracts/test-helpers/L1ERC721.sol/L1ERC721.json'
import L2ERC721Json from '../artifacts/contracts/standards/L2StandardERC721.sol/L2StandardERC721.json'

let Factory__L2ERC721: ContractFactory
let L2ERC721: Contract

const deployFn: DeployFunction = async (hre) => {
  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  Factory__L2ERC721 = new ContractFactory(
    L2ERC721Json.abi,
    L2ERC721Json.bytecode,
    (hre as any).deployConfig.deployer_l2
  )

  let tokenAddress = null

  for (const token of preSupportedNFTs.supportedTokens) {
    if ((hre as any).deployConfig.network === 'mainnet') {
      tokenAddress = token.address.mainnet

      await registerBobaAddress(
        addressManager,
        'NFT_L1' + token.symbol,
        tokenAddress
      )
      await hre.deployments.save(`NFT_L1${token.name}`, {
        abi: L1ERC721Json.abi,
        address: tokenAddress,
      })
      console.log(`NFT_L1${token.name} is located at ${tokenAddress}`)

      //Set up things on L2 for this NFT
      const L2NFTBridge = await (hre as any).deployments.get('L2NFTBridge')

      L2ERC721 = await Factory__L2ERC721.deploy(
        L2NFTBridge.address,
        tokenAddress,
        token.name,
        token.symbol,
        token.baseURI //base-uri
      )
      await L2ERC721.deployTransaction.wait()

      const L2ERC721DeploymentSubmission: DeploymentSubmission = {
        ...L2ERC721,
        receipt: L2ERC721.receipt,
        address: L2ERC721.address,
        abi: L2ERC721.abi,
      }

      await registerBobaAddress(
        addressManager,
        'NFT_L2' + token.symbol,
        L2ERC721.address
      )
      await hre.deployments.save(
        `NFT_L2${token.name}`,
        L2ERC721DeploymentSubmission
      )
      console.log(`NFT_L2${token.name} was deployed to ${L2ERC721.address}`)
    }
  }
}

deployFn.tags = ['L2ERC721', 'mainnet']

export default deployFn
