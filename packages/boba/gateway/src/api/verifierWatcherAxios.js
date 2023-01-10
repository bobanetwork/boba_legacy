import axios from 'axios'

export default function verifierWatcherAxiosInstance(networkConfig) {
  const url = networkConfig[ 'VERIFIER_WATCHER_URL' ]

  let axiosInstance = axios.create({
    baseURL: url
  })

  axiosInstance.interceptors.request.use((config) => {
    config.headers[ 'Accept' ] = 'application/json'
    config.headers[ 'Content-Type' ] = 'application/json'
    return config
  })

  return axiosInstance
}
