

import { logAmount } from "util/amountConvert";
import networkService from "./networkService";


class GasService {

  /**
   * @getGas
  */
  async getGas() {
    try {
      const { L1Provider, L2Provider } = networkService;
      const [gasPrice1, gasPrice2, block1, block2] = await Promise.all([
        L1Provider.getGasPrice(),
        L2Provider.getGasPrice(),
        L1Provider.getBlockNumber(),
        L2Provider.getBlockNumber(),
      ]);
  
      const formatGas = (gasPrice) => Number(logAmount(gasPrice.toString(), 9)).toFixed(0);
  
      return {
        gasL1: formatGas(gasPrice1),
        gasL2: formatGas(gasPrice2),
        blockL1: Number(block1),
        blockL2: Number(block2),
      };
    } catch (error) {
      console.log("GS: getGas error:", error);
      return error;
    }
  }

}

const gasService = new GasService();

export default gasService;
