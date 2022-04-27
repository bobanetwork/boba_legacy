import React, {useEffect, useState} from "react";
import { shortenAddress, useEthers, useLookupAddress, useTokenBalance } from "@usedapp/core";
import {Button} from "./index";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { solid } from "@fortawesome/fontawesome-svg-core/import.macro";
import { Chip, Stack } from "@mui/material";
import { BigNumber } from "@ethersproject/bignumber";
import { formatEther } from "@ethersproject/units";
import { L2GovernanceERC20 } from "@turing/contracts/gen/types";
import useMediaQuery from '@mui/material/useMediaQuery';
import { getChainConfig } from "../constants/network.constants";
import { isTestEnv } from "../utils/environment.utils";

interface IWalletButtonProps {
  contractBobaToken: L2GovernanceERC20;
}

const switchNetwork = async () => {
  const chainConfig = getChainConfig()
  const eth = (window as any).ethereum
  if (eth.networkVersion !== chainConfig.readOnlyChainId) {
    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainConfig.readOnlyChainId.toString(16)}` }]
      });
    } catch (err: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (err.code === 4902) {
        await eth.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainName: `Boba ${isTestEnv() ? 'Rinkeby Testnet' : 'Mainnet'}`,
              chainId: `0x${chainConfig.readOnlyChainId.toString(16)}`,
              nativeCurrency: { name: 'ETH', decimals: 18, symbol: 'ETH' },
              rpcUrls: [
                `https://${isTestEnv() ? 'rinkeby' : 'mainnet'}.boba.network`
              ]
            }
          ]
        });
      }
    }
  }
}

export function WalletButton(props: IWalletButtonProps) {
  const [rendered, setRendered] = useState("");

  const ens = useLookupAddress();
  const { account, activateBrowserWallet, deactivate, error, chainId } = useEthers();

  const bobaTokenBalance = useTokenBalance(props.contractBobaToken.address, account) ?? BigNumber.from(0);
  const isLargeScreen = useMediaQuery('(min-width:600px)');

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
    {rendered !== "" && isLargeScreen ? <Chip label={`${(+formatEther(bobaTokenBalance)).toFixed(2)} BOBA`} color='primary' /> : null}
    <Button
      onClick={async () => {
        if (!account) {
          await switchNetwork()
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
