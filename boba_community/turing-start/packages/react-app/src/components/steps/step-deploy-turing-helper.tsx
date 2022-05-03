import { TuringHelperFactory } from "@turing/contracts/gen/types";
import { Contract } from "@ethersproject/contracts";
import { abis, addresses } from "@turing/contracts";
import { utils } from "ethers";
import { shortenAddress, useContractFunction, useEthers } from "@usedapp/core";
import { CustomButton, SmallerParagraph } from "../index";
import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { solid } from "@fortawesome/fontawesome-svg-core/import.macro";
import { getPrettyTransactionStatus, isLoading } from "../../utils/ethers.utils";
import { enableNotifications } from "../../utils/notification.utils";
import { BigNumber } from "@ethersproject/bignumber";
import { Chip, FormControl, FormHelperText, OutlinedInput } from "@mui/material";
import { muiTheme } from "../../mui.theme";
import { formatEther } from "@ethersproject/units";
import { useQuery } from "@apollo/client";
import GET_TURING_HELPER_DEPLOYED from "../../graphql/subgraph";
import { toast } from "react-toastify";

interface IStepDeployTuringHelperProps {
  amountBobaForFundingWei: BigNumber;
}

interface IStepDeployTuringHelperState {
  unparsedPermittedCallers: string;
  parsedPermittedCallers: string[];
  validInput: boolean;
}

let newTransaction = true;
export const StepDeployTuringHelper = (props: IStepDeployTuringHelperProps) => {
  const { account } = useEthers();
  const contractTuringFactory: TuringHelperFactory = new Contract(addresses.TuringHelperFactory, new utils.Interface(abis.turingHelperFactory)) as TuringHelperFactory;

  //#region form_handling
  const [values, setValues] = React.useState<IStepDeployTuringHelperState>({
    unparsedPermittedCallers: "",
    parsedPermittedCallers: [],
    validInput: false
  });

  const {
    state: deployState,
    send: deployTuringHelper
  } = useContractFunction(contractTuringFactory, "deployMinimal", { transactionName: "DeployTuringHelper" });
  const loadingState: boolean = isLoading(deployState);

  const handleChangePermittedCallers = (event: React.ChangeEvent<HTMLInputElement>) => {
    let isValid = true;
    let parsedAddresses: string[] = [];
    try {
      parsedAddresses = event.target.value.split(",").map(a => a.trim());
      parsedAddresses.map(a => shortenAddress(a)); // should throw errors if invalid addresses (= smarter than regex)
    } catch {
      isValid = false;
    }
    setValues({
      ...values,
      unparsedPermittedCallers: event.target.value,
      validInput: isValid,
      parsedPermittedCallers: parsedAddresses
    });
  };
  //#endregion

  //#region subgraph
  const [newTuringHelper, setNewTuringHelper] = useState<string>("");

  const { loading, error: subgraphQueryError, data: subgraphData } = useQuery(GET_TURING_HELPER_DEPLOYED, {
    skip: !(deployState.status === "Success")
  });

  useEffect(() => {
    if (subgraphQueryError) {
      toast("Error while querying subgraph:" + subgraphQueryError.message, { type: "error" });
      return;
    }
    if (!loading && subgraphData && subgraphData.turingHelperDeployedEvents) {
      setNewTuringHelper(subgraphData.turingHelperDeployedEvents[0].proxy);
    }
  }, [loading, subgraphQueryError, subgraphData]);
  //#endregion

  if (newTransaction) {
    newTransaction = enableNotifications(deployState);
  }

  return <div style={{ textAlign: "center", marginTop: "2em" }}>
    <SmallerParagraph>Let's deploy the TuringHelper contract. This will also fund the BobaCredit contract (deployed by
      Boba) and assign the prepaid funds to your new TuringHelper.</SmallerParagraph>

    <FormControl sx={{ m: 1, width: "25ch" }} variant="outlined">
      <OutlinedInput
        id="outlined-adornment-permittedcallers"
        multiline={true}
        value={values.unparsedPermittedCallers}
        style={{ color: muiTheme.palette.primary.main, textAlign: "center", backgroundColor: "#333" }}
        onChange={handleChangePermittedCallers}
        aria-describedby="outlined-permittedcallers-helper-text"
        inputProps={{
          "aria-label": "boba"
        }}
      />
      {props.amountBobaForFundingWei.eq(0) ?
        <FormHelperText id="outlined-permittedcallers-helper-text" style={{ color: "#cc0000" }}>
          You need to approve some BOBA tokens first!
        </FormHelperText>
        : values.validInput || !values.unparsedPermittedCallers
          ? <FormHelperText id="outlined-permittedcallers-helper-text"
                            style={{ color: muiTheme.palette.secondary.contrastText }}>
            Enter your smart contract addresses which should be allowed to make off-chain requests through your
            TuringHelper.</FormHelperText>
          : <FormHelperText id="outlined-permittedcallers-helper-text" style={{ color: "#cc0000" }}>
            Address list invalid. Please enter a comma-separated list such as 0x..., 0x... with existing addresses.
          </FormHelperText>}
    </FormControl>

    <CustomButton style={{ marginTop: 14 }}
                  disabled={account === undefined || loadingState || !values.validInput || !props.amountBobaForFundingWei}
                  onClick={async () => {
              newTransaction = true;
              await deployTuringHelper(values.parsedPermittedCallers, props.amountBobaForFundingWei);
            }}>
      {loadingState
        ? <><FontAwesomeIcon icon={solid("spinner")} spin={true} />&nbsp;{getPrettyTransactionStatus(deployState)}</>
        : `Deploy TuringHelper & Deposit ${formatEther(props.amountBobaForFundingWei?.toString())} BOBA`}</CustomButton>


    {newTuringHelper ?
    <>
      <p style={{ fontSize: "0.7em", color: muiTheme.palette.primary.main, marginTop: "2em" }}>
        Congrats, you did it! That's your own TuringHelper:
      </p>

      <Chip label={newTuringHelper} color="primary" style={{ paddingLeft: 6 }}
            icon={<FontAwesomeIcon bounce={true} icon={solid("file-contract")} />}
            onClick={async () => {
              await navigator.clipboard.writeText(newTuringHelper);
              toast("Contract address copied", { type: "info" });
            }} />
    </> : ''}
  </div>;
};
