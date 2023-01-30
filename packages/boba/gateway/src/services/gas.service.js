

import { logAmount } from "util/amountConvert";
import networkService from "./networkService";


class GasService {

  /**
   * @getGas
  */

  async getGas() {
    try {
      // get gas price
      const gasPrice1 = await networkService.L1Provider.getGasPrice()
      const gasPrice2 = await networkService.L2Provider.getGasPrice()
      // get block count
      const block1 = await networkService.L1Provider.getBlockNumber()
      const block2 = await networkService.L2Provider.getBlockNumber()

      const gasData = {
        gasL1: Number(logAmount(gasPrice1.toString(),9)).toFixed(0),
        gasL2: Number(logAmount(gasPrice2.toString(),9)).toFixed(0),
        blockL1: Number(block1),
        blockL2: Number(block2),
      }

      return gasData
    } catch (error) {
      console.log("GS: getGas error:",error)
      return error
    }
  }

}

const gasService = new GasService();

export default gasService;
