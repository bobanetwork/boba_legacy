import axios from 'axios'
import { getNetwork } from 'util/masterConfig'
const nw = getNetwork()

export default function omgxWatcherAxiosInstance(masterSystemConfig){
  
  let axiosInstance = null
  
  if(masterSystemConfig === 'local') {
    return null //does not make sense on local
  } 
  else if (masterSystemConfig === 'rinkeby') {
    if(nw.rinkeby.OMGX_WATCHER_URL === null) return
    axiosInstance = axios.create({
      baseURL: nw.rinkeby.OMGX_WATCHER_URL,
    })
  }
  else if (masterSystemConfig === 'mainnet') {

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