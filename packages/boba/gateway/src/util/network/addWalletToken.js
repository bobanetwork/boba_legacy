import { utils } from 'ethers';
import { getWalletType } from 'actions/networkAction';
import {getCoinImage} from '../coinImage';


export const addWalletToken = async (token) => {
  const { ethereum } = window;

  const walletType = getWalletType();
  const { address, symbol, decimals, chainId } = token;
  const logoURI = getCoinImage(symbol);
  const hexChain = utils.hexValue(chainId);

  if (walletType === "metamask") {
    await ethereum.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: {
          address,
          symbol,
          decimals,
          image: logoURI,
          chainId: hexChain,
        },
      },
    });
  }
};


  export const addTokenToWallet = async (token) => {
    addWalletToken(token);
  };