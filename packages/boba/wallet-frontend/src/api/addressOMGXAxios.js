import axios from 'axios'
import { getAllNetworks } from 'util/masterConfig'
const nw = getAllNetworks()

export default function addressBOBAAxiosInstance(masterSystemConfig){

  if(masterSystemConfig === 'local') {
    return axios.create({baseURL: nw.local.addressBOBAUrl})
  }
  else if (masterSystemConfig === 'rinkeby') {
    return axios.create({baseURL: nw.rinkeby.addressBOBAUrl})
  }
  else if (masterSystemConfig === 'mainnet') {
    return axios.create({baseURL: nw.mainnet.addressBOBAUrl})
  }

}
