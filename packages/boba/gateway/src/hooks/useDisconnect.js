import { useDispatch } from 'react-redux';
import {
  setLayer,
  setConnect,
  setConnectBOBA,
  setConnectETH,
  setEnableAccount,
  setWalletConnected
} from 'actions/setupAction';

import networkService from 'services/networkService';

const useDisconnect = () => {
  const dispatch = useDispatch();

  const disconnect = async () => {
    await networkService.walletService.disconnectWallet()
    dispatch(setLayer(null))
    dispatch(setConnect(false))
    dispatch(setConnectBOBA(false))
    dispatch(setConnectETH(false))
    dispatch(setWalletConnected(false))
    dispatch(setEnableAccount(false))
  }

  return { disconnect }
}

export default useDisconnect
