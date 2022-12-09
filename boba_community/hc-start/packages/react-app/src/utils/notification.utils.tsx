import { toast } from "react-toastify";
import { Link } from "@mui/material";
import { getBlockExplorerBaseURL } from "./environment.utils";
import { muiTheme } from "../mui.theme";
import { shortenTransactionHash, TransactionStatus } from "@usedapp/core";
import React from "react";

export const enableNotifications = (txState: TransactionStatus): boolean => {
  // Load notifications
    if (txState.errorMessage) {
      toast(txState.errorMessage, { type: "error" });
      return false;
    }
    if (txState.receipt?.transactionHash) {
      toast(<>Transaction succeeded:&nbsp;<Link
        href={`${getBlockExplorerBaseURL()}/tx/${txState.receipt.transactionHash}`} title="View on Block-Explorer"
      target="_blank" rel="noreferrer" style={{color: muiTheme.palette.primary.dark}}>
      {shortenTransactionHash(txState.receipt.transactionHash)}
      </Link></>, { type: "success" });
      return false;
    }
    return true;
}
