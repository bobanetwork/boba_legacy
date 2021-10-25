/* Imports: External */
import { DeployFunction, DeploymentSubmission } from 'hardhat-deploy/dist/types'
import { Contract, ContractFactory, utils } from 'ethers'
import chalk from 'chalk'
import { getContractFactory } from '@eth-optimism/contracts'
import { registerBobaAddress } from './000-Messenger.deploy'

import L1ERC20Json from '../artifacts/contracts/test-helpers/L1ERC20.sol/L1ERC20.json'
import L1BobaJson from '../artifacts/contracts/DAO/governance-token/BOBA.sol/BOBA.json'
import L2GovernanceERC20Json from '../artifacts/contracts/standards/L2GovernanceERC20.sol/L2GovernanceERC20.json'
import L1LiquidityPoolJson from '../artifacts/contracts/LP/L1LiquidityPool.sol/L1LiquidityPool.json'
import L2LiquidityPoolJson from '../artifacts/contracts/LP/L2LiquidityPool.sol/L2LiquidityPool.json'
import preSupportedTokens from '../preSupportedTokens.json'

let Factory__L1ERC20: ContractFactory
let Factory__L2ERC20: ContractFactory
let Factory__L1Boba: ContractFactory
let Factory__L2Boba: ContractFactory

let L1ERC20: Contract
let L2ERC20: Contract

let Proxy__L1LiquidityPool: Contract
let Proxy__L2LiquidityPool: Contract

const initialSupply_6 = utils.parseUnits('10000', 6)
const initialSupply_8 = utils.parseUnits('10000', 8)
const initialSupply_18 = utils.parseEther('10000000000')

