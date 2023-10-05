/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
import fs from 'fs'

import { Command } from 'commander'
import { erc4337RuntimeVersion } from '@bobanetwork/bundler_utils'
import { ethers, Wallet } from 'ethers'
import { getContractFactory } from '@bobanetwork/core_contracts'
import { BundlerServer } from './BundlerServer'
import { UserOpMethodHandler } from './UserOpMethodHandler'
import {
  EntryPoint,
  EntryPoint__factory,
  EntryPointWrapper,
  EntryPointWrapper__factory,
} from '@bobanetwork/accountabstraction'
import { BaseProvider } from '@ethersproject/providers'
import { initServer } from './modules/initServer'
import { DebugMethodHandler } from './DebugMethodHandler'
import { isGeth, supportsRpcMethod } from './utils'
import { resolveConfiguration } from './Config'

// this is done so that console.log outputs BigNumber as hex string instead of unreadable object
export const inspectCustomSymbol = Symbol.for('nodejs.util.inspect.custom')
// @ts-ignore
ethers.BigNumber.prototype[inspectCustomSymbol] = function () {
  return `BigNumber ${parseInt(this._hex, 10)}`
}

const CONFIG_FILE_NAME = 'workdir/bundler.config.json'

export let showStackTraces = false

export async function connectContracts(
  wallet: Wallet,
  entryPointAddress: string,
  entryPointWrapperAddress: string
): Promise<{ entryPoint: EntryPoint, entryPointWrapper: EntryPointWrapper }> {
  const entryPoint = EntryPoint__factory.connect(entryPointAddress, wallet)
  const entryPointWrapper = EntryPointWrapper__factory.connect(entryPointWrapperAddress, wallet)
  return { entryPoint, entryPointWrapper }
}

export async function connectContractsViaAddressManager (
  providerL1: BaseProvider,
  wallet: Wallet,
  addressManagerAddress: string): Promise<{ entryPoint: EntryPoint, entryPointWrapper: EntryPointWrapper }> {
  const addressManager = getAddressManager(providerL1, addressManagerAddress)
  const entryPointAddress = await addressManager.getAddress('L2_Boba_EntryPoint')
  const entryPointWrapperAddress = await addressManager.getAddress('L2_EntryPointWrapper')
  const entryPoint = EntryPoint__factory.connect(entryPointAddress, wallet)
  const entryPointWrapper = EntryPointWrapper__factory.connect(entryPointWrapperAddress, wallet)
  return { entryPoint, entryPointWrapper }
}

function getAddressManager (provider: any, addressManagerAddress: any): ethers.Contract {
  return getContractFactory('Lib_AddressManager')
    .attach(addressManagerAddress)
    .connect(provider)
}

/**
 * start the bundler server.
 * this is an async method, but only to resolve configuration. after it returns, the server is only active after asyncInit()
 *
 * @param argv
 * @param overrideExit
 */
