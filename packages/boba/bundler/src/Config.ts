/* eslint-disable prefer-arrow/prefer-arrow-functions */
import ow from 'ow'
import fs from 'fs'

import { BundlerConfig, bundlerConfigDefault, BundlerConfigShape } from './BundlerConfig'
import { ethers, Wallet } from 'ethers'
import { BaseProvider } from '@ethersproject/providers'

function getCommandLineParams (programOpts: any): Partial<BundlerConfig> {
  const params: any = {}
  for (const bundlerConfigShapeKey in BundlerConfigShape) {
    const optionValue = programOpts[bundlerConfigShapeKey]
    if (optionValue != null) {
      params[bundlerConfigShapeKey] = optionValue
    }
  }
  console.log(params['maxBundleGas'])
  params['maxBundleGas'] = parseInt(params['maxBundleGas'], 10)
  return params as BundlerConfig
}

function mergeConfigs (...sources: Array<Partial<BundlerConfig>>): BundlerConfig {
  const mergedConfig = Object.assign({}, ...sources)
  ow(mergedConfig, ow.object.exactShape(BundlerConfigShape))
  return mergedConfig
}

export async function resolveConfiguration (programOpts: any): Promise<{ config: BundlerConfig, provider: BaseProvider, wallet: Wallet }> {
  // console.log(config.maxBundleGas)
  // console.log(programOpts.config.maxBundleGas)
  // console.log(commandLineParams.maxBundleGas)
  // config.maxBundleGas = parseInt(programOpts.config.maxBundleGas, 10)
  // console.log(config)
  console.log('resolveConfiguration')
  console.log(programOpts)
  const commandLineParams = getCommandLineParams(programOpts)
  console.log('resolveConfiguration1')
  let fileConfig: Partial<BundlerConfig> = {}
  const configFileName = programOpts.config
  if (fs.existsSync(configFileName)) {
    fileConfig = JSON.parse(fs.readFileSync(configFileName, 'ascii'))
  }
  console.log(bundlerConfigDefault)
  console.log(fileConfig)
  console.log(commandLineParams)
  console.log('resolveConfiguration2')

  const config = mergeConfigs(bundlerConfigDefault, fileConfig, commandLineParams)
  console.log('Merged configuration:', JSON.stringify(config))

  const provider: BaseProvider = config.network === 'hardhat'
    // eslint-disable-next-line
    ? require('hardhat').ethers.provider
    : ethers.getDefaultProvider(config.network)

  let mnemonic: string
  let wallet: Wallet
  try {
    if (fs.existsSync(config.mnemonic)) {
      mnemonic = fs.readFileSync(config.mnemonic, 'ascii').trim()
      wallet = Wallet.fromMnemonic(mnemonic).connect(provider)
    } else {
      wallet = new Wallet(config.mnemonic, provider)
    }
  } catch (e: any) {
    throw new Error(`Unable to read --mnemonic ${config.mnemonic}: ${e.message as string}`)
  }
  return { config, provider, wallet }
}
