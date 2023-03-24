import { DeployFunction, DeploymentSubmission } from 'hardhat-deploy/types'
import { ethers } from 'hardhat'
import { Contract, ContractFactory } from 'ethers'
import EntryPointJson from '../artifacts/contracts/core/EntryPoint.sol/EntryPoint.json'
import { DeterministicDeployer } from '../src/DeterministicDeployer'

const sleep = async (ms: number): Promise<void> => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve(null)
    }, ms)
  })
}

const hexStringEquals = (stringA: string, stringB: string): boolean => {
  if (!ethers.utils.isHexString(stringA)) {
    throw new Error(`input is not a hex string: ${stringA}`)
  }

  if (!ethers.utils.isHexString(stringB)) {
    throw new Error(`input is not a hex string: ${stringB}`)
  }

  return stringA.toLowerCase() === stringB.toLowerCase()
}

const waitUntilTrue = async (
  check: () => Promise<boolean>,
  opts: {
    retries?: number
    delay?: number
  } = {}
) => {
  opts.retries = opts.retries || 100
  opts.delay = opts.delay || 5000

  let retries = 0
  while (!(await check())) {
    if (retries > opts.retries) {
      throw new Error(`check failed after ${opts.retries} attempts`)
    }
    retries++
    await sleep(opts.delay)
  }
}

export const registerBobaAddress = async (
  addressManager: any,
  name: string,
  address: string
): Promise<void> => {
  console.log("AddressManager address:",addressManager.address)

  const currentAddress = await addressManager.getAddress(name)
  if (address === currentAddress) {
    console.log(
      `✓ Not registering address for ${name} because it's already been correctly registered`
    )
    return
  }

  console.log(`Registering address for ${name} to ${address}...`)
  await addressManager.setAddress(name, address)

  console.log(`Waiting for registration to reflect on-chain...`)
  await waitUntilTrue(async () => {
    return hexStringEquals(await addressManager.getAddress(name), address)
  })

  console.log(`✓ Registered address for ${name}`)
}

let Factory__EntryPoint: ContractFactory

const deployFn: DeployFunction = async (hre) => {
  Factory__EntryPoint = new ContractFactory(
    EntryPointJson.abi,
    EntryPointJson.bytecode,
    (hre as any).deployConfig.deployer_l2
  )
  const dep = new DeterministicDeployer((hre as any).deployConfig.l2Provider, (hre as any).deployConfig.deployer_l2, 'local')
  const EntryPointAddress = await dep.deterministicDeploy(Factory__EntryPoint.bytecode)
  console.log('Deployed EntryPoint at', EntryPointAddress)

  const EntryPointDeploymentSubmission: DeploymentSubmission = {
    address: EntryPointAddress,
    abi: EntryPointJson.abi
  }
  await hre.deployments.save('EntryPoint', EntryPointDeploymentSubmission)
  await registerBobaAddress( (hre as any).deployConfig.addressManager, 'L2_Boba_EntryPoint', EntryPointAddress )
}

export default deployFn
deployFn.tags = ['EntryPoint']
