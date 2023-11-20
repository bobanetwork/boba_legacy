/* Imports: External */
import { Contract, BigNumber } from 'ethers'
import { DeployFunction } from 'hardhat-deploy/dist/types'
import { getContractFactory } from '@bobanetwork/core_contracts'
import {
  deployBobaContract,
  getDeploymentSubmission,
  registerBobaAddress,
} from '../src/hardhat-deploy-ethers'

let L2ERC721: Contract
let L2ERC721Reg: Contract

const nftName = 'TestNFT'
const nftSymbol = 'TST'

const deployFn: DeployFunction = async (hre) => {
  if ((hre as any).deployConfig.isLightMode) {
    console.log('Skipping deployment function as in light mode..')
    return;
  }

  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  L2ERC721 = await deployBobaContract(
    hre,
    'ERC721Genesis',
    [
      nftName,
      nftSymbol,
      BigNumber.from(String(0)), //starting index for the tokenIDs
      '0x0000000000000000000000000000000000000000',
      'Genesis',
      'BOBA_Rinkeby_28',
    ],
    (hre as any).deployConfig.deployer_l2
  )
  console.log(`NFT L2ERC721 deployed to: ${L2ERC721.address}`)

  const L2ERC721DeploymentSubmission = getDeploymentSubmission(L2ERC721)
  const owner = await L2ERC721.owner()
  console.log(`ERC721 owner: ${owner}`)

  await registerBobaAddress(addressManager, 'L2ERC721', L2ERC721.address)
  await hre.deployments.save('L2ERC721', L2ERC721DeploymentSubmission)

  L2ERC721Reg = await deployBobaContract(
    hre,
    'ERC721Registry',
    [],
    (hre as any).deployConfig.deployer_l2
  )
  console.log(`NFT L2ERC721 Reg deployed to: ${L2ERC721Reg.address}`)

  const L2ERC721RegDeploymentSubmission = getDeploymentSubmission(L2ERC721Reg)
  await registerBobaAddress(addressManager, 'L2ERC721Reg', L2ERC721Reg.address)
  await hre.deployments.save('L2ERC721Reg', L2ERC721RegDeploymentSubmission)
}

deployFn.tags = ['L2ERC721', 'L2ERC721Reg', 'optional']
export default deployFn
