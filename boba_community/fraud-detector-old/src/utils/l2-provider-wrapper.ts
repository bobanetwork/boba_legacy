import { providers } from 'ethers'
import { toUnpaddedHexString } from './hex-utils'

export class L2ProviderWrapper {
  
  constructor(public provider: providers.JsonRpcProvider) {}

  public async getStateRoot(index: number): Promise<string> {

    const block = await this.provider.send('eth_getBlockByNumber', [
      toUnpaddedHexString(index),
      false,
    ])
    
    //this frequently gives null
    if (block === null) {
      console.log("Did not get a stateroot")
      return null
    }
    else {
      return block.stateRoot
    }
  }

}
