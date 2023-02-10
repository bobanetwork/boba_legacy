import { Contract, utils } from 'ethers'
import { sleep, hexStringEquals } from '@eth-optimism/core-utils'
import { DeploymentSubmission } from 'hardhat-deploy/dist/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { getContractArtifact } from './contract-artifacts'

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
  console.log('AddressManager address:', addressManager.address)

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

export const parseABI = (contract: Contract) => {
  return [...contract.interface.format(utils.FormatTypes.full)]
}

export const getDeploymentSubmission = (
  contract: Contract
): DeploymentSubmission => {
  return {
    ...contract,
    receipt: contract.receipt,
    address: contract.address,
    abi: parseABI(contract),
  }
}

export const deployBobaContract = async (
  hre: HardhatRuntimeEnvironment,
  name: string,
  args: any[],
  signer: any
) => {
  const deployedContract = await hre.ethers.deployContract(name, args, signer)
  return new Contract(
    deployedContract.address,
    getContractArtifact(name).abi,
    signer
  )
}

export const getBobaContractAt = async (
  name: string,
  address: string,
  signer: any
) => {
  return new Contract(address, getContractArtifact(name).abi, signer)
}

export const getBobaContractABI = (name: string) => {
  return getContractArtifact(name).abi
}