const deployFn: DeployFunction = async (hre) => {
  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  Factory__L1ERC20 = new ContractFactory(
    L1ERC20Json.abi,
    L1ERC20Json.bytecode,
    (hre as any).deployConfig.deployer_l1
  )

  Factory__L1Boba = new ContractFactory(
    L1BobaJson.abi,
    L1BobaJson.bytecode,
    (hre as any).deployConfig.deployer_l1
  )

  Factory__L2ERC20 = getContractFactory(
    'L2StandardERC20',
    (hre as any).deployConfig.deployer_l2
  )

  Factory__L2Boba = new ContractFactory(
    L2GovernanceERC20Json.abi,
    L2GovernanceERC20Json.bytecode,
    (hre as any).deployConfig.deployer_l2
  )

  let tokenAddressL1 = null
  let tokenDecimals = null

  for (const token of preSupportedTokens.supportedTokens) {
    if (
      (hre as any).deployConfig.network === 'local' ||
      token.symbol === 'TEST'
    ) {
      //do not deploy existing tokens on Rinkeby or Mainnet
      //only deploy tokens if it's the TEST token or we are on local

      let supply = initialSupply_18

      if (token.decimals === 6) {
        supply = initialSupply_6
      } else if (token.decimals === 8) {
        supply = initialSupply_8
      }

      if (token.symbol !== 'BOBA') {
        L1ERC20 = await Factory__L1ERC20.deploy(
          supply,
          token.name,
          token.symbol,
          token.decimals
        )
        await L1ERC20.deployTransaction.wait()
      } else {
        L1ERC20 = await Factory__L1Boba.deploy()
        await L1ERC20.deployTransaction.wait()
      }

      tokenAddressL1 = L1ERC20.address

      const L1ERC20DeploymentSubmission: DeploymentSubmission = {
        ...L1ERC20,
        receipt: L1ERC20.receipt,
        address: L1ERC20.address,
        abi: L1ERC20Json.abi,
      }

      await hre.deployments.save(
        'TK_L1' + token.symbol,
        L1ERC20DeploymentSubmission
      )
      await registerBobaAddress(
        addressManager,
        'TK_L1' + token.symbol,
        tokenAddressL1
      )

      console.log(
        `TK_L1${token.symbol} was newly deployed to ${tokenAddressL1}`
      )
    } else if ((hre as any).deployConfig.network === 'rinkeby') {
      tokenAddressL1 = token.address.rinkeby

      await hre.deployments.save('TK_L1' + token.symbol, {
        abi: L1ERC20Json.abi,
        address: tokenAddressL1,
      })
      await registerBobaAddress(
        addressManager,
        'TK_L1' + token.symbol,
        tokenAddressL1
      )

      console.log(`TK_L1${token.name} is located at ${tokenAddressL1}`)
    } else if ((hre as any).deployConfig.network === 'mainnet') {
      tokenAddressL1 = token.address.mainnet

      await hre.deployments.save('TK_L1' + token.symbol, {
        abi: L1ERC20Json.abi,
        address: tokenAddressL1,
      })
      await registerBobaAddress(
        addressManager,
        'TK_L1' + token.symbol,
        tokenAddressL1
      )

      console.log(`TK_L1${token.name} is located at ${tokenAddressL1}`)
    }

    // fetch decimal info from L1 token
    L1ERC20 = new Contract(
      tokenAddressL1,
      L1ERC20Json.abi,
      (hre as any).deployConfig.deployer_l1
    )

    tokenDecimals = await L1ERC20.decimals()

    //Set up things on L2 for these tokens

    if (token.symbol !== 'BOBA') {
      L2ERC20 = await Factory__L2ERC20.deploy(
        (hre as any).deployConfig.L2StandardBridgeAddress,
        tokenAddressL1,
        token.name,
        token.symbol,
        tokenDecimals
      )
      await L2ERC20.deployTransaction.wait()

      const L2ERC20DeploymentSubmission: DeploymentSubmission = {
        ...L2ERC20,
        receipt: L2ERC20.receipt,
        address: L2ERC20.address,
        abi: L2ERC20.abi,
      }
      await hre.deployments.save(
        'TK_L2' + token.symbol,
        L2ERC20DeploymentSubmission
      )
      await registerBobaAddress(
        addressManager,
        'TK_L2' + token.symbol,
        L2ERC20.address
      )
      console.log(`TK_L2${token.symbol} was deployed to ${L2ERC20.address}`)
    } else {
      L2ERC20 = await Factory__L2Boba.deploy(
        (hre as any).deployConfig.L2StandardBridgeAddress,
        tokenAddressL1,
        token.name,
        token.symbol,
        tokenDecimals
      )
      await L2ERC20.deployTransaction.wait()

      const L2ERC20DeploymentSubmission: DeploymentSubmission = {
        ...L2ERC20,
        receipt: L2ERC20.receipt,
        address: L2ERC20.address,
        abi: L2GovernanceERC20Json.abi,
      }
      await hre.deployments.save(
        'TK_L2' + token.symbol,
        L2ERC20DeploymentSubmission
      )
      await registerBobaAddress(
        addressManager,
        'TK_L2' + token.symbol,
        L2ERC20.address
      )
      console.log(`TK_L2${token.name} was deployed to ${L2ERC20.address}`)
    }

    // Register tokens in LPs
    const Proxy__L1LiquidityPoolDeployment = await hre.deployments.getOrNull(
      'Proxy__L1LiquidityPool'
    )
    const Proxy__L2LiquidityPoolDeployment = await hre.deployments.getOrNull(
      'Proxy__L2LiquidityPool'
    )

    Proxy__L1LiquidityPool = new Contract(
      Proxy__L1LiquidityPoolDeployment.address,
      L1LiquidityPoolJson.abi,
      (hre as any).deployConfig.deployer_l1
    )
    Proxy__L2LiquidityPool = new Contract(
      Proxy__L2LiquidityPoolDeployment.address,
      L2LiquidityPoolJson.abi,
      (hre as any).deployConfig.deployer_l2
    )

    const registerL1LP = await Proxy__L1LiquidityPool.registerPool(
      tokenAddressL1,
      L2ERC20.address
    )
    await registerL1LP.wait()

    const registerL2LP = await Proxy__L2LiquidityPool.registerPool(
      tokenAddressL1,
      L2ERC20.address
    )
    await registerL2LP.wait()
    console.log(`${token.name} was registered in LPs`)
  }
}

deployFn.tags = ['L1ERC20', 'test']

export default deployFn
