/* Imports: External */
import { Contract, utils } from 'ethers'
import { DeployFunction } from 'hardhat-deploy/dist/types'
import { getContractFactory } from '@bobanetwork/core_contracts'
import {
  deployBobaContract,
  getDeploymentSubmission,
  registerBobaAddress,
  getBobaContractAt,
  getBobaContractABI,
} from '../src/hardhat-deploy-ethers'

import preSupportedTokens from '../preSupportedTokens.json'

let L1ERC20: Contract
let L2ERC20: Contract

let Proxy__L1LiquidityPool: Contract
let Proxy__L2LiquidityPool: Contract

const initialSupply_6 = utils.parseUnits('10000', 6)
const initialSupply_8 = utils.parseUnits('10000', 8)
const initialSupply_18 = utils.parseEther('10000000000')

const deployFn: DeployFunction = async (hre) => {
  if ((hre as any).deployConfig.isLightMode) {
    console.log('Skipping deployment function as in light mode..')
    return;
  }

  const registerLPToken = async (L1TokenAddress, L2TokenAddress) => {
    const registerL1LP = await Proxy__L1LiquidityPool.registerPool(
      L1TokenAddress,
      L2TokenAddress
    )
    await registerL1LP.wait()

    const registerL2LP = await Proxy__L2LiquidityPool.registerPool(
      L1TokenAddress,
      L2TokenAddress
    )
    await registerL2LP.wait()
  }
  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  let tokenAddressL1 = null
  let tokenDecimals = null

  for (const token of preSupportedTokens.supportedTokens) {
    // Skip other tokens on local Alt L1s
    if ((hre as any).deployConfig.isLocalAltL1 && token.symbol !== 'TEST') {
      continue
    }
    // Bypass BOBA token, because we have deployed it
    if (token.symbol === 'BOBA') {
      continue
    }
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

      L1ERC20 = await deployBobaContract(
        hre,
        'L1ERC20',
        [supply, token.name, token.symbol, token.decimals],
        (hre as any).deployConfig.deployer_l1
      )

      tokenAddressL1 = L1ERC20.address

      const L1ERC20DeploymentSubmission = getDeploymentSubmission(L1ERC20)

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
        abi: getBobaContractABI('L1ERC20'),
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
        abi: getBobaContractABI('L1ERC20'),
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
    L1ERC20 = await getBobaContractAt(
      'L1ERC20',
      tokenAddressL1,
      (hre as any).deployConfig.deployer_l1
    )

    tokenDecimals = await L1ERC20.decimals()

    //Set up things on L2 for these tokens
    const Factory__L2ERC20 = getContractFactory('L2StandardERC20').connect(
      (hre as any).deployConfig.deployer_l2
    )
    L2ERC20 = await Factory__L2ERC20.deploy(
      (hre as any).deployConfig.L2StandardBridgeAddress,
      tokenAddressL1,
      token.name,
      token.symbol,
      tokenDecimals
    )
    await L2ERC20.deployTransaction.wait()
    const L2ERC20DeploymentSubmission = getDeploymentSubmission(L2ERC20)
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

    // Register tokens in LPs
    const Proxy__L1LiquidityPoolDeployment = await hre.deployments.getOrNull(
      'Proxy__L1LiquidityPool'
    )
    const Proxy__L2LiquidityPoolDeployment = await hre.deployments.getOrNull(
      'Proxy__L2LiquidityPool'
    )

    Proxy__L1LiquidityPool = await getBobaContractAt(
      'L1LiquidityPool',
      Proxy__L1LiquidityPoolDeployment.address,
      (hre as any).deployConfig.deployer_l1
    )
    Proxy__L2LiquidityPool = await getBobaContractAt(
      'L2LiquidityPool',
      Proxy__L2LiquidityPoolDeployment.address,
      (hre as any).deployConfig.deployer_l2
    )

    await registerLPToken(tokenAddressL1, L2ERC20.address)
    console.log(`${token.name} was registered in LPs`)
  }

  // Add predeployment Boba token
  const L1BobaAddress = await addressManager.getAddress('TK_L1BOBA')
  const L2BobaAddress = await addressManager.getAddress('TK_L2BOBA')

  const L1Boba = getContractFactory('BOBA')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(L1BobaAddress) as any
  const L2Boba = getContractFactory('L2GovernanceERC20')
    .connect((hre as any).deployConfig.deployer_l2)
    .attach(L2BobaAddress) as any

  const L1BobaDeploymentSubmission = getDeploymentSubmission(L1Boba)
  const L2BobaDeploymentSubmission = getDeploymentSubmission(L2Boba)

  await hre.deployments.save('TK_L1BOBA', L1BobaDeploymentSubmission)
  await hre.deployments.save('TK_L2BOBA', L2BobaDeploymentSubmission)

  await registerLPToken(L1BobaAddress, L2BobaAddress)
  console.log(`BOBA was registered in LPs`)

  if ((hre as any).deployConfig.isLocalAltL1) {
    return
  }

  // Deploy xBoba
  L2ERC20 = await deployBobaContract(
    hre,
    'xL2GovernanceERC20',
    ['xBOBA Token', 'xBOBA', 18],
    (hre as any).deployConfig.deployer_l2
  )

  const xL2BobaDeploymentSubmission = getDeploymentSubmission(L2ERC20)
  await hre.deployments.save('TK_L2' + 'xBOBA', xL2BobaDeploymentSubmission)
  await registerBobaAddress(addressManager, 'TK_L2' + 'xBOBA', L2ERC20.address)
  console.log(`TK_L2xBOBA was deployed to ${L2ERC20.address}`)

  // Register BOBA and xBOBA
  const deployments = await hre.deployments.all()
  const registerBOBA = await Proxy__L2LiquidityPool.registerBOBA(
    deployments['TK_L2BOBA'].address,
    deployments['TK_L2xBOBA'].address
  )
  await registerBOBA.wait()
  console.log(`BOBA and xBOBA were registered in L2 LP`)

  // Add controller
  const addController = await L2ERC20.addController(
    Proxy__L2LiquidityPool.address
  )
  await addController.wait()
  console.log(`L2 LP has the power to mint and burn xBOBA`)
}

deployFn.tags = ['L1ERC20', 'test']

export default deployFn
