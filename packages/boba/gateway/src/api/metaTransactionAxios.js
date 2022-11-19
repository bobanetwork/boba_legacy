import axios from 'axios'
import { TESTNET_NETWORK_NAME } from 'util/constant';
import { getBaseServices } from 'util/masterConfig'

export default function metaTransactionAxiosInstance(networkGateway){

  let axiosInstance = null;

  if(networkGateway === 'local') {
    return null //does not make sense on local
  }
  else if (networkGateway === 'goerli') {
    axiosInstance = axios.create({
      baseURL: getBaseServices().GOERLI_META_TRANSACTION,
    })
  }
  else if (networkGateway === 'mainnet') {
    axiosInstance = axios.create({
      baseURL: getBaseServices().MAINNET_META_TRANSACTION,
    })
  }

  axiosInstance.interceptors.request.use((config) => {
    config.headers['Accept'] = 'application/json'
    config.headers['Content-Type'] = 'application/json'
    return config
  })

  return axiosInstance
}
