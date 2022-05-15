import axios from 'axios'
import { getNetwork } from 'util/masterConfig'
const nw = getNetwork()

export default function metaTransactionAxiosInstance(networkGateway) {

  let axiosInstance = null

  if(networkGateway === 'local') {
    return null // does not make sense on local
  }
  else if (networkGateway === 'testnet') {
    axiosInstance = axios.create({
      baseURL: nw.testnet.META_TRANSACTION,
    })
  }
  else if (networkGateway === 'mainnet') {
    axiosInstance = axios.create({
      baseURL: nw.mainnet.META_TRANSACTION,
    })
  }

  axiosInstance.interceptors.request.use((config) => {
    config.headers['Accept'] = 'application/json'
    config.headers['Content-Type'] = 'application/json'
    return config
  })

  return axiosInstance
}