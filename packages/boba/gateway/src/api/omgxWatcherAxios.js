import axios from 'axios'
import { getNetwork } from 'util/masterConfig'
const nw = getNetwork()

export default function omgxWatcherAxiosInstance(networkGateway){

  let axiosInstance = null

  if(networkGateway === 'local') {
    return null //does not make sense on local
  }
  else if (networkGateway === 'goerli') {
    if(nw.goerli.OMGX_WATCHER_URL === null) return
    axiosInstance = axios.create({
      baseURL: nw.goerli.OMGX_WATCHER_URL,
    })
  }
  else if (networkGateway === 'mainnet') {

    if(nw.mainnet.OMGX_WATCHER_URL === null) return
    axiosInstance = axios.create({
      baseURL: nw.mainnet.OMGX_WATCHER_URL,
    })
  }

  axiosInstance.interceptors.request.use((config) => {
    config.headers['Accept'] = 'application/json'
    config.headers['Content-Type'] = 'application/json'
    return config
  })

  return axiosInstance
}
