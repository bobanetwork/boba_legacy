/* eslint-disable prefer-arrow/prefer-arrow-functions */
import { EntryPoint, EntryPointWrapper } from '@bobanetwork/accountabstraction'
import { ReputationManager } from './ReputationManager'
import { BigNumber, BigNumberish, BytesLike, ethers } from 'ethers'
import { requireCond, RpcError } from '../utils'
import { AddressZero } from '@bobanetwork/bundler_utils'
import { calcPreVerificationGas } from '@bobanetwork/bundler_sdk/dist/calcPreVerificationGas'

import Debug from 'debug'
import { GetCodeHashes__factory } from '../../dist/src/types'
import {
  ReferencedCodeHashes,
  StakeInfo,
  StorageMap,
  UserOperation,
  ValidationErrors,
} from './Types'
import { getAddr, runContractScript } from './moduleUtils'
import { hexlify } from 'ethers/lib/utils'

/**
 * result from successful simulateValidation
 */
export interface ValidationResult {
  returnInfo: {
    preOpGas: BigNumberish
    prefund: BigNumberish
    sigFailed: boolean
    validAfter: number
    validUntil: number
    paymasterContext: string
  }

  senderInfo: StakeInfo
  factoryInfo?: StakeInfo
  paymasterInfo?: StakeInfo
  aggregatorInfo?: StakeInfo
}

export interface ValidateUserOpResult extends ValidationResult {
  referencedContracts: ReferencedCodeHashes
  storageMap: StorageMap
}

const HEX_REGEX = /^0x[a-fA-F\d]*$/i

export class ValidationManager {
  constructor(
    readonly entryPoint: EntryPoint,
    readonly reputationManager: ReputationManager,
    readonly unsafe: boolean,
    readonly entryPointWrapper?: EntryPointWrapper
  ) {}

  // standard eth_call to simulateValidation
  async _callSimulateValidation(
    userOp: UserOperation
  ): Promise<ValidationResult> {
    const simulateValidation =
      await this.entryPointWrapper.callStatic.simulateValidation(userOp, {
        gasLimit: 10e6,
      })
    return this._parseResult(userOp, simulateValidation)
  }

  _parseResult(
    userOp: UserOperation,
    simulateValidation: any
  ): ValidationResult {

    let failedOpStatus: EntryPointWrapper.FailedOpStatusStructOutput
    let response: EntryPointWrapper.ResponseStructOutput
    ;[failedOpStatus, response] = simulateValidation

    if (!response.selectorType.startsWith('ValidationResult')) {
      // parse it as FailedOp
      // if its FailedOp, then we have the paymaster param... otherwise its an Error(string)
      let paymaster = hexlify(userOp.paymasterAndData)?.slice(0, 42)
      if (paymaster === AddressZero) {
        paymaster = undefined
      }

      if (paymaster == null) {
        throw new RpcError(
          `account validation failed: ${failedOpStatus.reason}`,
          ValidationErrors.SimulateValidation
        )
      } else {
        throw new RpcError(
          `paymaster validation failed: ${failedOpStatus.reason}`,
          ValidationErrors.SimulatePaymasterValidation,
          { paymaster }
        )
      }
    }

    // extract address from "data" (first 20 bytes)
    // add it as "addr" member to the "stakeinfo" struct
    // if no address, then return "undefined" instead of struct.
    function fillEntity(
      data: BytesLike,
      info: StakeInfo | EntryPointWrapper.StakeInfoStructOutput
    ): StakeInfo | undefined {
      const addr = getAddr(data)
      return addr == null
        ? undefined
        : {
            ...info,
            addr,
          }
    }

    return {
      returnInfo: response.returnInfo,
      senderInfo: {
        ...response.senderInfo,
        addr: userOp.sender,
      },
      factoryInfo: fillEntity(userOp.initCode, response.factoryInfo),
      paymasterInfo: fillEntity(userOp.paymasterAndData, response.paymasterInfo),
      aggregatorInfo: fillEntity(
        response.aggregatorInfo?.aggregator,
        response.aggregatorInfo?.stakeInfo
      ),
    }
  }

