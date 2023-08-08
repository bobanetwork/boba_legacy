/* Imports: External */
import {Contract, ethers, providers, utils} from 'ethers'
import {DeployFunction} from 'hardhat-deploy/dist/types'
import {getContractFactory} from '@eth-optimism/contracts'
import {
  deployBobaContract,
  getDeploymentSubmission,
  registerBobaAddress,
  getBobaContractAt,
} from '../src/hardhat-deploy-ethers'
import {BobaChains, IBobaChain, IBobaChains} from '../../teleportation/src/utils/chains';

let Proxy__Teleportation: Contract
let Teleportation: Contract

const fs = require('fs');

const file = {
  log: (network: string, text: string) => {
    const fileName = `./teleportation_deploy_logs/teleportation-${network}.txt`
    console.log(`${network}: ${text}`)

    if (fs.existsSync(fileName)) {
      fs.appendFileSync(fileName, text+'\n');
    } else {
      fs.writeFileSync(fileName, text+'\n')
    }
  }
}

const deployFn: DeployFunction = async (hre) => {
  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any


  console.log(`'Deploying Teleportation contract...`)

  const l2Provider = new providers.JsonRpcProvider(process.env.L2_NODE_WEB3_URL)
  const network = await l2Provider.getNetwork()

  console.log("Network name=", network?.name);
  console.log("Network chain id=", network?.chainId);
  let currChainId = network.chainId as ChainIds // (await hre.getChainId()) as any as ChainIds
  let fileName

  const redeploy = true;
  if (redeploy) {
    Teleportation = await deployBobaContract(
      hre,
      'Teleportation',
      [],
      (hre as any).deployConfig.deployer_l2
    )
    const TeleportationDeploymentSubmission =
      getDeploymentSubmission(Teleportation)
    await hre.deployments.save('Teleportation', TeleportationDeploymentSubmission)
    console.log(`Teleportation deployed to: ${Teleportation.address}`)

    Proxy__Teleportation = await deployBobaContract(
      hre,
      'Lib_ResolvedDelegateProxy',
      [Teleportation.address],
      (hre as any).deployConfig.deployer_l2
    )
    const Proxy__TeleportationDeploymentSubmission =
      getDeploymentSubmission(Proxy__Teleportation)
    await hre.deployments.save(
      'Proxy__Teleportation',
      Proxy__TeleportationDeploymentSubmission
    )
    fileName = `${Proxy__Teleportation.address}-${currChainId}`
    file.log(fileName, `Teleportation deployed to: ${Teleportation.address}`)
    file.log(fileName,
      `Proxy__Teleportation deployed to: ${Proxy__Teleportation.address}`
    )
  } else {
    Proxy__Teleportation = await getBobaContractAt(
      'Teleportation',
      '0x...................', // TODO: Adapt your address here
      (hre as any).deployConfig.deployer_l2
    )
  }

  // change abi for proxy
  Proxy__Teleportation = await getBobaContractAt(
    'Teleportation',
    Proxy__Teleportation.address,
    (hre as any).deployConfig.deployer_l2
  )


  const useTestnetRoutes = true // To prevent developers configuring mainnet<>testnet routes (which wouldn't work due to the Teleportation service anyway)
  const defMinAmount = ethers.utils.parseEther('1')
  const defMaxAmount = ethers.utils.parseEther('100000')
  const defMaxDailyAmount = ethers.utils.parseEther('100000')

  // Initialize the Proxy__Teleportation contract
  let res = await Proxy__Teleportation.initialize()
  file.log(fileName, `Initialized proxy: ${await res.wait()}`)
  res = await Teleportation.initialize()
  file.log(fileName, `Teleportation initialized: ${await res.wait()}`)

  let chains: IBobaChains = {}
  for (const [chainId, chainConfig] of Object.entries(BobaChains)) {
    const tmpChainConfig = chainConfig as IBobaChain
    if (tmpChainConfig.testnet === useTestnetRoutes) {
      chains[chainId] = tmpChainConfig
    }
  }

  enum ChainIds {
    ETH_MAINNET = 1,
    BOBA_ETH_MAINNET = 288,
    BOBA_BNB_MAINNET = 56288,
    BNB_MAINNET = 56,

    GOERLI_TESTNET = 5,
    BOBA_GOERLI_TESTNET = 2888,
    BOBA_BNB_TESTNET = 9728,
    BNB_TESTNET = 97,
  }

  // TODO: Add Mainnet routes
  const desiredRoutes = [
    // ETH: ETH <-> ETH BOBA
    {
      fromChainId: ChainIds.GOERLI_TESTNET,
      toChainId: ChainIds.BOBA_GOERLI_TESTNET,
      fromTokenAddr: "0x0000000000000000000000000000000000000000" // eth
    }, {
      fromChainId: ChainIds.BOBA_GOERLI_TESTNET,
      toChainId: ChainIds.GOERLI_TESTNET,
      fromTokenAddr: "0x0000000000000000000000000000000000000000" // eth
    },
    // ETH: BNB <-> BNB BOBA
    {
      fromChainId: ChainIds.BNB_TESTNET,
      toChainId: ChainIds.BOBA_BNB_TESTNET,
      fromTokenAddr: "0xd66c6B4F0be8CE5b39D52E0Fd1344c389929B378" // eth
    }, {
      fromChainId: ChainIds.BOBA_BNB_TESTNET,
      toChainId: ChainIds.BNB_TESTNET,
      fromTokenAddr: "0xc614A66f82e71758Fa7735C91dAD1088c8362f15" // eth
    },
    // BOBA: ETH <-> ETH Boba
    {
      fromChainId: ChainIds.GOERLI_TESTNET,
      toChainId: ChainIds.BOBA_GOERLI_TESTNET,
      fromTokenAddr: "0xeCCD355862591CBB4bB7E7dD55072070ee3d0fC1" // boba
    }, {
      fromChainId: ChainIds.BOBA_GOERLI_TESTNET,
      toChainId: ChainIds.GOERLI_TESTNET,
      fromTokenAddr: "0x4200000000000000000000000000000000000023" // boba
    },
    // BOBA: ETH <-> BNB
    {
      fromChainId: ChainIds.GOERLI_TESTNET,
      toChainId: ChainIds.BNB_TESTNET,
      fromTokenAddr: "0xeCCD355862591CBB4bB7E7dD55072070ee3d0fC1" // boba
    }, {
      fromChainId: ChainIds.BNB_TESTNET,
      toChainId: ChainIds.GOERLI_TESTNET,
      fromTokenAddr: "0x875cD11fDf085e0E11B0EE6b814b6d0b38fA554C" // boba
    },
    // BOBA: BNB <-> Boba BNB
    {
      fromChainId: ChainIds.BNB_TESTNET,
      toChainId: ChainIds.BOBA_BNB_TESTNET,
      fromTokenAddr: "0x875cD11fDf085e0E11B0EE6b814b6d0b38fA554C" // boba
    }, {
      fromChainId: ChainIds.BOBA_BNB_TESTNET,
      toChainId: ChainIds.BNB_TESTNET,
      fromTokenAddr: "0x0000000000000000000000000000000000000000" // boba
    },
    // BOBA: ETH BOBA <-> Boba BNB
    {
      fromChainId: ChainIds.BOBA_GOERLI_TESTNET,
      toChainId: ChainIds.BOBA_BNB_TESTNET,
      fromTokenAddr: "0x4200000000000000000000000000000000000023" // boba
    }, {
      fromChainId: ChainIds.BOBA_BNB_TESTNET,
      toChainId: ChainIds.BOBA_GOERLI_TESTNET,
      fromTokenAddr: "0x0000000000000000000000000000000000000000" // boba
    },
    // BOBA: ETH BOBA <-> BNB
    {
      fromChainId: ChainIds.BOBA_GOERLI_TESTNET,
      toChainId: ChainIds.BNB_TESTNET,
      fromTokenAddr: "0x4200000000000000000000000000000000000023" // boba
    }, {
      fromChainId: ChainIds.BNB_TESTNET,
      toChainId: ChainIds.BOBA_GOERLI_TESTNET,
      fromTokenAddr: "0x875cD11fDf085e0E11B0EE6b814b6d0b38fA554C" // boba
    }
  ]

  const addRoute = async (toChainId: ChainIds, tokenAddr: string) => {
    let res = await Proxy__Teleportation.addSupportedToken(tokenAddr, toChainId, defMinAmount, defMaxAmount, defMaxDailyAmount)
    file.log(fileName, `Added route for ${toChainId} chain, and token: ${tokenAddr}, receipt: ${await res.wait()}`)
  }

  for (const route of desiredRoutes) {
    if (currChainId === route.fromChainId) {
      await addRoute(route.toChainId, route.fromTokenAddr)
    }
  }

  await registerBobaAddress(
    addressManager,
    'Proxy__Teleportation',
    Proxy__Teleportation.address
  )
  await registerBobaAddress(
    addressManager,
    'Teleportation',
    Teleportation.address
  )

  file.log(fileName, "DONE")
}

deployFn.tags = ['Proxy__Teleportation', 'Teleportation', 'required']

export default deployFn
