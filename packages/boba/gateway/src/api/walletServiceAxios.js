import axios from 'axios'
import { getBaseServices } from 'util/masterConfig'

export default function walletServiceAxiosInstance(networkGateway){

  let axiosInstance = axios.create({
    baseURL: getBaseServices().WALLET_SERVICE,
  })

  axiosInstance.interceptors.request.use((config) => {
    config.headers['Accept'] = 'application/json'
    config.headers['Content-Type'] = 'application/json'
    return config
  })

  return axiosInstance
}
