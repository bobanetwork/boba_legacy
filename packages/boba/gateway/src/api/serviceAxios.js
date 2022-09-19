import axios from 'axios'
import { SERVICE_OPTIMISM_API_URL } from 'util/constant'

const _serviceAxiosInstance = axios.create({
  baseURL: SERVICE_OPTIMISM_API_URL,
})

_serviceAxiosInstance.interceptors.request.use((config) => {
  config.headers[ 'Accept' ] = 'application/json'
  config.headers[ 'Content-Type' ] = 'application/json'
  return config
})

export default _serviceAxiosInstance
