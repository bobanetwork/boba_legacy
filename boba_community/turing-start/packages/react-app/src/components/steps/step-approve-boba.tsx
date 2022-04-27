import { CustomButton, SmallerParagraph, StyledInputAdornment } from "../index";
import React, { Dispatch, SetStateAction } from "react";
import { useContractFunction, useEthers, useTokenBalance } from "@usedapp/core";
import { parseEther } from "@ethersproject/units";
import { L2GovernanceERC20 } from "@turing/contracts/gen/types";
import { Contract } from "@ethersproject/contracts";
import { abis, addresses } from "@turing/contracts";
import { utils } from "ethers";
import { getPrettyTransactionStatus, isLoading } from "../../utils/ethers.utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { solid } from "@fortawesome/fontawesome-svg-core/import.macro";
import { BigNumber } from "@ethersproject/bignumber";
import {
  FormControl,
  FormHelperText,
  Link,
  OutlinedInput
} from "@mui/material";
import { muiTheme } from "../../mui.theme";
import { enableNotifications } from "../../utils/notification.utils";

interface IStepApproveBobaState {
  callsToPrepay: string;
}
interface IStepApproveBobaProps {
  setAmountBobaTokensToUseWei: Dispatch<SetStateAction<BigNumber>>;
  handleNextStep: () => void;
  contractBobaToken: L2GovernanceERC20;
}

let newTransaction: boolean = true;
export const StepApproveBoba = (props: IStepApproveBobaProps) => {
  const {
    state: approveState,
    send: approveBoba
  } = useContractFunction(props.contractBobaToken, "approve", { transactionName: "approveBoba" });
  const loadingState: boolean = isLoading(approveState);

  const { account } = useEthers();
  const bobaTokenBalance = useTokenBalance(props.contractBobaToken.address, account) ?? BigNumber.from(0);

  const [values, setValues] = React.useState<IStepApproveBobaState>({
    callsToPrepay: '100',
  });

  const handleChangeBobaTokens = (event: React.ChangeEvent<HTMLInputElement>) => {
    const parsedVal = event.target.value?.replaceAll(',','')
    if (!event.target.value || !parsedVal.match(/^\d+$/)) return; // only numbers
    setValues({ ...values, callsToPrepay: parsedVal.replaceAll(/\B(?=(\d{3})+(?!\d))/g, ",") });
  };

  const amountBobaTokensToUse = 0.01 * parseInt(values.callsToPrepay.replaceAll(',', '')); // 0.01 price for TuringCall
  const amountBobaTokensToUseWei = parseEther(amountBobaTokensToUse.toString());
  const hasEnoughBOBA: boolean = bobaTokenBalance.gte(amountBobaTokensToUseWei);

  if (newTransaction) {
    newTransaction = enableNotifications(approveState)
    if (approveState.status === 'Success') props.handleNextStep();
  }

    return <div style={{ textAlign: "center", marginTop: "2em" }}>
    <SmallerParagraph>You need to prepay your TuringHelper with some BOBA tokens. How many off-chain calls do you want
      to fund?</SmallerParagraph>
    <FormControl sx={{ m: 1, width: "25ch" }} variant="outlined">
      <OutlinedInput
        id="outlined-adornment-boba"
        value={values.callsToPrepay}
        style={{ color: muiTheme.palette.primary.main, textAlign: "center", backgroundColor: "#333" }}
        onChange={handleChangeBobaTokens}
        endAdornment={<StyledInputAdornment position="end">Calls</StyledInputAdornment>}
        aria-describedby="outlined-boba-helper-text"
        inputProps={{
          "aria-label": "boba"
        }}
      />
      {!account || hasEnoughBOBA
        ? <FormHelperText id="outlined-boba-helper-text" style={{ color: muiTheme.palette.secondary.contrastText }}>
          How many calls do you want to prepay? (0.01 BOBA / call)</FormHelperText>
        : <FormHelperText id="outlined-boba-helper-text" style={{ color: "#cc0000" }}>
          You don't have enough BOBA tokens. Please buy some more tokens or reduce the amount of calls.
        </FormHelperText>}
    </FormControl>

    <CustomButton style={{ marginTop: 14 }} disabled={!account || loadingState || !hasEnoughBOBA}
                  onClick={async () => {
              newTransaction = true;
              await approveBoba(addresses.TuringHelperFactory, amountBobaTokensToUseWei);
              props.setAmountBobaTokensToUseWei(amountBobaTokensToUseWei);
            }}>
      {loadingState
        ? <><FontAwesomeIcon icon={solid("spinner")} spin={true} />&nbsp;{getPrettyTransactionStatus(approveState)}</>
        : `Approve ${amountBobaTokensToUse} BOBA`}</CustomButton>
  </div>;
};
