/* External Imports */
import { promisify } from 'util'
import { exec } from 'child_process'
import {
  computeStorageSlots,
  getStorageLayout,
} from '@defi-wonderland/smock/dist/src/utils'
import { remove0x } from '@eth-optimism/core-utils'
import { utils, BigNumber, constants } from 'ethers'
import { L2_L1NativeTokenHepler } from './L2_L1NativeTokenHepler'
import { L2_BOBA  } from './L2_BOBAHelper'

/* Internal Imports */
import { predeploys } from './predeploys'
import { getContractArtifact } from './contract-artifacts'

export interface RollupDeployConfig {
  // Deployer address
  deployer: string
  // Address that will own the L2 deployer whitelist.
  whitelistOwner: string
  // Address that will own the L2 gas price oracle.
  gasPriceOracleOwner: string
  // Overhead value of the gas price oracle
  gasPriceOracleOverhead: number
  // Scalar value of the gas price oracle
  gasPriceOracleScalar: number
  // L1 base fee of the gas price oracle
  gasPriceOracleL1BaseFee: number
  // L2 gas price of the gas price oracle
  gasPriceOracleGasPrice: number
  // Number of decimals of the gas price oracle scalar
  gasPriceOracleDecimals: number
  // Initial value for the L2 block gas limit.
  l2BlockGasLimit: number
  // Chain ID to give the L2 network.
  l2ChainId: number
  // Address of the key that will sign blocks.
  blockSignerAddress: string
  // Address of the L1StandardBridge contract.
  l1StandardBridgeAddress: string
  // Address of the L1 fee wallet.
  l1FeeWalletAddress: string
  // Address of the L1CrossDomainMessenger contract.
  l1CrossDomainMessengerAddress: string
  // Boba turing price
  bobaTuringPrice: string
  // Turing helper json
  TuringHelperJson: any
  // L1 Boba Token address
  l1BobaTokenAddress: any
  // Block height to activate berlin hardfork
  berlinBlock: number
  // L1 native token - name
  l1NativeTokenName: string
  // L1 native token - symbol
  l1NativeTokenSymbol: string
  // L1 native token - decimals
  l1NativeTokenDecimals: number
}

const addSlotsForBobaProxyContract = (
  dump: any, predeployAddress: string, variable: any
) => {
  for (const keyName of Object.keys(variable)) {
    const key = utils.hexlify(utils.toUtf8Bytes(keyName));
    const index = BigNumber.from('0').toHexString();
    const newKeyPreimage = utils.concat([key, utils.hexZeroPad(index, 32)]);
    const compositeKey = utils.keccak256(utils.hexlify(newKeyPreimage));
    dump[predeployAddress].storage[compositeKey] = variable[keyName]
  }
  return dump
}

/**
 * Generates the initial state for the L2 system by injecting the relevant L2 system contracts.
 *
 * @param cfg Configuration for the L2 system.
 * @returns Generated L2 genesis state.
 */
