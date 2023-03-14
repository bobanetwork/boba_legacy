/* Imports: External */
import { Contract } from 'ethers'
import { DeployFunction } from 'hardhat-deploy/dist/types'
import { getContractFactory } from '@eth-optimism/contracts'
import {
  deployBobaContract,
  getDeploymentSubmission,
  registerBobaAddress,
  getBobaContractAt,
  getBobaContractABI,
} from '../src/hardhat-deploy-ethers'

import preSupportedNFTs from '../preSupportedNFTs.json'

let L1ERC721: Contract
let L2ERC721: Contract

const deployFn: DeployFunction = async (hre) => {
  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  let tokenAddress = null

  for (const token of preSupportedNFTs.supportedTokens) {
    if ((hre as any).deployConfig.network === 'mainnet') {
      tokenAddress = token.address.mainnet

      L1ERC721 = await getBobaContractAt(
        'L1ERC721',
        tokenAddress,
        (hre as any).deployConfig.deployer_l1
      )

      await registerBobaAddress(
        addressManager,
        'NFT_L1' + token.symbol,
        tokenAddress
      )
      await hre.deployments.save(`NFT_L1${token.name}`, {
        abi: getBobaContractABI('L1ERC721'),
        address: tokenAddress,
      })
      console.log(`NFT_L1${token.name} is located at ${tokenAddress}`)

      //Set up things on L2 for this NFT
      const L2NFTBridge = await (hre as any).deployments.get('L2NFTBridge')

      L2ERC721 = await deployBobaContract(
        hre,
        'L2StandardERC721',
        [
          L2NFTBridge.address,
          tokenAddress,
          token.name,
          token.symbol,
          token.baseURI, //base-uri
        ],
        (hre as any).deployConfig.deployer_l2
      )

      const L2ERC721DeploymentSubmission = getDeploymentSubmission(L2ERC721)

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
