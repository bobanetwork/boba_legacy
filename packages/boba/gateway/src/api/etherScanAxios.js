import axios from 'axios'
export default function etherScanInstance(blockExplorer) {

  let axiosInstance = axios.create({
    baseURL: blockExplorer,
  })

  axiosInstance.interceptors.request.use((config) => {
    config.headers[ 'Accept' ] = 'application/json'
    config.headers[ 'Content-Type' ] = 'application/json'
    return config
  })

  return axiosInstance
}
