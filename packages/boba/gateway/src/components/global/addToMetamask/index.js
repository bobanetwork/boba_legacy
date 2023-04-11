import React from 'react';
import { getWalletType } from 'actions/networkAction';
import { getCoinImage } from 'util/coinImage';
import MetamaskLogo from 'images/metamask.svg';

export const AddToMetamask = ({ token }) => {
  const { ethereum } = window;
  const { address, symbol, decimals, chain } = token || {};
  const walletType = getWalletType();
  const logoURI = getCoinImage(symbol);
  const handleAddToMetamask =  () => {
    if (walletType === "metamask" && ethereum && ethereum.isMetaMask) {
      ethereum
        .request({
          method: "wallet_watchAsset",
          params: {
            type: "ERC20",
            options: {
              address,
              symbol,
              decimals,
              image: logoURI,
              chainId: chain,
            },
          },
        })
        .catch((error) => {
          console.error(error);
        });
    }
  };

  return (
    <div
      style={{cursor:'pointer'}}
      onClick={handleAddToMetamask}
    >
      <img src={MetamaskLogo} alt="add To Metamask" width="20px" height="20px"/>
    </div>
  );
};

