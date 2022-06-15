import React, { useEffect, useState } from "react";
import { shortenAddress, useEthers, useLookupAddress, useTokenBalance } from "@usedapp/core";
import { CustomButton } from "./index";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { regular, solid } from "@fortawesome/fontawesome-svg-core/import.macro";
import { Button, ButtonGroup, Chip, Stack } from "@mui/material";
import { BigNumber } from "@ethersproject/bignumber";
import { formatEther } from "@ethersproject/units";
import { L2GovernanceERC20 } from "@turing/contracts/gen/types";
import useMediaQuery from "@mui/material/useMediaQuery";
import { getChainConfig } from "../constants/network.constants";
import { isTestEnv } from "../utils/environment.utils";

interface IWalletButtonProps {
  contractBobaToken: L2GovernanceERC20;
}

const switchNetwork = async (chainConfig, chainName: string) => {
  const eth = (window as any).ethereum;
  if (eth.networkVersion !== chainConfig.readOnlyChainId) {
    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${chainConfig.readOnlyChainId.toString(16)}` }]
      });
    } catch (err: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (err.code === 4902) {
        await eth.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainName,
              chainId: `0x${chainConfig.readOnlyChainId.toString(16)}`,
              nativeCurrency: { name: "ETH", decimals: 18, symbol: "ETH" },
              rpcUrls: [
                `https://${isTestEnv() ? "rinkeby" : "mainnet"}.boba.network`
              ]
            }
          ]
        });
      }
    }
  }
};

export function WalletButton(props: IWalletButtonProps) {
  const [rendered, setRendered] = useState("");

  const ens = useLookupAddress();
  const { account, activateBrowserWallet, deactivate, error, chainId } = useEthers();

  const bobaTokenBalance = useTokenBalance(props.contractBobaToken.address, account) ?? BigNumber.from(0);
  const isLargeScreen = useMediaQuery("(min-width:600px)");

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

  const isTestnet = isTestEnv();
  const chainName = `Boba ${isTestnet ? "Rinkeby" : "Mainnet"}`;
  const chainConfig = getChainConfig();

  return <Stack direction="row" spacing={2} justifyContent="right" alignItems="center" marginRight={6}>
    {rendered !== "" && isLargeScreen
      ? <ButtonGroup variant="outlined" size="small" color="primary" aria-label="additional wallet info">
        <Button title={isTestnet ? "Get testnet tokens" : "Buy some BOBA?"}
                style={{borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRight: 0}}
                target="_blank"
                href={isTestnet
                  ? "https://gateway.rinkeby.boba.network/"
                  : `https://oolongswap.com/#/swap?outputCurrency=${props.contractBobaToken.address}`}>
          {bobaTokenBalance.lte(0)
            ? <><FontAwesomeIcon bounce={true} icon={regular("credit-card")} />&nbsp;Get</>
            : (+formatEther(bobaTokenBalance)).toFixed(2)} BOBA</Button>
        <Button title="Switch network?" target='_blank'
                href={isTestnet ? 'https://turing.boba.network/' : 'https://turing.rinkeby.boba.network/'}
                style={{borderTopLeftRadius: 0, borderBottomLeftRadius: 0}}>{chainName}</Button>
      </ButtonGroup> : null}
    <CustomButton
      onClick={async () => {
        if (!account) {
          await switchNetwork(chainConfig, chainName);
          activateBrowserWallet();
        } else {
          deactivate();
        }
      }}
    >
      {rendered === "" && <><FontAwesomeIcon bounce={true} icon={solid("plug")} />&nbsp;Connect Wallet</>}
      {rendered !== "" && <><FontAwesomeIcon icon={solid("wallet")} />&nbsp;{rendered}</>}
    </CustomButton>
  </Stack>;
}
