import walletServiceAxiosInstance from 'api/walletServiceAxios'
import { WALLET_VERSION } from 'util/constant'

export const checkVersion = () => {
  walletServiceAxiosInstance('temporary_placeholder').get('get.wallet.version').then((res) => {
    if (res.status === 201) {
      if (res.data !== '') {
        if (res.data.version !== WALLET_VERSION) {
          caches.keys().then(async function (names) {
            await Promise.all(names.map((name) => caches.delete(name)))
          })
        }
      }
    } else {
      return ''
    }
  })
}
