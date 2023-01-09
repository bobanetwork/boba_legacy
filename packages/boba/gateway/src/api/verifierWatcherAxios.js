import axios from 'axios'
import { getNetwork } from 'util/masterConfig'
const nw = getNetwork()

export default function verifierWatcherAxiosInstance(networkConfig) {
  const url = networkConfig[ 'VERIFIER_WATCHER_URL' ]

  console.log([
    'verifierurl', url
  ])
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
