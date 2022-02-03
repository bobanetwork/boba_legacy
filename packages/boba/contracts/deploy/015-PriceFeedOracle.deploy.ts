/* Imports: External */
import { DeployFunction, DeploymentSubmission } from 'hardhat-deploy/dist/types'
import { Contract, ContractFactory, utils } from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'
import { registerBobaAddress } from './000-Messenger.deploy'

import FluxAggregatorJson from '../artifacts/contracts/oracle/FluxAggregator.sol/FluxAggregator.json'

let Factory__FluxAggregator: ContractFactory
let FluxAggregator: Contract

const address = (id: number) => {
  return utils.hexZeroPad(utils.hexlify(id), 20)
}

const deployFn: DeployFunction = async (hre) => {
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
      address: (await hre.deployments.getOrNull('TK_L2BOBA')).address,
      minSubmissionValue: 1,
      maxSubmissionValue: utils.parseUnits('500', 8),
    },
  ]

  const quotes = [{ name: 'USD', address: address(840) }]

  Factory__FluxAggregator = new ContractFactory(
    FluxAggregatorJson.abi,
    FluxAggregatorJson.bytecode,
    (hre as any).deployConfig.deployer_l2
  )

  const BobaL2 = await hre.deployments.getOrNull('TK_L2BOBA')

  const FeedRegistryDeployed = await (hre as any).deployments.get(
    'FeedRegistry'
  )

  const FeedRegistry = new Contract(
    FeedRegistryDeployed.address,
    FeedRegistryDeployed.abi,
    (hre as any).deployConfig.deployer_l2
  )

  // deploy FluxAggregator for each pair and register on FeedRegistry
  for (const token of tokens) {
    for (const quote of quotes) {
      FluxAggregator = await Factory__FluxAggregator.deploy(
        BobaL2.address, // boba L2 token
        0, // starting payment amount
        180, // timeout, 3 mins
        '0x0000000000000000000000000000000000000000', // validator
        token.minSubmissionValue, // min submission value
        token.maxSubmissionValue, // max submission value
        8, // decimals
        `${token.name} ${quote.name}` // description
      )
      await FluxAggregator.deployTransaction.wait()
      const FluxAggregatorDeploymentSubmission: DeploymentSubmission = {
        ...FluxAggregator,
        receipt: FluxAggregator.receipt,
        address: FluxAggregator.address,
        abi: FluxAggregatorJson.abi,
      }
      await hre.deployments.save(
        token.name + quote.name + '_Aggregator',
        FluxAggregatorDeploymentSubmission
      )

      console.log(
        `${token.name}${quote.name}_Aggregator deployed to: ${FluxAggregator.address}`
      )

      // add feed to FeedRegistry
      console.log('Adding Feed to Regsitry..')
      const proposeFeedTx = await FeedRegistry.proposeFeed(
        token.address,
        quote.address,
        FluxAggregator.address
      )
      await proposeFeedTx.wait()

      const confirmFeedTx = await FeedRegistry.confirmFeed(
        token.address,
        quote.address,
        FluxAggregator.address
      )
      await confirmFeedTx.wait()

      const currentAggregator = await FeedRegistry.getFeed(
        token.address,
        quote.address
      )

      if (currentAggregator === FluxAggregator.address) {
        console.log(
          `${token.name}${quote.name} feed added to FeedRegistry: ${confirmFeedTx.hash}`
        )
      } else {
        throw new Error('Failed to register feed correctly')
      }

      await registerBobaAddress(
        addressManager,
        `BobaStraw_${token.name}${quote.name}`,
        FluxAggregator.address
      )
    }
  }
}

deployFn.tags = ['FluxAggregator', 'required']
export default deployFn
