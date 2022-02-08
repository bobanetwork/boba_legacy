import axios from 'axios'
import { getNetwork } from 'util/masterConfig'
const nw = getNetwork()

export default function etherScanInstance(networkGateway, layer){

  let axiosInstance = null;

  if(networkGateway === 'local') {
    return null //does not make sense on local
  }
  else if (networkGateway === 'rinkeby' && layer === 'L1') {
    axiosInstance = axios.create({
      baseURL: nw.rinkeby.L1.blockExplorer,
    })
  }
  else if (networkGateway === 'rinkeby' && layer === 'L2') {
    axiosInstance = axios.create({
      baseURL: nw.rinkeby.L2.blockExplorer,
    })
  }
  else if (networkGateway === 'mainnet' && layer === 'L1') {
    axiosInstance = axios.create({
      baseURL: nw.mainnet.L1.blockExplorer,
    })
  }
  else if (networkGateway === 'mainnet' && layer === 'L2') {
    axiosInstance = axios.create({
      baseURL: nw.mainnet.L2.blockExplorer,
    })
  }

  axiosInstance.interceptors.request.use((config) => {
    config.headers['Accept'] = 'application/json'
    config.headers['Content-Type'] = 'application/json'
    return config
  })

  return axiosInstance
}
