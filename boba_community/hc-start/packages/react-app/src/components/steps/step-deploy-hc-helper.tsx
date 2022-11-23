import { HybridComputeHelperFactory } from "@hc/contracts/gen/types";
import { Contract } from "@ethersproject/contracts";
import { abis, addresses } from "@hc/contracts";
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

interface IStepDeployHybridComputeHelperProps {
  amountBobaForFundingWei: BigNumber;
}

interface IStepDeployHybridComputeHelperState {
  unparsedPermittedCallers: string;
  parsedPermittedCallers: string[];
  validInput: boolean;
}

let newTransaction = true;
export const StepDeployHybridComputeHelper = (props: IStepDeployHybridComputeHelperProps) => {
  const { account } = useEthers();
  const contractTuringFactory: HybridComputeHelperFactory = new Contract(addresses.HybridComputeHelperFactory, new utils.Interface(abis.HybridComputeHelperFactory)) as HybridComputeHelperFactory;

  //#region form_handling
  const [values, setValues] = React.useState<IStepDeployHybridComputeHelperState>({
    unparsedPermittedCallers: "",
    parsedPermittedCallers: [],
    validInput: false
  });

  const {
    state: deployState,
    send: deployHybridComputeHelper
  } = useContractFunction(contractTuringFactory, "deployMinimal", { transactionName: "DeployHybridComputeHelper" });
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
  const [newHybridComputeHelper, setNewHybridComputeHelper] = useState<string>("");

  const { loading, error: subgraphQueryError, data: subgraphData } = useQuery(GET_TURING_HELPER_DEPLOYED, {
    skip: !(deployState.status === "Success")
  });

  useEffect(() => {
    if (subgraphQueryError) {
      toast("Error while querying subgraph:" + subgraphQueryError.message, { type: "error" });
      return;
    }
    if (!loading && subgraphData && subgraphData.HybridComputeHelperDeployedEvents) {
      setNewHybridComputeHelper(subgraphData.HybridComputeHelperDeployedEvents[0].proxy);
    }
  }, [loading, subgraphQueryError, subgraphData]);
  //#endregion

  if (newTransaction) {
    newTransaction = enableNotifications(deployState);
  }

  return <div style={{ textAlign: "center", marginTop: "2em" }}>
    <SmallerParagraph>Let's deploy the HybridComputeHelper contract. This will also fund the BobaCredit contract (deployed by
      Boba) and assign the prepaid funds to your new HybridComputeHelper.</SmallerParagraph>

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
            HybridComputeHelper.</FormHelperText>
          : <FormHelperText id="outlined-permittedcallers-helper-text" style={{ color: "#cc0000" }}>
            Address list invalid. Please enter a comma-separated list such as 0x..., 0x... with existing addresses.
          </FormHelperText>}
    </FormControl>

    <CustomButton style={{ marginTop: 14 }}
                  disabled={account === undefined || loadingState || !values.validInput || !props.amountBobaForFundingWei}
                  onClick={async () => {
              newTransaction = true;
              await deployHybridComputeHelper(values.parsedPermittedCallers, props.amountBobaForFundingWei);
            }}>
      {loadingState
        ? <><FontAwesomeIcon icon={solid("spinner")} spin={true} />&nbsp;{getPrettyTransactionStatus(deployState)}</>
        : `Deploy HybridComputeHelper & Deposit ${formatEther(props.amountBobaForFundingWei?.toString())} BOBA`}</CustomButton>


    {newHybridComputeHelper ?
    <>
      <p style={{ fontSize: "0.7em", color: muiTheme.palette.primary.main, marginTop: "2em" }}>
        Congrats, you did it! That's your own HybridComputeHelper:
      </p>

      <Chip label={newHybridComputeHelper} color="primary" style={{ paddingLeft: 6 }}
            icon={<FontAwesomeIcon bounce={true} icon={solid("file-contract")} />}
            onClick={async () => {
              await navigator.clipboard.writeText(newHybridComputeHelper);
              toast("Contract address copied", { type: "info" });
            }} />
    </> : ''}
  </div>;
};
