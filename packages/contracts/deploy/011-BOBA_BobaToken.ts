/* Imports: External */
import { DeployFunction } from 'hardhat-deploy/dist/types'

/* Imports: Internal */
import { deployAndRegister } from '../src/hardhat-deploy-ethers'

const deployFn: DeployFunction = async (hre) => {
  await deployAndRegister({
    hre,
    name: 'TK_L1BOBA',
    contract: 'BOBA',
    args: [],
  })
}

deployFn.tags = ['L1BobaToken']

export default deployFn
