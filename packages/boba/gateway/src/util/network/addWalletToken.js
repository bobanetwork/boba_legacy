import { utils } from 'ethers';
import { getWalletType } from 'actions/networkAction';
import WalletConnectProvider from "@walletconnect/web3-provider";

const getLogoURI = (token) => {
    const logoURIbase = 'https://raw.githubusercontent.com/bobanetwork/token-list/main/assets';
    return `${logoURIbase}/${token.toLowerCase()}.svg`
}


export const addWalletToken = async (token) => {
  const { ethereum } = window;

  const walletType = getWalletType();

  const { address, symbol, decimals, chainId } = token;
  const logoURI = getLogoURI(symbol);
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
  } else if (walletType === "walletconnect") {
    const provider = new WalletConnectProvider({
      infuraId: "YOUR_INFURA_ID",
    });
    await provider.enable();
    await provider.send("wallet_watchAsset", {
      type: "ERC20",
      options: {
        address,
        symbol,
        decimals,
        image: logoURI,
        chainId: hexChain,
      },
    });
  }
};


  export const addTokenToWallet = async (token) => {
    addWalletToken(token);
  };