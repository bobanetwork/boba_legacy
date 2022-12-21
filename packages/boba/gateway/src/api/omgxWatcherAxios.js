import axios from 'axios'

export default function omgxWatcherAxiosInstance(watcherUrl) {

  let axiosInstance = axios.create({
    baseURL: watcherUrl,
  })

  axiosInstance.interceptors.request.use((config) => {
    config.headers[ 'Accept' ] = 'application/json'
    config.headers[ 'Content-Type' ] = 'application/json'
    return config
  })

  return axiosInstance
}
