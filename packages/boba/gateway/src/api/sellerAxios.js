import axios from 'axios'
import { SELLER_OPTIMISM_API_URL } from 'util/constant'

const _sellerAxiosInstance = axios.create({
  baseURL: SELLER_OPTIMISM_API_URL,
})

_sellerAxiosInstance.interceptors.request.use((config) => {
  config.headers['Accept'] = 'application/json'
  config.headers['Content-Type'] = 'application/json'
  return config
})

export default _sellerAxiosInstance
