/* eslint-disable prefer-arrow/prefer-arrow-functions */
import { JsonRpcProvider } from '@ethersproject/providers'
import { Wallet } from 'ethers'

import { EntryPoint__factory, SimpleAccountFactory__factory } from '@bobanetwork/accountabstraction'

import { ClientConfig } from './ClientConfig'
import { SimpleAccountAPI } from './SimpleAccountAPI'
import { ERC4337EthersProvider } from './ERC4337EthersProvider'
import { HttpRpcClient } from './HttpRpcClient'
import { DeterministicDeployer } from './DeterministicDeployer'
import { Signer } from '@ethersproject/abstract-signer'
import Debug from 'debug'

const debug = Debug('aa.wrapProvider')

/**
 * wrap an existing provider to tunnel requests through Account Abstraction.
 * @param originalProvider the normal provider
 * @param config see ClientConfig for more info
 * @param originalSigner use this signer as the owner. of this wallet. By default, use the provider's signer
 * @param entryPointWrapperAddress boba does not return revert data for custom errors, if on boba pass an entryPointWrapperAddress to compute account address
 * @param wallet optional, boba does not allow eth_sendTransaction from a remote signer, if on boba pass wallet
 * @param networkName optional, provide network name for deterministicDeployer config.
 */
export async function wrapProvider (
  originalProvider: JsonRpcProvider,
  config: ClientConfig,
  originalSigner: Signer = originalProvider.getSigner(),
  entryPointWrapperAddress: string,
  wallet?: Wallet,
  networkName?: string
): Promise<ERC4337EthersProvider> {
  const entryPoint = EntryPoint__factory.connect(config.entryPointAddress, originalProvider)
  // Initial SimpleAccount instance is not deployed and exists just for the interface
  const detDeployer = new DeterministicDeployer(
    originalProvider,
    wallet,
    networkName
  )
  const SimpleAccountFactory = await detDeployer.deterministicDeploy(new SimpleAccountFactory__factory(), 0, [entryPoint.address])
  let smartWalletAPIOwner
   if (wallet != null) {
     smartWalletAPIOwner = wallet
   } else {
     smartWalletAPIOwner = originalSigner
   }
  const smartAccountAPI = new SimpleAccountAPI({
    provider: originalProvider,
    entryPointAddress: entryPoint.address,
    owner: smartWalletAPIOwner,
    entryPointWrapperAddress: entryPointWrapperAddress,
    factoryAddress: SimpleAccountFactory,
    paymasterAPI: config.paymasterAPI
  })
  debug('config=', config)
  const chainId = await originalProvider.getNetwork().then(net => net.chainId)
  const httpRpcClient = new HttpRpcClient(config.bundlerUrl, config.entryPointAddress, chainId)
  return await new ERC4337EthersProvider(
    chainId,
    config,
    originalSigner,
    originalProvider,
    httpRpcClient,
    entryPoint,
    smartAccountAPI
  ).init()
}
