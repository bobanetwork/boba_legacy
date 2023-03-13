/* Imports: External */
import { Contract } from 'ethers'
import { DeployFunction } from 'hardhat-deploy/dist/types'
import { getContractFactory } from '@eth-optimism/contracts'
import {
  deployBobaContract,
  getDeploymentSubmission,
  registerBobaAddress,
} from '../src/hardhat-deploy-ethers'

let L2TokenPool: Contract

const deployFn: DeployFunction = async (hre) => {
  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  const TK_L2TEST = await hre.deployments.getOrNull('TK_L2TEST')

  //Deploy L2 token pool for the new token
  L2TokenPool = await deployBobaContract(
    hre,
    'TokenPool',
    [],
    (hre as any).deployConfig.deployer_l2
  )

  const L2TokenPoolDeploymentSubmission = getDeploymentSubmission(L2TokenPool)
  await hre.deployments.save('L2TokenPool', L2TokenPoolDeploymentSubmission)
  await registerBobaAddress(addressManager, 'L2TokenPool', L2TokenPool.address)
  console.log(`L2 TokenPool deployed to: ${L2TokenPool.address}`)

  if (TK_L2TEST === undefined) {
    console.log(
      `!!! L2 TokenPool was not registered because L2TEST was not deployed`
    )
  } else {
    //Register ERC20 token address in L2 token pool
    const registerL2TokenPoolTX = await L2TokenPool.registerTokenAddress(
      TK_L2TEST.address
    )
    await registerL2TokenPoolTX.wait()
    console.log(`L2 TokenPool registered: ${registerL2TokenPoolTX.hash}`)
  }
}

deployFn.tags = ['TokenPool', 'required']
export default deployFn
