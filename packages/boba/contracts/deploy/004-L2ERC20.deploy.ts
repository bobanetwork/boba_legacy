/* Imports: External */
import { DeployFunction, DeploymentSubmission } from 'hardhat-deploy/dist/types'
import { Contract, ContractFactory, utils } from 'ethers'
import chalk from 'chalk'
import { getContractFactory } from '@eth-optimism/contracts'

import L1ERC20Json from '../artifacts/contracts/test-helpers/L1ERC20.sol/L1ERC20.json'
import L2GovernanceERC20Json from '../artifacts/contracts/standards/L2GovernanceERC20.sol/L2GovernanceERC20.json'
import L1LiquidityPoolJson from '../artifacts/contracts/LP/L1LiquidityPool.sol/L1LiquidityPool.json'
import L2LiquidityPoolJson from '../artifacts/contracts/LP/L2LiquidityPool.sol/L2LiquidityPool.json'
import preSupportedTokens from '../preSupportedTokens.json'

let Factory__L1ERC20: ContractFactory
let Factory__L2ERC20: ContractFactory
let Factory__L2Boba: ContractFactory

let L1ERC20: Contract
let L2ERC20: Contract

let Proxy__L1LiquidityPool: Contract
let Proxy__L2LiquidityPool: Contract

const initialSupply_6 = utils.parseUnits('10000', 6)
const initialSupply_8 = utils.parseUnits('10000', 8)
const initialSupply_18 = utils.parseEther('10000000000')

const initialSupply_BOBA = utils.parseEther('500000000')

const deployFn: DeployFunction = async (hre) => {
  Factory__L1ERC20 = new ContractFactory(
    L1ERC20Json.abi,
    L1ERC20Json.bytecode,
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

  let tokenAddress = null
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
      } else if (token.symbol === 'BOBA') {
        supply = initialSupply_BOBA
      }

      L1ERC20 = await Factory__L1ERC20.deploy(
        supply,
        token.name,
        token.symbol,
        token.decimals
      )
      await L1ERC20.deployTransaction.wait()

      tokenAddress = L1ERC20.address

      const L1ERC20DeploymentSubmission: DeploymentSubmission = {
        ...L1ERC20,
        receipt: L1ERC20.receipt,
        address: L1ERC20.address,
        abi: L1ERC20Json.abi,
      }

      await hre.deployments.save(
        `TK_L1${token.symbol}`,
        L1ERC20DeploymentSubmission
      )
      console.log(
        `🌕 ${chalk.red(
          `L1 ${token.name} was newly deployed to`
        )} ${chalk.green(tokenAddress)}`
      )
    } else if ((hre as any).deployConfig.network === 'rinkeby') {
      tokenAddress = token.address.rinkeby
      await hre.deployments.save(`TK_L1${token.symbol}`, {
        abi: L1ERC20Json.abi,
        address: tokenAddress,
      })
      console.log(
        `🌕 ${chalk.red(`L1 ${token.name} is located at`)} ${chalk.green(
          tokenAddress
        )}`
      )
    } else if ((hre as any).deployConfig.network === 'mainnet') {
      tokenAddress = token.address.mainnet
      await hre.deployments.save(`TK_L1${token.symbol}`, {
        abi: L1ERC20Json.abi,
        address: tokenAddress,
      })
      console.log(
        `🌕 ${chalk.red(`L1 ${token.name} is located at`)} ${chalk.green(
          tokenAddress
        )}`
      )
    }

    // fetch decimal info from L1 token
    L1ERC20 = new Contract(
      tokenAddress,
      L1ERC20Json.abi,
      (hre as any).deployConfig.deployer_l1
    )

    tokenDecimals = await L1ERC20.decimals()

    //Set up things on L2 for these tokens

    if (token.symbol !== 'BOBA') {
      L2ERC20 = await Factory__L2ERC20.deploy(
        (hre as any).deployConfig.L2StandardBridgeAddress,
        tokenAddress,
        //((hre as any).deployConfig.network === 'local' || token.symbol === 'TEST' ) ? L1ERC20.address : token.address,
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
        `TK_L2${token.symbol}`,
        L2ERC20DeploymentSubmission
      )
      console.log(
        `🌕 ${chalk.red(`L2 ${token.name} was deployed to`)} ${chalk.green(
          L2ERC20.address
        )}`
      )
    } else {
      L2ERC20 = await Factory__L2Boba.deploy(
        (hre as any).deployConfig.L2StandardBridgeAddress,
        tokenAddress,
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
        `TK_L2${token.symbol}`,
        L2ERC20DeploymentSubmission
      )
      console.log(
        `🌕 ${chalk.red(`L2 ${token.name} was deployed to`)} ${chalk.green(
          L2ERC20.address
        )}`
      )
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
      tokenAddress,
      L2ERC20.address
    )
    await registerL1LP.wait()

    const registerL2LP = await Proxy__L2LiquidityPool.registerPool(
      tokenAddress,
      L2ERC20.address
    )
    await registerL2LP.wait()
    console.log(`🌕 ${chalk.red(`${token.name} was registered in LPs`)}`)
  }
}

deployFn.tags = ['L1ERC20', 'test']

export default deployFn
