import { JsonRpcProvider } from '@ethersproject/providers'
import { Wallet } from 'ethers'

import {
  EntryPoint__factory,
  SimpleAccountDeployer__factory,
} from '@boba/accountabstraction'

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
 *
 * @param originalProvider the normal provider
 * @param config see ClientConfig for more info
 * @param originalSigner use this signer as the owner. of this wallet. By default, use the provider's signer
 * @param wallet optional, boba does not allow eth_sendTransaction from a remote signer, if on boba pass wallet
 * @param senderCreatorAddress optional, boba does not return revert data for custom errors, if on boba pass a senderCreator to compute account address
 */
export async function wrapProvider(
  originalProvider: JsonRpcProvider,
  config: ClientConfig,
  originalSigner: Signer = originalProvider.getSigner(),
  wallet?: Wallet,
  senderCreatorAddress?: string
): Promise<ERC4337EthersProvider> {
  const entryPoint = EntryPoint__factory.connect(
    config.entryPointAddress,
    originalProvider
  )
  // Initial SimpleAccount instance is not deployed and exists just for the interface
  const detDeployer = new DeterministicDeployer(originalProvider, wallet)
  const simpleWalletDeployer = await detDeployer.deterministicDeploy(
    SimpleAccountDeployer__factory.bytecode
  )
  let smartWalletAPIOwner
  if (wallet != null) {
    smartWalletAPIOwner = wallet
  } else {
    smartWalletAPIOwner = originalSigner
  }
  const smartWalletAPI = new SimpleAccountAPI({
    provider: originalProvider,
    entryPointAddress: entryPoint.address,
    senderCreatorAddress: senderCreatorAddress,
    owner: smartWalletAPIOwner,
    factoryAddress: simpleWalletDeployer,
    paymasterAPI: config.paymasterAPI,
  })
  debug('config=', config)
  const chainId = await originalProvider.getNetwork().then((net) => net.chainId)
  const httpRpcClient = new HttpRpcClient(
    config.bundlerUrl,
    config.entryPointAddress,
    chainId
  )
  return await new ERC4337EthersProvider(
    chainId,
    config,
    originalSigner,
    originalProvider,
    httpRpcClient,
    entryPoint,
    smartWalletAPI
  ).init()
}
