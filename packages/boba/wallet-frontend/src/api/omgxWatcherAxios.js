import axios from 'axios'
import { getAllNetworks } from 'util/masterConfig'
const nw = getAllNetworks()

export default function bobaWatcherAxiosInstance(masterSystemConfig){

  let axiosInstance = null;

  if(masterSystemConfig === 'local') {
    return null //does not make sense on local
  }
  else if (masterSystemConfig === 'rinkeby') {
    axiosInstance = axios.create({
      baseURL: nw.rinkeby.BOBA_WATCHER_URL,
    })
  }
  else if (masterSystemConfig === 'mainnet') {
    axiosInstance = axios.create({
      baseURL: nw.mainnet.BOBA_WATCHER_URL,
    })
  }

  axiosInstance.interceptors.request.use((config) => {
    config.headers['Accept'] = 'application/json'
    config.headers['Content-Type'] = 'application/json'
    return config
  })

  return axiosInstance
}
