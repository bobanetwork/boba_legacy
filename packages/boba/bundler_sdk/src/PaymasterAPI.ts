import { UserOperationStruct } from '@bobanetwork/accountabstraction'
import { hexConcat, hexZeroPad } from 'ethers/lib/utils'

export interface IPaymasterAPIConfig {
  paymasterAndData?: string
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
    return this.config.paymasterAndData ?? '0x'
  }
}
