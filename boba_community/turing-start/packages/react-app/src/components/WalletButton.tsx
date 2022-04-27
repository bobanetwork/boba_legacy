import React, {useEffect, useState} from "react";
import { shortenAddress, useEthers, useLookupAddress, useTokenBalance } from "@usedapp/core";
import {Button} from "./index";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { solid } from "@fortawesome/fontawesome-svg-core/import.macro";
import { Chip, Stack } from "@mui/material";
import { BigNumber } from "@ethersproject/bignumber";
import { formatEther } from "@ethersproject/units";
import { L2GovernanceERC20 } from "@turing/contracts/gen/types";

interface IWalletButtonProps {
  contractBobaToken: L2GovernanceERC20;
}

/*const switchNetwork = () => {
  if (window.ethereum.networkVersion !== chainId) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: web3.utils.toHex(chainId) }]
      });
    } catch (err) {
      // This error code indicates that the chain has not been added to MetaMask
      if (err.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainName: 'Polygon Mainnet',
              chainId: web3.utils.toHex(chainId),
              nativeCurrency: { name: 'MATIC', decimals: 18, symbol: 'MATIC' },
              rpcUrls: ['https://polygon-rpc.com/']
            }
          ]
        });
      }
    }
  }
}*/

export function WalletButton(props: IWalletButtonProps) {
  const [rendered, setRendered] = useState("");

  const ens = useLookupAddress();
  const { account, activateBrowserWallet, deactivate, error, chainId, library: provider } = useEthers();

  /*const chainConfig = getChainConfig()
  if (chainId !== chainConfig.readOnlyChainId) {
    await switchNetwork(chainConfig);
  }*/

  const bobaTokenBalance = useTokenBalance(props.contractBobaToken.address, account) ?? BigNumber.from(0);

  useEffect(() => {
    if (ens) {
      setRendered(ens);
    } else if (account) {
      setRendered(shortenAddress(account));
    } else {
      setRendered("");
    }
  }, [account, ens, setRendered]);

  useEffect(() => {
    if (error) {
      console.error("Error while connecting wallet:", error.message);
    }
  }, [error]);

  return <Stack direction='row' spacing={2} justifyContent="right" alignItems="center" marginRight={6}>
    <Chip label={`${(+formatEther(bobaTokenBalance)).toFixed(2)} BOBA`} color='primary' />
    <Button
      onClick={() => {
        if (!account) {
          activateBrowserWallet();
        } else {
          deactivate();
        }
      }}
    >
      {rendered === "" && <><FontAwesomeIcon bounce={true} icon={solid('plug')}/>&nbsp;Connect Wallet</>}
      {rendered !== "" && <><FontAwesomeIcon icon={solid('wallet')}/>&nbsp;{rendered}</>}
    </Button>
  </Stack>;
}
