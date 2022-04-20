import React, {useEffect, useState} from "react";
import {shortenAddress, useEthers, useLookupAddress} from "@usedapp/core";
import {Button} from "./index";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { solid } from "@fortawesome/fontawesome-svg-core/import.macro";

export function WalletButton() {
  const [rendered, setRendered] = useState("");

  const ens = useLookupAddress();
  const { account, activateBrowserWallet, deactivate, error } = useEthers();

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

  return (
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
  );
}
