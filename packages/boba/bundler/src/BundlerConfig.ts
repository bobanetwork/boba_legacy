// TODO: consider adopting config-loading approach from hardhat to allow code in config file
import ow from 'ow'

export interface BundlerConfig {
  beneficiary: string
  entryPoint: string
  entryPointWrapper?: string
  gasFactor: string
  minBalance: string
  mnemonic: string
  network: string
  port: string
  unsafe: boolean
  conditionalRpc: boolean
  whitelist?: string[]
  blacklist?: string[]
  maxBundleGas: number
  minStake: string
  minUnstakeDelay: number
  autoBundleInterval: number
  autoBundleMempoolSize: number
  addressManager: string
  l1NodeWeb3Url: string
  enableDebugMethods: boolean
}

// TODO: implement merging config (args -> config.js -> default) and runtime shape validation
export const BundlerConfigShape = {
  beneficiary: ow.string,
  entryPoint: ow.string,
  entryPointWrapper: ow.optional.string,
  gasFactor: ow.string,
  minBalance: ow.string,
  mnemonic: ow.string,
  network: ow.string,
  port: ow.string,
  unsafe: ow.boolean,
  conditionalRpc: ow.boolean,
  whitelist: ow.optional.array.ofType(ow.string),
  blacklist: ow.optional.array.ofType(ow.string),
  maxBundleGas: ow.number,
  minStake: ow.string,
  minUnstakeDelay: ow.number,
  autoBundleInterval: ow.number,
  autoBundleMempoolSize: ow.number,
  addressManager: ow.string,
  l1NodeWeb3Url: ow.string,
  enableDebugMethods: ow.boolean,
}

// Defaults taken from eth-infinitism repo
export const bundlerConfigDefault: Partial<BundlerConfig> = {
  port: '3000',
  entryPoint: '0x1306b01bC3e4AD202612D3843387e94737673F53',
  unsafe: false,
  conditionalRpc: false,
  minStake: '1',
  minUnstakeDelay: 0,
  autoBundleInterval: 3,
  autoBundleMempoolSize: 10,
  enableDebugMethods: false,
}