  /**
   * validate UserOperation.
   * should also handle unmodified memory (e.g. by referencing cached storage in the mempool
   * one item to check that was un-modified is the aggregator..
   *
   * @param userOp
   */
  async validateUserOp(
    userOp: UserOperation,
    previousCodeHashes?: ReferencedCodeHashes,
    checkStakes = true
  ): Promise<ValidateUserOpResult> {
    if (previousCodeHashes != null && previousCodeHashes.addresses.length > 0) {
      const CodeHashesWrapper = await this.getCodeHashesWrapper(
        previousCodeHashes.addresses
      )
      const codeHashes = CodeHashesWrapper.hash
      requireCond(
        codeHashes === previousCodeHashes.hash,
        'modified code after first validation',
        ValidationErrors.OpcodeValidation
      )
    }
    let codeHashes: ReferencedCodeHashes = {
      addresses: [],
      hash: '',
    }
    const storageMap: StorageMap = {}

    // NOTE: this mode doesn't do any opcode checking and no stake checking!
    const res = await this._callSimulateValidation(userOp)

    requireCond(
      !res.returnInfo.sigFailed,
      'Invalid UserOp signature or paymaster signature',
      ValidationErrors.InvalidSignature
    )
    requireCond(
      res.returnInfo.validUntil == null ||
        res.returnInfo.validUntil > (Date.now() / 1000) + 30,
      'expires too soon',
      ValidationErrors.ExpiresShortly,
    )
    requireCond(
      res.returnInfo.validAfter == null ||
        // not adding "buffer" here
        res.returnInfo.validAfter < Date.now() / 1000,
      'not valid yet',
      ValidationErrors.NotValidYet,
    )

    if (
      res.aggregatorInfo.addr !== AddressZero &&
      !BigNumber.from(0).eq(res.aggregatorInfo.stake) &&
      !BigNumber.from(0).eq(res.aggregatorInfo.unstakeDelaySec)
    ) {
      this.reputationManager.checkStake('aggregator', res.aggregatorInfo)
    }

    requireCond(
      res.aggregatorInfo.addr === AddressZero &&
        BigNumber.from(0).eq(res.aggregatorInfo.stake) &&
        BigNumber.from(0).eq(res.aggregatorInfo.unstakeDelaySec),
      'Currently not supporting aggregator',
      ValidationErrors.UnsupportedSignatureAggregator
    )

    return {
      ...res,
      referencedContracts: codeHashes,
      storageMap,
    }
  }

  async getCodeHashes(addresses: string[]): Promise<ReferencedCodeHashes> {
    const { hash } = await runContractScript(
      this.entryPoint.provider,
      new GetCodeHashes__factory(),
      [addresses]
    )

    return {
      hash,
      addresses,
    }
  }

  async getCodeHashesWrapper(addresses: string[]): Promise<ReferencedCodeHashes> {
    const hash = await this.entryPointWrapper.getCodeHashes(addresses)

    return {
      hash,
      addresses,
    }
  }

  /**
   * perform static checking on input parameters.
   *
   * @param userOp
   * @param entryPointInput
   * @param requireSignature
   * @param requireGasParams
   */
  validateInputParameters(
    userOp: UserOperation,
    entryPointInput: string,
    requireSignature = true,
    requireGasParams = true
  ): void {
    requireCond(
      entryPointInput != null,
      'No entryPoint param',
      ValidationErrors.InvalidFields
    )
    requireCond(
      entryPointInput.toLowerCase() === this.entryPoint.address.toLowerCase(),
      `The EntryPoint at "${entryPointInput}" is not supported. This bundler uses ${this.entryPoint.address}`,
      ValidationErrors.InvalidFields
    )

    // minimal sanity check: userOp exists, and all members are hex
    requireCond(
      userOp != null,
      'No UserOperation param',
      ValidationErrors.InvalidFields
    )

    const fields = [
      'sender',
      'nonce',
      'initCode',
      'callData',
      'paymasterAndData',
    ]
    if (requireSignature) {
      fields.push('signature')
    }
    if (requireGasParams) {
      fields.push(
        'preVerificationGas',
        'verificationGasLimit',
        'callGasLimit',
        'maxFeePerGas',
        'maxPriorityFeePerGas'
      )
    }
    fields.forEach((key) => {
      const value: string = (userOp as any)[key]?.toString()
      requireCond(
        value != null,
        'Missing userOp field: ' + key + ' ' + JSON.stringify(userOp),
        ValidationErrors.InvalidFields
      )
      requireCond(
        value.match(HEX_REGEX) != null,
        `Invalid hex value for property ${key}:${value} in UserOp`,
        ValidationErrors.InvalidFields
      )
    })

    requireCond(
      userOp.paymasterAndData.length === 2 ||
        userOp.paymasterAndData.length >= 42,
      'paymasterAndData: must contain at least an address',
      ValidationErrors.InvalidFields
    )

    // syntactically, initCode can be only the deployer address. but in reality, it must have calldata to uniquely identify the account
    requireCond(
      userOp.initCode.length === 2 || userOp.initCode.length >= 42,
      'initCode: must contain at least an address',
      ValidationErrors.InvalidFields
    )

    const calcPreVerificationGas1 = calcPreVerificationGas(userOp)
    requireCond(
      userOp.preVerificationGas >= calcPreVerificationGas1,
      `preVerificationGas too low: expected at least ${calcPreVerificationGas1}`,
      ValidationErrors.InvalidFields
    )
  }
}
