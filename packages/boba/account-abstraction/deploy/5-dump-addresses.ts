/* Imports: External */
import { DeployFunction } from 'hardhat-deploy/types'
import path from 'path'
import fs from 'fs'

const deployFn: DeployFunction = async (hre) => {
  const contracts = {}
  const deployments = await hre.deployments.all()

  for (const key in deployments) {
    if (deployments.hasOwnProperty(key)) {
        if (key == 'EntryPoint') {
          contracts['L2_Boba_'+key] = deployments[key].address
        } else {
          contracts['L2_'+key] = deployments[key].address
        }
    }
  }

  const addresses = JSON.stringify(contracts, null, 2)

  console.log(addresses)

  const dumpsPath = path.resolve(__dirname, '../dist/dumps')

  if (!fs.existsSync(dumpsPath)) {
    fs.mkdirSync(dumpsPath, { recursive: true })
  }
  const addrsPath = path.resolve(dumpsPath, 'addresses.json')
  fs.writeFileSync(addrsPath, addresses)
}

deployFn.tags = ['Log', 'required']

export default deployFn
