import React from 'react';
import { getCoinImage } from 'util/coinImage';
import MetamaskLogo from 'images/metamask.svg';
import networkService from 'services/networkService';

export const AddToMetamask = ({ token }) => {
  const { symbol } = token || {};
  const logoURI = getCoinImage(symbol);
  const handleAddToMetamask =  () => {
    networkService.walletService.addTokenToMetaMask({...token,logoURI})
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

