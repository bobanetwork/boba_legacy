/* Imports: External */
import { DeployFunction, DeploymentSubmission } from 'hardhat-deploy/dist/types'
import { Contract, ContractFactory, utils } from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'
import { registerBobaAddress } from './000-Messenger.deploy'

import ProxyJson from '../artifacts/contracts/libraries/Lib_ResolvedDelegateProxy.sol/Lib_ResolvedDelegateProxy.json'
import FluxAggregatorHCJson from '../artifacts/contracts/oracle/FluxAggregatorHC.sol/FluxAggregatorHC.json'

let Factory__Proxy__FluxAggregatorHC: ContractFactory
let Proxy__FluxAggregatorHC: Contract

let Factory__FluxAggregatorHC: ContractFactory
let FluxAggregatorHC: Contract

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
    {
      name: 'OMG',
      address: (await hre.deployments.getOrNull('TK_L2OMG')).address,
      minSubmissionValue: 1,
      maxSubmissionValue: utils.parseUnits('500', 8),
    },
    {
      name: 'WBTC',
      address: (await hre.deployments.getOrNull('TK_L2WBTC')).address,
      minSubmissionValue: utils.parseUnits('100', 8),
      maxSubmissionValue: utils.parseUnits('500000', 8),
    },
  ]

  const quotes = [{ name: 'USD', address: address(840) }]

  Factory__Proxy__FluxAggregatorHC = new ContractFactory(
    ProxyJson.abi,
    ProxyJson.bytecode,
    (hre as any).deployConfig.deployer_l2
  )

  Factory__FluxAggregatorHC = new ContractFactory(
    FluxAggregatorHCJson.abi,
    FluxAggregatorHCJson.bytecode,
    (hre as any).deployConfig.deployer_l2
  )

  const FeedRegistryDeployed = await (hre as any).deployments.get(
    'FeedRegistry'
  )

  const FeedRegistry = new Contract(
    FeedRegistryDeployed.address,
    FeedRegistryDeployed.abi,
    (hre as any).deployConfig.deployer_l2
  )

  // deploy FluxAggregatorHC for each pair and register on FeedRegistry
  for (const token of tokens) {
    for (const quote of quotes) {
      FluxAggregatorHC = await Factory__FluxAggregatorHC.deploy()
      await FluxAggregatorHC.deployTransaction.wait()
      const FluxAggregatorHCDeploymentSubmission: DeploymentSubmission = {
        ...FluxAggregatorHC,
        receipt: FluxAggregatorHC.receipt,
        address: FluxAggregatorHC.address,
        abi: FluxAggregatorHCJson.abi,
      }
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

      Proxy__FluxAggregatorHC = await Factory__Proxy__FluxAggregatorHC.deploy(
        FluxAggregatorHC.address
      )
      await Proxy__FluxAggregatorHC.deployTransaction.wait()

      Proxy__FluxAggregatorHC = new Contract(
        Proxy__FluxAggregatorHC.address,
        FluxAggregatorHCJson.abi,
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

      const Proxy__FluxAggregatorHCDeploymentSubmission: DeploymentSubmission =
        {
          ...Proxy__FluxAggregatorHC,
          receipt: Proxy__FluxAggregatorHC.receipt,
          address: Proxy__FluxAggregatorHC.address,
          abi: FluxAggregatorHCJson.abi,
        }
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
