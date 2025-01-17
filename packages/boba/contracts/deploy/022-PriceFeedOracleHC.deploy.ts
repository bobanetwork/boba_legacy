/* Imports: External */
import { Contract, utils } from 'ethers'
import { DeployFunction } from 'hardhat-deploy/dist/types'
import { getContractFactory } from '@bobanetwork/core_contracts'
import {
  deployBobaContract,
  getDeploymentSubmission,
  registerBobaAddress,
  getBobaContractAt,
} from '../src/hardhat-deploy-ethers'

let Proxy__FluxAggregatorHC: Contract
let FluxAggregatorHC: Contract

const address = (id: number) => {
  return utils.hexZeroPad(utils.hexlify(id), 20)
}

const deployFn: DeployFunction = async (hre) => {
  if ((hre as any).deployConfig.isLightMode) {
    console.log('Skipping deployment function as in light mode..')
    return;
  }
  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  // add customized min/max submission values
  // verify min/max submission values before deployment
  const tokens = [
    {
      name: 'ETH',
      address: '0x4200000000000000000000000000000000000006',
      minSubmissionValue: 1,
      maxSubmissionValue: utils.parseUnits('50000', 8),
    },
    {
      name: 'BOBA',
      address: (await hre.deployments.getOrNull('TK_L2BOBA'))?.address,
      minSubmissionValue: 1,
      maxSubmissionValue: utils.parseUnits('500', 8),
    },
    {
      name: 'OMG',
      address: (await hre.deployments.getOrNull('TK_L2OMG'))?.address,
      minSubmissionValue: 1,
      maxSubmissionValue: utils.parseUnits('500', 8),
    },
    {
      name: 'WBTC',
      address: (await hre.deployments.getOrNull('TK_L2WBTC'))?.address,
      minSubmissionValue: utils.parseUnits('100', 8),
      maxSubmissionValue: utils.parseUnits('500000', 8),
    },
  ]

  const quotes = [{ name: 'USD', address: address(840) }]

  const FeedRegistryDeployed = await (hre as any).deployments.get(
    'FeedRegistry'
  )

  const FeedRegistry = await getBobaContractAt(
    'FeedRegistry',
    FeedRegistryDeployed.address,
    (hre as any).deployConfig.deployer_l2
  )

  // deploy FluxAggregatorHC for each pair and register on FeedRegistry
  for (const token of tokens) {
    // Only deploy oracle of BOBA on Alt L1
    if ((hre as any).deployConfig.isLocalAltL1 && token.name !== 'BOBA') {
      continue
    }
    for (const quote of quotes) {
      FluxAggregatorHC = await deployBobaContract(
        hre,
        'FluxAggregatorHC',
        [],
        (hre as any).deployConfig.deployer_l2
      )
      const FluxAggregatorHCDeploymentSubmission =
        getDeploymentSubmission(FluxAggregatorHC)
      await hre.deployments.save(
        token.name + quote.name + '_AggregatorHC',
        FluxAggregatorHCDeploymentSubmission
      )

      await FluxAggregatorHC.initialize(
        token.minSubmissionValue, // min submission value
        token.maxSubmissionValue, // max submission value
        8, // decimals
        `${token.name} ${quote.name}`, // description
        '0x0000000000000000000000000000000000000000',
        'https://example.com',
        '0x0000000000000000000000000000000000000000'
      )

      console.log(
        `${token.name}${quote.name}_AggregatorHC deployed to: ${FluxAggregatorHC.address}`
      )

      Proxy__FluxAggregatorHC = await deployBobaContract(
        hre,
        'Lib_ResolvedDelegateProxy',
        [FluxAggregatorHC.address],
        (hre as any).deployConfig.deployer_l2
      )
      Proxy__FluxAggregatorHC = await getBobaContractAt(
        'FluxAggregatorHC',
        Proxy__FluxAggregatorHC.address,
        (hre as any).deployConfig.deployer_l2
      )
      const initializeTx = await Proxy__FluxAggregatorHC.initialize(
        token.minSubmissionValue, // min submission value
        token.maxSubmissionValue, // max submission value
        8, // decimals
        `${token.name} ${quote.name}`, // description
        '0x0000000000000000000000000000000000000000',
        'https://example.com',
        '0x0000000000000000000000000000000000000000'
      )
      console.log(
        `Initialized Proxy__${token.name}${quote.name}_AggregatorHC - ${initializeTx.hash}}`
      )

      const Proxy__FluxAggregatorHCDeploymentSubmission =
        getDeploymentSubmission(Proxy__FluxAggregatorHC)
      await hre.deployments.save(
        'Proxy__' + token.name + quote.name + '_AggregatorHC',
        Proxy__FluxAggregatorHCDeploymentSubmission
      )

      console.log(
        `Proxy__${token.name}${quote.name}_AggregatorHC deployed to: ${Proxy__FluxAggregatorHC.address}`
      )

      // add feed to FeedRegistry
      console.log('Adding Feed to Regsitry..')
      const proposeFeedTx = await FeedRegistry.proposeFeed(
        token.address,
        quote.address,
        Proxy__FluxAggregatorHC.address
      )
      await proposeFeedTx.wait()

      const confirmFeedTx = await FeedRegistry.confirmFeed(
        token.address,
        quote.address,
        Proxy__FluxAggregatorHC.address
      )
      await confirmFeedTx.wait()

      const currentAggregator = await FeedRegistry.getFeed(
        token.address,
        quote.address
      )

      if (currentAggregator === Proxy__FluxAggregatorHC.address) {
        console.log(
          `Proxy__${token.name}${quote.name} feed added to FeedRegistry: ${confirmFeedTx.hash}`
        )
      } else {
        throw new Error('Failed to register feed correctly')
      }

      await registerBobaAddress(
        addressManager,
        `BobaLink_${token.name}${quote.name}`,
        FluxAggregatorHC.address
      )
      await registerBobaAddress(
        addressManager,
        `Proxy__BobaLink_${token.name}${quote.name}`,
        FluxAggregatorHC.address
      )
    }
  }
}

deployFn.tags = ['FluxAggregatorHC', 'required']
export default deployFn