export async function runBundler(
  argv: string[],
  overrideExit = true
): Promise<BundlerServer> {
  const program = new Command()

  if (overrideExit) {
    ;(program as any)._exit = (exitCode: any, code: any, message: any) => {
      class CommandError extends Error {
        constructor(
          message: string,
          readonly code: any,
          readonly exitCode: any
        ) {
          super(message)
        }
      }

      throw new CommandError(message, code, exitCode)
    }
  }

  program
    .version(erc4337RuntimeVersion)
    .option('--beneficiary <string>', 'address to receive funds')
    .option('--gasFactor <number>', '', '1')
    .option(
      '--minBalance <number>',
      'below this signer balance, keep fee for itself, ignoring "beneficiary" address '
    )
    .option('--network <string>', 'network name or url')
    .option('--mnemonic <file>', 'mnemonic/private-key file of signer account')
    .option(
      '--entryPoint <string>',
      'address of the supported EntryPoint contract'
    )
    .option('--port <number>', 'server listening port', '3000')
    .option('--config <string>', 'path to config file', CONFIG_FILE_NAME)
    .option(
      '--auto',
      'automatic bundling (bypass config.autoBundleMempoolSize)',
      false
    )
    .option(
      '--unsafe',
      'UNSAFE mode: no storage or opcode checks (safe mode requires geth)'
    )
    .option('--conditionalRpc', 'Use eth_sendRawTransactionConditional RPC)')
    .option('--show-stack-traces', 'Show stack traces.')
    .option('--createMnemonic', 'create the mnemonic file')
    .option('--addressManager <string>', 'address of the Address Manager', '')
    .option('--l1NodeWeb3Url <string>', 'L1 network url for Address Manager', '')
    .option('--maxBundleGas <number>', 'Max Bundle Gas available to use', '5000000')
    .option('--enableDebugMethods <boolean>', 'debug_* methods available', false)
    .option('--minStake <string>', 'Min stake for Entrypoint', '0.0001')
    .option('--minUnstakeDelay <number>', 'Minimum unstake delay in seconds', '300')
    .option('--autoBundleInterval <number>', 'Auto Bundle interval', '3')
    .option('--autoBundleMempoolSize <number>', 'Auto Bundle Mempool Size', '10')
    .option('--l2Offset <number>', 'l2 Offset to start from')
    .option('--logsChunkSize <number>', 'eth_getLogs range supported by network')

  const programOpts = program.parse(argv).opts()
  showStackTraces = programOpts.showStackTraces

  //console.log('command-line arguments: ', program.opts())

  const { config, provider, wallet } = await resolveConfiguration(programOpts)
  if (programOpts.createMnemonic != null) {
    const mnemonicFile = config.mnemonic
    console.log('Creating mnemonic in file', mnemonicFile)
    if (fs.existsSync(mnemonicFile)) {
      throw new Error(
        `Can't --createMnemonic: out file ${mnemonicFile} already exists`
      )
    }
    const newMnemonic = Wallet.createRandom().mnemonic.phrase
    fs.writeFileSync(mnemonicFile, newMnemonic)
    console.log('created mnemonic file', mnemonicFile)
    process.exit(1)
  }

  if (
    config.conditionalRpc &&
    !(await supportsRpcMethod(
      provider as any,
      'eth_sendRawTransactionConditional'
    ))
  ) {
    console.error(
      'FATAL: --conditionalRpc requires a node that support eth_sendRawTransactionConditional'
    )
    process.exit(1)
  }
  if (!config.unsafe && !(await isGeth(provider as any))) {
    console.error(
      'FATAL: full validation requires GETH. for local UNSAFE mode: use --unsafe'
    )
    process.exit(1)
  }

  //todo this could need a cleanup
  let entryPoint: EntryPoint
  let entryPointWrapper: EntryPointWrapper
  if (config.addressManager.length > 0) {
    console.log('Getting entrypoint from address manager')
    const providerL1: BaseProvider = new ethers.providers.JsonRpcProvider(config.l1NodeWeb3Url)
    const { entryPoint: eP, entryPointWrapper: epW } =
      await connectContractsViaAddressManager(
        providerL1,
        wallet,
        config.addressManager
      )
    console.log(eP.address)
    config.entryPoint = eP.address
    config.entryPointWrapper = epW.address
    console.log(config.entryPoint)
    entryPoint = eP
    entryPointWrapper = epW
  } else {
    const { entryPoint: eP, entryPointWrapper: epW } = await connectContracts(wallet, config.entryPoint, config.entryPointWrapper)
    config.entryPoint = eP.address
    entryPoint = eP
    config.entryPointWrapper = epW.address
    entryPointWrapper = epW
  }

  const entryPointFromWrapper = await entryPointWrapper.entryPoint()
  if (
    entryPointFromWrapper.toLowerCase() !== entryPoint.address.toLowerCase()
  ) {
    console.error('WARN: entryPointWrapper may be incompatible with entryPoint')
    process.exit(1)
  }
  // bundleSize=1 replicate current immediate bundling mode
  const execManagerConfig = {
    ...config,
    // autoBundleMempoolSize: 0
  }
  if (programOpts.auto === true) {
    execManagerConfig.autoBundleMempoolSize = 0
    execManagerConfig.autoBundleInterval = 0
  }
  const [execManager, eventsManager, reputationManager, mempoolManager] =
    initServer(execManagerConfig, entryPoint.signer)

  console.log('initServer done')
  const methodHandler = new UserOpMethodHandler(
    execManager,
    provider,
    wallet,
    config,
    entryPoint,
    entryPointWrapper
  )
  eventsManager.initEventListener()
  const debugHandler = new DebugMethodHandler(
    execManager,
    eventsManager,
    reputationManager,
    mempoolManager
  )

  const bundlerServer = new BundlerServer(
    methodHandler,
    debugHandler,
    config,
    provider,
    wallet
  )
  console.log('bundlerServer...')
  void bundlerServer.asyncStart().then(async () => {
    console.log(
      'Bundle interval (seconds)',
      execManagerConfig.autoBundleInterval
    )
    console.log(
      'connected to network',
      await provider.getNetwork().then((net) => {
        return {
          name: net.name,
          chainId: net.chainId,
        }
      })
    )
    console.log(`running on http://localhost:${config.port}/rpc`)
  })

  return bundlerServer
}