export const makeL2GenesisFile = async (
  cfg: RollupDeployConfig
): Promise<any> => {
  // Very basic validation.
  for (const [key, val] of Object.entries(cfg)) {
    if (val === undefined) {
      throw new Error(`must provide an input for config value: ${key}`)
    }
  }

  const variables = {
    OVM_DeployerWhitelist: {
      owner: cfg.whitelistOwner,
    },
    OVM_GasPriceOracle: {
      _owner: cfg.gasPriceOracleOwner,
      gasPrice: cfg.gasPriceOracleGasPrice,
      l1BaseFee: cfg.gasPriceOracleL1BaseFee,
      overhead: cfg.gasPriceOracleOverhead,
      scalar: cfg.gasPriceOracleScalar,
      decimals: cfg.gasPriceOracleDecimals,
    },
    L2StandardBridge: {
      l1TokenBridge: cfg.l1StandardBridgeAddress,
      messenger: predeploys.L2CrossDomainMessenger,
    },
    OVM_SequencerFeeVault: {
      l1FeeWallet: cfg.l1FeeWalletAddress,
    },
    L2_BOBA: {
      _name: 'Boba Network',
      _symbol: 'BOBA',
      l1Token: cfg.l1BobaTokenAddress,
      l2Bridge:predeploys.L2StandardBridge,
    },
    L2_L1NativeToken: {
      l2Bridge: predeploys.L2StandardBridge,
      l1Token: constants.AddressZero,
      _name: cfg.l1NativeTokenName, // from env
      _symbol: cfg.l1NativeTokenSymbol, // from env
      _decimals: cfg.l1NativeTokenDecimals, // from env
    },
    L2CrossDomainMessenger: {
      // We default the xDomainMsgSender to this value to save gas.
      // See usage of this default in the L2CrossDomainMessenger contract.
      xDomainMsgSender: '0x000000000000000000000000000000000000dEaD',
      l1CrossDomainMessenger: cfg.l1CrossDomainMessengerAddress,
      // Set the messageNonce to a high value to avoid overwriting old sent messages.
      messageNonce: 100000,
    },
    Lib_ResolvedDelegateBobaProxy: {
      proxyOwner: cfg.deployer,
      proxyTarget: predeploys.BobaTuringCredit
    },
    BobaTuringCredit: {
      owner: cfg.deployer,
      turingPrice: cfg.bobaTuringPrice
    },
    BobaTuringHelper: {
      Self: predeploys.BobaTuringHelper
    },
    Proxy__Boba_GasPriceOracle: {
      proxyOwner: cfg.deployer,
      proxyTarget: predeploys.Boba_GasPriceOracle
    },
    Boba_GasPriceOracle: {
      _owner: cfg.gasPriceOracleOwner,
      feeWallet: cfg.l1FeeWalletAddress,
      secondaryFeeTokenAddress: predeploys.L2_L1NativeToken,
      minPriceRatio: 500,
      maxPriceRatio: 5000,
      priceRatio: 2000,
      gasPriceOracleAddress: predeploys.OVM_GasPriceOracle,
      metaTransactionFee: utils.parseEther('3'),
      receivedBOBAAmount: utils.parseEther('0.005'),
      marketPriceRatio: 2000,
      decimals: 0,
    }
  }

  const dump = {}
  for (const predeployName of Object.keys(predeploys)) {
    const predeployAddress = predeploys[predeployName]
    dump[predeployAddress] = {
      balance: '00',
      storage: {},
    }

    if (predeployName === 'OVM_L1BlockNumber') {
      // OVM_L1BlockNumber is a special case where we just inject a specific bytecode string.
      // We do this because it uses the custom L1BLOCKNUMBER opcode (0x4B) which cannot be
      // directly used in Solidity (yet). This bytecode string simply executes the 0x4B opcode
      // and returns the address given by that opcode.
      dump[predeployAddress].code = '0x4B60005260206000F3'
    } else if (predeployName === 'BobaTuringHelper') {
      // Add a default BobaTuringHelper for testing purposes
      dump[predeployAddress].code = cfg.TuringHelperJson.deployedBytecode
    } else if (predeployName === 'L2_L1NativeToken') {
      // Fix the address(this) of L2GovernanceERC20
      // Different network use the different bytecode
      // Fantom local
      if (cfg.l1NativeTokenSymbol === 'FTM' && cfg.l2ChainId === 31338) {
        dump[predeployAddress].code = L2_L1NativeTokenHepler.FantomLocalBytecode
      }
      // Fantom Testnet
      if (cfg.l1NativeTokenSymbol === 'FTM' && cfg.l2ChainId === 4051) {
        dump[predeployAddress].code = L2_L1NativeTokenHepler.FantomTestnetBytecode
      }
      // Moonbeam local
      if (cfg.l1NativeTokenSymbol === 'GLMR' && cfg.l2ChainId === 31338) {
        dump[predeployAddress].code = L2_L1NativeTokenHepler.MoonbeamLocalBytecode
      }
      // Moonbeam Mainnet
      if (cfg.l1NativeTokenSymbol === 'GLMR' && cfg.l2ChainId === 1294) {
        dump[predeployAddress].code = L2_L1NativeTokenHepler.MoonbeamMainnetBytecode
      }
      // Avalanche local
      if (cfg.l1NativeTokenSymbol === 'AVAX' && cfg.l2ChainId === 31338) {
        dump[predeployAddress].code = L2_L1NativeTokenHepler.AvalancheLocalByteCode
      }
      // Avalanche Testnet
      if (cfg.l1NativeTokenSymbol === 'AVAX' && cfg.l2ChainId === 4328) {
        dump[predeployAddress].code = L2_L1NativeTokenHepler.AvalancheTestnetByteCode
      }
      // Avalanche Mainnet
      if (cfg.l1NativeTokenSymbol === 'AVAX' && cfg.l2ChainId === 43288) {
        dump[predeployAddress].code = L2_L1NativeTokenHepler.AvalancheMainnetByteCode
      }
      // Bnb local
      if (cfg.l1NativeTokenSymbol === 'BNB' && cfg.l2ChainId === 31338) {
        dump[predeployAddress].code = L2_L1NativeTokenHepler.BnbLocalBytecode
      }
      // Bnb Testnet
      if (cfg.l1NativeTokenSymbol === 'BNB' && cfg.l2ChainId === 9728) {
        dump[predeployAddress].code = L2_L1NativeTokenHepler.BnbTestnetBytecode
      }
      // Bnb Mainnet
      if (cfg.l1NativeTokenSymbol === 'BNB' && cfg.l2ChainId === 56288) {
        dump[predeployAddress].code = L2_L1NativeTokenHepler.BnbMainnetBytecode
      }
    } else if (predeployName === 'Proxy__Boba_GasPriceOracle') {
      // Add proxy contract for Boba_GasPriceOracle
      const artifact = getContractArtifact('Lib_ResolvedDelegateBobaProxy')
      dump[predeployAddress].code = artifact.deployedBytecode
    } else if (predeployName === 'L2_BOBA') {
      dump[predeployAddress].code = L2_BOBA.L2_BOBABytecode
    } else {
      // Standard case: get the deployed bytecode from the artifact
      const artifact = getContractArtifact(predeployName)
      dump[predeployAddress].code = artifact.deployedBytecode
    }

    // Compute and set the required storage slots for each contract that needs it.
    if (predeployName in variables) {
      if (predeployName === 'BobaTuringHelper') {
        // Add a default BobaTuringHelper for testing purposes
        const indexOwner = BigNumber.from('0').toHexString();
        dump[predeployAddress].storage[utils.hexZeroPad(indexOwner, 32)] = cfg.deployer
        const indexAddress = BigNumber.from('1').toHexString();
        dump[predeployAddress].storage[utils.hexZeroPad(indexAddress, 32)] = predeploys.BobaTuringHelper
        continue
      }
      if (predeployName === 'Proxy__Boba_GasPriceOracle') {
        // Add a proxy contract for Boba_GasPriceOracle
        addSlotsForBobaProxyContract(dump, predeployAddress, variables[predeployName])
        const storageLayout = await getStorageLayout('Boba_GasPriceOracle')
        const slots = computeStorageSlots(storageLayout, variables['Boba_GasPriceOracle'])
        for (const slot of slots) {
          dump[predeploys.Proxy__Boba_GasPriceOracle].storage[slot.key] = slot.val
        }
        continue
      }
      const storageLayout = await getStorageLayout(predeployName)
      // Calculate the mapping keys
      if (predeployName === 'Lib_ResolvedDelegateBobaProxy') {
        addSlotsForBobaProxyContract(dump, predeployAddress, variables[predeployName])
      } else {
        const slots = computeStorageSlots(storageLayout, variables[predeployName])
        for (const slot of slots) {
          dump[predeployAddress].storage[slot.key] = slot.val
          // Add the storage slots for Proxy__BobaTuringCredit
          if (predeployName === "BobaTuringCredit") {
            dump[predeploys.Lib_ResolvedDelegateBobaProxy].storage[slot.key] = slot.val
          }
        }
      }
    }
  }

  // Grab the commit hash so we can stick it in the genesis file.
  let commit: string
  try {
    const { stdout } = await promisify(exec)('git rev-parse HEAD')
    commit = stdout.replace('\n', '')
  } catch {
    console.log('unable to get commit hash, using empty hash instead')
    commit = '0000000000000000000000000000000000000000'
  }

  return {
    commit,
    config: {
      chainId: cfg.l2ChainId,
      homesteadBlock: 0,
      eip150Block: 0,
      eip155Block: 0,
      eip158Block: 0,
      byzantiumBlock: 0,
      constantinopleBlock: 0,
      petersburgBlock: 0,
      istanbulBlock: 0,
      muirGlacierBlock: 0,
      berlinBlock: cfg.berlinBlock,
      clique: {
        period: 0,
        epoch: 30000,
      },
    },
    difficulty: '1',
    gasLimit: cfg.l2BlockGasLimit.toString(10),
    extradata:
      '0x' +
      '00'.repeat(32) +
      remove0x(cfg.blockSignerAddress) +
      '00'.repeat(65),
    alloc: dump,
  }
}
