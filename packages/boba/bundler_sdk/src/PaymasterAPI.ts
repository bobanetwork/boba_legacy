import { UserOperationStruct } from '@boba/accountabstraction'
import { hexConcat, hexZeroPad } from "ethers/lib/utils";
import { calcPreVerificationGas } from "./calcPreVerificationGas";
import { ethers } from "ethers";

// TODO: Remove before merge if not needed
export const DUMMY_PAYMASTER_AND_DATA =
  '0x0101010101010101010101010101010101010101000000000000000000000000000000000000000000000000000001010101010100000000000000000000000000000000000000000000000000000000000000000101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101'

export interface IPaymasterAPIConfig {
  depositPaymasterAddress?: string
  erc20TokenAddress?: string
}

/**
 * an API to external a UserOperation with paymaster info
 */
export class PaymasterAPI {
  constructor(private config?: IPaymasterAPIConfig) {}

  /**
   * @param userOp a partially-filled UserOperation (without signature and paymasterAndData
   *  note that the "preVerificationGas" is incomplete: it can't account for the
   *  paymasterAndData value, which will only be returned by this method..
   * @returns the value to put into the PaymasterAndData, undefined to leave it empty
   */
  async getPaymasterAndData (userOp: Partial<UserOperationStruct>): Promise<string | undefined> {
    if (this.config.erc20TokenAddress && this.config.depositPaymasterAddress) {
      return hexConcat([
        this.config.depositPaymasterAddress,
        hexZeroPad(this.config.erc20TokenAddress, 20),
      ])
    }
    return '0x'
  }
}
