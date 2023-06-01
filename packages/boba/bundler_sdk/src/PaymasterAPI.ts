import { UserOperationStruct } from '@boba/accountabstraction'
import { hexConcat, hexZeroPad } from 'ethers/lib/utils'

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
