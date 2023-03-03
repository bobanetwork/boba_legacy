import axios from 'axios'

export default function metaTransactionAxiosInstance(networkConfig) {
  const url = networkConfig['META_TRANSACTION']

  let axiosInstance = axios.create({
    baseURL: url,
  })

  axiosInstance.interceptors.request.use((config) => {
    config.headers['Accept'] = 'application/json'
    config.headers['Content-Type'] = 'application/json'
    return config
  })

  return axiosInstance
}
