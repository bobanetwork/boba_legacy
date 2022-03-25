/* Imports: External */
import { DeployFunction } from 'hardhat-deploy/dist/types'
import path from 'path'
import fs from 'fs'

const deployFn: DeployFunction = async (hre) => {
  const contracts = {}

  contracts['TOKENS'] = {}
  contracts['NFTs'] = {}

  const deployments = await hre.deployments.all()

  for (const key in deployments) {
    if (deployments.hasOwnProperty(key)) {
      const regex = /TK_L(1|2)([A-Z]+)/i
      const regexNFT = /NFT_L(1|2)([A-Z_]+)/i
      const tokenMatch = key.match(regex)
      const nftMatch = key.match(regexNFT)
      if (tokenMatch == null && nftMatch == null) {
        //not a token address
        contracts[key] = deployments[key].address
      } else if (tokenMatch && tokenMatch[1] === '1') {
        contracts['TOKENS'][tokenMatch[2]] = {
          L1: deployments[key].address,
          L2: deployments['TK_L2' + tokenMatch[2]].address,
        }
      } else if (nftMatch && nftMatch[1] === '1') {
        contracts['NFTs'][nftMatch[2]] = {
          L1: deployments[key].address,
          L2: deployments['NFT_L2' + nftMatch[2]].address,
        }
      } else if (tokenMatch[2] === 'xBOBA') {
        contracts['TOKENS'][tokenMatch[2]] = {
          L2: deployments['TK_L2' + tokenMatch[2]].address,
        }
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
